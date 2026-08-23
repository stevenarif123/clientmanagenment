<?php
/**
 * API Logger Utility
 * Logs API requests for debugging
 */

require_once __DIR__ . '/../config/database.php';

class Logger {
    private $db;
    private $logToFile;
    private $logPath;

    public function __construct(bool $logToFile = true) {
        $this->db = Database::getInstance();
        $this->logToFile = $logToFile;
        $this->logPath = __DIR__ . '/../logs/';
    }

    /**
     * Log API request
     */
    public function logRequest(
        string $endpoint,
        string $method,
        ?int $adminId = null,
        ?string $requestBody = null,
        ?int $responseCode = null
    ): void {
        try {
            $this->db->insert('api_logs', [
                'endpoint' => $endpoint,
                'method' => $method,
                'admin_id' => $adminId,
                'ip_address' => $this->getClientIP(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'request_body' => $requestBody ? substr($requestBody, 0, 5000) : null,
                'response_code' => $responseCode
            ]);
        } catch (\Exception $e) {
            // If database logging fails, log to file
            $this->logToFile('error', "Failed to log to database: " . $e->getMessage());
        }
    }

    /**
     * Log error
     */
    public function logError(string $message, array $context = []): void {
        $this->logToFile('error', $message, $context);
    }

    /**
     * Log info
     */
    public function logInfo(string $message, array $context = []): void {
        $this->logToFile('info', $message, $context);
    }

    /**
     * Log debug
     */
    public function logDebug(string $message, array $context = []): void {
        $config = $this->db->getConfig();
        if ($config['APP_DEBUG'] ?? false) {
            $this->logToFile('debug', $message, $context);
        }
    }

    /**
     * Write to log file
     */
    private function logToFile(string $level, string $message, array $context = []): void {
        if (!$this->logToFile) {
            return;
        }

        // Ensure log directory exists
        if (!is_dir($this->logPath)) {
            mkdir($this->logPath, 0755, true);
        }

        $filename = $this->logPath . date('Y-m-d') . '.log';
        $timestamp = date('Y-m-d H:i:s');
        $contextString = !empty($context) ? json_encode($context) : '';
        
        $logLine = "[{$timestamp}] [{$level}] {$message} {$contextString}" . PHP_EOL;
        
        file_put_contents($filename, $logLine, FILE_APPEND | LOCK_EX);
    }

    /**
     * Get client IP address
     */
    private function getClientIP(): string {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_X_FORWARDED_FOR',      // Proxy
            'HTTP_X_REAL_IP',            // Nginx
            'REMOTE_ADDR'                // Default
        ];

        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // If there are multiple IPs (proxy chain), get the first one
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return 'unknown';
    }

    /**
     * Clean old logs (older than 30 days)
     */
    public function cleanOldLogs(int $daysToKeep = 30): int {
        // Clean database logs
        $cutoffDate = date('Y-m-d H:i:s', strtotime("-{$daysToKeep} days"));
        $sql = "DELETE FROM api_logs WHERE created_at < ?";
        $this->db->query($sql, [$cutoffDate]);

        // Clean file logs
        $count = 0;
        $files = glob($this->logPath . '*.log');
        foreach ($files as $file) {
            if (filemtime($file) < strtotime("-{$daysToKeep} days")) {
                unlink($file);
                $count++;
            }
        }

        return $count;
    }
}
