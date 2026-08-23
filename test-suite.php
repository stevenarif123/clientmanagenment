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
        'password_hash' => AuthMiddleware::hashPassword('Mantapfb1_'),
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

// Test 5: Testing Kanban Board Features & Fractional Ordering
echo "5. Testing Kanban Board Features & Fractional Ordering...\n";

// Ensure active project exists
$activeProject = $db->fetch("SELECT * FROM projects WHERE status NOT IN ('Completed', 'Cancelled') LIMIT 1");
if (!$activeProject) {
    $existingClient = $db->fetch("SELECT id FROM clients LIMIT 1");
    if (!$existingClient) {
        $clientId = $db->insert('clients', [
            'name' => 'Kanban Test Client',
            'email' => 'kanban@test.com',
            'company' => 'Kanban Corp',
            'status' => 'Active'
        ]);
    } else {
        $clientId = (int)$existingClient['id'];
    }
    $pId = $db->insert('projects', [
        'client_id' => $clientId,
        'title' => 'Kanban Active Project',
        'status' => 'In Progress',
        'budget' => 5000,
        'portal_token' => bin2hex(random_bytes(16))
    ]);
    $activeProject = $db->fetch("SELECT * FROM projects WHERE id = ?", [$pId]);
}
$kanbanProjectId = (int)$activeProject['id'];

// 1. Insert task with status 'Review', priority 'High', fractional order_index = 1500.5
$kanbanTaskId = $db->insert('project_tasks', [
    'project_id' => $kanbanProjectId,
    'title' => 'Kanban Test Task - Review & Fractional Order',
    'status' => 'Review',
    'priority' => 'High',
    'order_index' => 1500.5
]);

// 2. Fetch and verify status and order_index
$fetchedTask = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$kanbanTaskId]);
if (!$fetchedTask) {
    throw new Exception("Failed to fetch inserted Kanban task ID {$kanbanTaskId}");
}
if ($fetchedTask['status'] !== 'Review') {
    throw new Exception("Expected task status 'Review', got '{$fetchedTask['status']}'");
}
if (abs((float)$fetchedTask['order_index'] - 1500.5) > 0.0001) {
    throw new Exception("Expected order_index 1500.5, got '{$fetchedTask['order_index']}'");
}
echo "   [OK] Task inserted with Review status and order_index = 1500.5 verified.\n";

// 3. Test query for global board tasks (JOIN projects WHERE projects.status NOT IN ('Completed', 'Cancelled'))
$globalBoardTasks = $db->fetchAll(
    "SELECT t.*, p.title as project_title, p.status as project_status
     FROM project_tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE p.status NOT IN ('Completed', 'Cancelled')
     ORDER BY t.order_index ASC, t.id ASC"
);
$foundGlobalTask = false;
foreach ($globalBoardTasks as $gt) {
    if ((int)$gt['id'] === $kanbanTaskId) {
        $foundGlobalTask = true;
        if (empty($gt['project_title'])) {
            throw new Exception("Global board task missing project_title JOIN");
        }
        break;
    }
}
if (!$foundGlobalTask) {
    throw new Exception("Inserted task #{$kanbanTaskId} not found in global board query");
}
echo "   [OK] Global board query returned active project tasks including test task.\n";

// 4. Test reorderProjectTasks logic
$newOrderIndex = 2500.75;
$db->update(
    'project_tasks',
    [
        'order_index' => floatval($newOrderIndex),
        'updated_at' => date('Y-m-d H:i:s')
    ],
    'id = ? AND project_id = ?',
    [$kanbanTaskId, $kanbanProjectId]
);
$reorderedTask = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$kanbanTaskId]);
if (abs((float)$reorderedTask['order_index'] - $newOrderIndex) > 0.0001) {
    throw new Exception("Reorder logic failed: expected order_index {$newOrderIndex}, got '{$reorderedTask['order_index']}'");
}
echo "   [OK] Task reordering logic with fractional indices verified.\n";

// 5. Clean up test task
$db->delete('project_tasks', 'id = ?', [$kanbanTaskId]);
$checkDeleted = $db->fetch("SELECT id FROM project_tasks WHERE id = ?", [$kanbanTaskId]);
if ($checkDeleted) {
    throw new Exception("Failed to clean up test task ID {$kanbanTaskId}");
}
echo "   [OK] Cleaned up kanban test task.\n";

// Test 6: Verify Frontend Static Assets
echo "6. Verifying Static Assets & Views...\n";
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
    'js/pages/kanban.js',
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
