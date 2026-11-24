<?php
/**
 * Authentication API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Check if initial setup is needed
 */
function handleCheckSetup(): void {
    $db = Database::getInstance();
    
    $result = $db->fetch("SELECT COUNT(*) as count FROM admins");
    $needsSetup = (int)($result['count'] ?? 0) === 0;
    
    Response::success(['needs_setup' => $needsSetup]);
}

/**
 * Initial setup - create first admin account
 */
function handleSetup(array $body): void {
    $db = Database::getInstance();
    
    // Check if setup already done
    $result = $db->fetch("SELECT COUNT(*) as count FROM admins");
    if ((int)($result['count'] ?? 0) > 0) {
        Response::error('Setup already completed', 400);
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('username', 'Username is required')
        ->minLength('username', 3, 'Username must be at least 3 characters')
        ->maxLength('username', 50, 'Username must not exceed 50 characters')
        ->required('password', 'Password is required')
        ->minLength('password', 6, 'Password must be at least 6 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create admin account
    $passwordHash = AuthMiddleware::hashPassword($body['password']);
    
    $adminId = $db->insert('admins', [
        'username' => Validator::sanitize($body['username']),
        'password_hash' => $passwordHash,
        'email' => isset($body['email']) ? Validator::sanitize($body['email']) : null
    ]);
    
    // Create session
    $auth = new AuthMiddleware();
    $token = $auth->createSession($adminId);
    
    Response::success([
        'token' => $token,
        'admin' => [
            'id' => $adminId,
            'username' => $body['username'],
            'email' => $body['email'] ?? null
        ]
    ], 'Admin account created successfully');
}

/**
 * Admin login
 */
function handleLogin(array $body): void {
    $db = Database::getInstance();
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('username', 'Username is required')
        ->required('password', 'Password is required');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Find admin
    $admin = $db->fetch(
        "SELECT id, username, password_hash, email FROM admins WHERE username = ?",
        [$body['username']]
    );
    
    if (!$admin) {
        Response::error('Invalid username or password', 401);
    }
    
    // Verify password
    if (!AuthMiddleware::verifyPassword($body['password'], $admin['password_hash'])) {
        Response::error('Invalid username or password', 401);
    }
    
    // Create session
    $auth = new AuthMiddleware();
    $token = $auth->createSession($admin['id']);
    
    Response::success([
        'token' => $token,
        'admin' => [
            'id' => $admin['id'],
            'username' => $admin['username'],
            'email' => $admin['email']
        ]
    ], 'Login successful');
}

/**
 * Admin logout
 */
function handleLogout(string $token): void {
    if (empty($token)) {
        Response::error('No active session', 400);
    }
    
    if ($token !== 'api_key_session') {
        $auth = new AuthMiddleware();
        $auth->destroySession($token);
    }
    
    Response::success(null, 'Logged out successfully');
}

/**
 * Verify current session
 */
function handleVerify(?array $admin): void {
    if (!$admin) {
        Response::unauthorized('Invalid or expired session');
    }
    
    Response::success([
        'admin' => [
            'id' => $admin['admin_id'],
            'username' => $admin['username'],
            'email' => $admin['email']
        ]
    ], 'Session valid');
}

/**
 * Update admin profile
 */
function handleUpdateProfile(int $adminId, array $body): void {
    $db = Database::getInstance();
    
    $validator = new Validator($body);
    $validator
        ->required('username', 'Username is required')
        ->minLength('username', 3, 'Username must be at least 3 characters')
        ->email('email');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if username is taken by another admin
    $existing = $db->fetch("SELECT id FROM admins WHERE username = ? AND id != ?", [$body['username'], $adminId]);
    if ($existing) {
        Response::error('Username already in use', 400);
    }
    
    $db->update('admins', [
        'username' => Validator::sanitize($body['username']),
        'email' => isset($body['email']) ? Validator::sanitize($body['email']) : null
    ], 'id = ?', [$adminId]);
    
    $admin = $db->fetch("SELECT id, username, email FROM admins WHERE id = ?", [$adminId]);
    Response::success($admin, 'Profile updated successfully');
}

/**
 * Change admin password
 */
function handleChangePassword(int $adminId, array $body): void {
    $db = Database::getInstance();
    
    $validator = new Validator($body);
    $validator
        ->required('current_password', 'Current password is required')
        ->required('new_password', 'New password is required')
        ->minLength('new_password', 6, 'New password must be at least 6 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $admin = $db->fetch("SELECT password_hash FROM admins WHERE id = ?", [$adminId]);
    if (!$admin || !AuthMiddleware::verifyPassword($body['current_password'], $admin['password_hash'])) {
        Response::error('Current password is incorrect', 400);
    }
    
    $newHash = AuthMiddleware::hashPassword($body['new_password']);
    $db->update('admins', [
        'password_hash' => $newHash
    ], 'id = ?', [$adminId]);
    
    Response::success(null, 'Password changed successfully');
}
