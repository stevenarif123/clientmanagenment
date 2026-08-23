<?php
/**
 * Public Client Portal API
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Get public project portal data by secret token (No Auth Required)
 */
function getPortalData(string $token): void {
    $db = Database::getInstance();

    if (empty($token) || strlen($token) < 8) {
        Response::error('Invalid portal token', 400);
    }

    // 1. Fetch project by portal token
    $sql = "SELECT p.id, p.title, p.description, p.status, p.start_date, p.end_date, 
                   p.total_budget, p.currency, p.portal_enabled, p.created_at,
                   c.name as client_name, c.company as client_company,
                   s.name as service_name
            FROM projects p
            JOIN clients c ON p.client_id = c.id
            LEFT JOIN services s ON p.service_id = s.id
            WHERE p.portal_token = ?";

    $project = $db->fetch($sql, [$token]);

    if (!$project) {
        Response::notFound('Project portal not found or token has expired');
    }

    if (isset($project['portal_enabled']) && (int)$project['portal_enabled'] === 0) {
        Response::error('Client portal access for this project has been disabled by the project administrator', 403);
    }

    $projectId = (int)$project['id'];

    // 2. Fetch Tasks & Milestones
    $tasks = $db->fetchAll(
        "SELECT id, title, description, status, priority, due_date, completed_at 
         FROM project_tasks 
         WHERE project_id = ? 
         ORDER BY 
           CASE status 
             WHEN 'In Progress' THEN 1 
             WHEN 'Todo' THEN 2 
             WHEN 'Completed' THEN 3 
             ELSE 4 
           END, 
           due_date ASC, 
           id ASC",
        [$projectId]
    );

    $totalTasks = count($tasks);
    $completedTasks = 0;
    foreach ($tasks as $t) {
        if ($t['status'] === 'Completed') $completedTasks++;
    }
    $workProgressPercent = $totalTasks > 0 ? (int)round(($completedTasks / $totalTasks) * 100) : 0;

    // 3. Fetch Deliverables & Project Files
    $files = $db->fetchAll(
        "SELECT id, file_url, original_name, file_size, uploaded_at 
         FROM file_uploads 
         WHERE project_id = ? 
         ORDER BY uploaded_at DESC",
        [$projectId]
    );

    // 4. Fetch Payment Progress Summary (Safe client-facing summary)
    $paymentSummary = $db->fetch(
        "SELECT COALESCE(SUM(amount), 0) as total_received 
         FROM project_payments 
         WHERE project_id = ? AND status = 'Received'",
        [$projectId]
    );

    $totalBudget = (float)$project['total_budget'];
    $totalReceived = (float)($paymentSummary['total_received'] ?? 0);
    $paymentPercent = $totalBudget > 0 ? (int)round(($totalReceived / $totalBudget) * 100) : 0;
    $remainingBalance = max(0, $totalBudget - $totalReceived);

    // 5. Recent Payments List
    $payments = $db->fetchAll(
        "SELECT amount, payment_date, payment_method, status 
         FROM project_payments 
         WHERE project_id = ? 
         ORDER BY payment_date DESC",
        [$projectId]
    );

    Response::success([
        'project' => [
            'title' => $project['title'],
            'description' => $project['description'],
            'status' => $project['status'],
            'service_name' => $project['service_name'] ?? 'Custom Project Service',
            'start_date' => $project['start_date'],
            'end_date' => $project['end_date'],
            'client_name' => $project['client_name'],
            'client_company' => $project['client_company'],
            'created_at' => $project['created_at']
        ],
        'progress' => [
            'work_percent' => $workProgressPercent,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'tasks' => $tasks
        ],
        'files' => $files,
        'billing' => [
            'total_budget' => $totalBudget,
            'total_received' => $totalReceived,
            'remaining_balance' => $remainingBalance,
            'payment_percent' => $paymentPercent,
            'payments' => $payments
        ]
    ]);
}

/**
 * Regenerate secret portal token for a project (Admin Only)
 */
function regeneratePortalToken(int $projectId): void {
    $db = Database::getInstance();

    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }

    $newToken = bin2hex(random_bytes(16));

    $db->update('projects', [
        'portal_token' => $newToken,
        'updated_at' => date('Y-m-d H:i:s')
    ], 'id = ?', [$projectId]);

    Response::success([
        'portal_token' => $newToken
    ], 'Client portal link regenerated successfully');
}
