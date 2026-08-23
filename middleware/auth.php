<?php
/**
 * Authentication Middleware
 * Verifies session token and protects API routes
 */

require_once __DIR__ . '/../config/database.php';

class AuthMiddleware {
    private $db;
    private $publicRoutes = [
        'POST /api/auth/login',
        'POST /api/auth/setup',
        'GET /api/auth/check-setup',
        'POST /api/submissions', // Public contact form
        'GET /api/services',     // Public services list
    ];

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Check if current request requires authentication
     */
    public function isPublicRoute(string $method, string $uri): bool {
        $route = $method . ' ' . $uri;
        
        foreach ($this->publicRoutes as $publicRoute) {
            if ($route === $publicRoute) {
                return true;
            }
        }

        // Public Client Portal data endpoint (token based)
        if ($method === 'GET' && strpos($uri, '/api/portal/') === 0) {
            return true;
        }
        
        return false;
    }


    public function authenticate(): ?array {
        // 1. Check for X-API-Key header (for AI Agents & MCP integration)
        $apiKey = '';
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $apiKey = $headers['X-API-Key'] ?? $headers['x-api-key'] ?? '';
        }
        if (empty($apiKey) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $apiKey = $headers['X-API-Key'] ?? $headers['x-api-key'] ?? '';
        }
        if (empty($apiKey)) {
            $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['REDIRECT_HTTP_X_API_KEY'] ?? '';
        }

        if (!empty($apiKey)) {
            $configKey = $this->db->getConfig('API_KEY');
            if (!empty($configKey) && hash_equals($configKey, $apiKey)) {
                $admin = $this->db->fetch("SELECT id, username, email FROM admins ORDER BY id ASC LIMIT 1");
                if ($admin) {
                    return [
                        'admin_id' => (int)$admin['id'],
                        'username' => $admin['username'],
                        'email' => $admin['email'],
                        'token' => 'api_key_session'
                    ];
                }
            }
            return null;
        }

        // 2. Check for Authorization Bearer Token (for browser SPA)
        $authHeader = '';
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        if (empty($authHeader) && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }
        if (empty($authHeader)) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        }

        if (empty($authHeader)) {
            return null;
        }

        // Extract Bearer token
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->validateToken(trim($matches[1]));
        }

        return null;
    }


    /**
     * Validate session token
     */
    private function validateToken(string $token): ?array {
        $now = date('Y-m-d H:i:s');
        $sql = "SELECT s.*, a.username, a.email 
                FROM sessions s 
                JOIN admins a ON s.admin_id = a.id 
                WHERE s.token = ? AND s.expires_at > ?";
        
        $session = $this->db->fetch($sql, [$token, $now]);
        
        if (!$session) {
            return null;
        }

        return [
            'admin_id' => (int)$session['admin_id'],
            'username' => $session['username'],
            'email' => $session['email'],
            'token' => $token
        ];
    }

    /**
     * Generate new session token
     */
    public function createSession(int $adminId): string {
        $token = bin2hex(random_bytes(32));
        $config = $this->db->getConfig();
        // 30 days default lifetime for continuous work without unexpected logout
        $lifetime = (int)($config['SESSION_LIFETIME'] ?? 2592000);
        $expiresAt = date('Y-m-d H:i:s', time() + $lifetime);

        // Clean up expired sessions
        $now = date('Y-m-d H:i:s');
        $this->db->query("DELETE FROM sessions WHERE expires_at < ?", [$now]);

        // Create new session
        $this->db->insert('sessions', [
            'admin_id' => $adminId,
            'token' => $token,
            'expires_at' => $expiresAt
        ]);

        return $token;
    }


    /**
     * Destroy session
     */
    public function destroySession(string $token): bool {
        $result = $this->db->delete('sessions', 'token = ?', [$token]);
        return $result > 0;
    }

    /**
     * Hash password
     */
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }
}
