<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$db = Database::getInstance();
$newPassword = 'Mantapfb1_';
$hash = AuthMiddleware::hashPassword($newPassword);

echo "Hashing password: {$newPassword}\n";

$admins = $db->fetchAll("SELECT * FROM admins");
if (!empty($admins)) {
    foreach ($admins as $a) {
        $db->update('admins', ['password_hash' => $hash], 'id = ?', [$a['id']]);
        echo "Updated admin [ID: {$a['id']}, Username: {$a['username']}] password to: {$newPassword}\n";
    }
} else {
    $adminId = $db->insert('admins', [
        'username' => 'admin',
        'password_hash' => $hash,
        'email' => 'admin@clienthub.com'
    ]);
    echo "Created default admin [ID: {$adminId}, Username: admin] with password: {$newPassword}\n";
}

// Clear all active sessions so next login requires the new password
$db->delete('sessions', '1=1');
echo "Cleared all old active sessions.\n";

// Verify password
$testAdmin = $db->fetch("SELECT * FROM admins LIMIT 1");
$verify = AuthMiddleware::verifyPassword($newPassword, $testAdmin['password_hash']);
echo "Verification check: " . ($verify ? "SUCCESS (Password verified)" : "FAILED") . "\n";
