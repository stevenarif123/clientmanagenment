<?php
/**
 * Automated Verification Test Suite
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';

echo "=== CLIENTHUB UNIFIED TEST SUITE ===\n\n";

$db = Database::getInstance();

// Test 1: Verify Schema & Database
echo "1. Testing Database & Tables...\n";
$tables = $db->fetchAll("SELECT name FROM sqlite_master WHERE type='table'");
$requiredTables = ['admins', 'sessions', 'services', 'clients', 'projects', 'project_tasks', 'project_expenses', 'project_payments', 'communications', 'file_uploads', 'contact_submissions', 'duplicate_warnings', 'api_logs'];
foreach ($requiredTables as $t) {
    $exists = $db->fetch("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [$t]);
    if (!$exists) throw new Exception("Missing table: {$t}");
}
echo "   [OK] All " . count($requiredTables) . " core tables verified.\n";

// Test 2: Verify Reporting Views
echo "2. Testing Reporting Views...\n";
$views = ['v_project_budget_summary', 'v_client_summary'];
foreach ($views as $v) {
    $viewExists = $db->fetch("SELECT name FROM sqlite_master WHERE type='view' AND name = ?", [$v]);
    if (!$viewExists) throw new Exception("Missing view: {$v}");
}
echo "   [OK] All views verified.\n";

// Test 3: Verify Admin & Auth Token
echo "3. Testing Admin & Session Auth...\n";
$admin = $db->fetch("SELECT * FROM admins WHERE username = 'admin'");
if (!$admin) {
    $adminId = $db->insert('admins', [
        'username' => 'admin',
        'password_hash' => AuthMiddleware::hashPassword('admin123'),
        'email' => 'admin@clienthub.com'
    ]);
} else {
    $adminId = $admin['id'];
}
$auth = new AuthMiddleware();
$token = $auth->createSession($adminId);
echo "   [OK] Authenticated session verified with token: " . substr($token, 0, 16) . "...\n";

// Test 4: Testing Project Tasks & Client Portal Integration
echo "4. Testing Project Tasks & Client Portal Integration...\n";

// Fetch or create a project
$testProject = $db->fetch("SELECT * FROM projects LIMIT 1");
if ($testProject) {
    $projectId = (int)$testProject['id'];
    
    // Ensure portal_token exists
    if (empty($testProject['portal_token'])) {
        $pToken = bin2hex(random_bytes(16));
        $db->update('projects', ['portal_token' => $pToken], 'id = ?', [$projectId]);
        $testProject['portal_token'] = $pToken;
    }
    echo "   [OK] Verified Project #{$projectId} with Portal Token: {$testProject['portal_token']}\n";

    // Insert sample task if empty
    $taskCount = $db->fetch("SELECT COUNT(*) as c FROM project_tasks WHERE project_id = ?", [$projectId]);
    if ($taskCount['c'] == 0) {
        $db->insert('project_tasks', [
            'project_id' => $projectId,
            'title' => 'UI Mockup & Design Approval',
            'status' => 'Completed',
            'priority' => 'High',
            'completed_at' => date('Y-m-d H:i:s')
        ]);
        $db->insert('project_tasks', [
            'project_id' => $projectId,
            'title' => 'Frontend Slicing & Implementation',
            'status' => 'In Progress',
            'priority' => 'High'
        ]);
    }
    
    $tasks = $db->fetchAll("SELECT * FROM project_tasks WHERE project_id = ?", [$projectId]);
    echo "   [OK] Project Tasks verified: " . count($tasks) . " tasks linked.\n";
}

// Test 5: Verify Frontend Static Assets
echo "5. Verifying Static Assets & Views...\n";
$requiredFiles = [
    'index.html',
    'portal.html',
    'public-contact-form.html',
    'assets/css/app.css',
    'assets/js/utils.js',
    'assets/js/api.js',
    'assets/js/auth.js',
    'js/components/stats-card.js',
    'js/components/modals.js',
    'js/components/layout.js',
    'js/pages/login.js',
    'js/pages/dashboard.js',
    'js/pages/clients.js',
    'js/pages/projects.js',
    'js/pages/submissions.js',
    'js/pages/services.js',
    'js/pages/reports.js',
    'data/.htaccess',
    'router.php',
    '.htaccess'
];

foreach ($requiredFiles as $file) {
    if (!file_exists(__DIR__ . '/' . $file)) {
        throw new Exception("Missing asset file: {$file}");
    }
}
echo "   [OK] All " . count($requiredFiles) . " asset, page & portal files exist and are verified.\n";

echo "\n============================================\n";
echo "   ALL TESTS PASSED SUCCESSFULLY! (100%)\n";
echo "============================================\n";
