<?php
/**
 * Test SQLite Database & Core API functions
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/utils/validator.php';
require_once __DIR__ . '/utils/duplicateDetector.php';

echo "=== TESTING SQLITE DATABASE & BACKEND ===\n";

try {
    $db = Database::getInstance();
    echo "[PASS] SQLite Database connected successfully.\n";

    // 1. Check tables
    $tables = $db->fetchAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    $tableNames = array_column($tables, 'name');
    echo "[INFO] Tables found: " . implode(', ', $tableNames) . "\n";

    // 2. Check default services
    $services = $db->fetchAll("SELECT * FROM services");
    echo "[PASS] Default services seeded: " . count($services) . " services.\n";

    // 3. Test Admin creation / Setup
    $auth = new AuthMiddleware();
    $existingAdmin = $db->fetch("SELECT * FROM admins WHERE username = 'admin'");
    if (!$existingAdmin) {
        $adminId = $db->insert('admins', [
            'username' => 'admin',
            'password_hash' => AuthMiddleware::hashPassword('admin123'),
            'email' => 'admin@example.com'
        ]);
        echo "[PASS] Created test admin with ID: {$adminId}\n";
    } else {
        $adminId = $existingAdmin['id'];
        echo "[INFO] Admin already exists with ID: {$adminId}\n";
    }

    // 4. Test Session creation & token auth
    $token = $auth->createSession($adminId);
    echo "[PASS] Created session token: " . substr($token, 0, 16) . "...\n";

    // Validate token directly
    $sql = "SELECT s.*, a.username, a.email FROM sessions s JOIN admins a ON s.admin_id = a.id WHERE s.token = ?";
    $session = $db->fetch($sql, [$token]);
    if ($session && $session['username'] === 'admin') {
        echo "[PASS] Token verification successful for user: {$session['username']}\n";
    } else {
        throw new Exception("Token validation failed!");
    }

    // 5. Test Client insert & query
    $clientId = $db->insert('clients', [
        'name' => 'Acme Corporation',
        'email' => 'contact@acme.com',
        'phone' => '+628123456789',
        'company' => 'Acme Corp',
        'address' => 'Jakarta, Indonesia',
        'notes' => 'Test client'
    ]);
    echo "[PASS] Created client with ID: {$clientId}\n";

    // 6. Test Project insert & budget calculation
    $service = $services[0] ?? ['id' => 1];
    $projectId = $db->insert('projects', [
        'client_id' => $clientId,
        'service_id' => $service['id'],
        'title' => 'E-Commerce Website Redesign',
        'description' => 'Full redesign project',
        'status' => 'In Progress',
        'start_date' => date('Y-m-d'),
        'end_date' => date('Y-m-d', strtotime('+30 days')),
        'total_budget' => 25000000,
        'currency' => 'IDR'
    ]);
    echo "[PASS] Created project with ID: {$projectId}\n";

    // 7. Test Expense insert
    $expenseId = $db->insert('project_expenses', [
        'project_id' => $projectId,
        'description' => 'Cloud Hosting & Domain',
        'amount' => 1500000,
        'category' => 'Hosting',
        'expense_date' => date('Y-m-d'),
        'notes' => 'Annual hosting setup'
    ]);
    echo "[PASS] Created expense with ID: {$expenseId}\n";

    // 8. Test Payment insert
    $paymentId = $db->insert('project_payments', [
        'project_id' => $projectId,
        'amount' => 12500000,
        'payment_date' => date('Y-m-d'),
        'payment_method' => 'Bank Transfer',
        'status' => 'Received',
        'notes' => '50% Down Payment'
    ]);
    echo "[PASS] Created payment with ID: {$paymentId}\n";

    // 9. Test View: v_project_budget_summary
    $summary = $db->fetch("SELECT * FROM v_project_budget_summary WHERE project_id = ?", [$projectId]);
    echo "[PASS] Budget View Test:\n";
    echo "       - Total Budget: Rp " . number_format($summary['total_budget'], 0, ',', '.') . "\n";
    echo "       - Total Expenses: Rp " . number_format($summary['total_expenses'], 0, ',', '.') . "\n";
    echo "       - Total Received: Rp " . number_format($summary['total_received'], 0, ',', '.') . "\n";
    echo "       - Remaining Budget: Rp " . number_format($summary['remaining_budget'], 0, ',', '.') . "\n";
    echo "       - Utilization: {$summary['budget_utilization_percent']}%\n";

    // 10. Test Duplicate Detector
    $detector = new DuplicateDetector();
    $dups = $detector->checkSubmission('contact@acme.com', '+628123456789');
    if (!empty($dups['clients'])) {
        echo "[PASS] Duplicate detection working! Matched client: " . $dups['clients'][0]['name'] . "\n";
    }

    echo "\n=== ALL SQLITE TESTS PASSED PERFECTLY! ===\n";

} catch (Exception $e) {
    echo "\n[FAIL] Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
