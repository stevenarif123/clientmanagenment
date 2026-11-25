<?php
/**
 * Reports API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Get dashboard statistics
 */
function getDashboardStats(): void {
    $db = Database::getInstance();
    
    // Total counts
    $clientCount = $db->fetch("SELECT COUNT(*) as count FROM clients")['count'] ?? 0;
    $projectCount = $db->fetch("SELECT COUNT(*) as count FROM projects")['count'] ?? 0;
    $activeProjects = $db->fetch("SELECT COUNT(*) as count FROM projects WHERE status = 'In Progress'")['count'] ?? 0;
    $pendingSubmissions = $db->fetch("SELECT COUNT(*) as count FROM contact_submissions WHERE status = 'New'")['count'] ?? 0;
    
    // Budget summary
    $budgetStats = $db->fetch(
        "SELECT 
            COALESCE(SUM(total_budget), 0) as total_budget,
            COALESCE(SUM(e.total_expenses), 0) as total_expenses,
            COALESCE(SUM(p.total_received), 0) as total_received
         FROM projects pr
         LEFT JOIN (
            SELECT project_id, SUM(amount) as total_expenses 
            FROM project_expenses GROUP BY project_id
         ) e ON pr.id = e.project_id
         LEFT JOIN (
            SELECT project_id, SUM(amount) as total_received 
            FROM project_payments WHERE status = 'Received' GROUP BY project_id
         ) p ON pr.id = p.project_id"
    );
    
    // Projects by status
    $projectsByStatus = $db->fetchAll(
        "SELECT status, COUNT(*) as count 
         FROM projects 
         GROUP BY status 
         ORDER BY count DESC"
    );
    
    // Recent clients
    $recentClients = $db->fetchAll(
        "SELECT id, name, email, company, created_at 
         FROM clients 
         ORDER BY created_at DESC 
         LIMIT 5"
    );
    
    // Recent projects
    $recentProjects = $db->fetchAll(
        "SELECT p.id, p.title, p.status, p.total_budget, c.name as client_name, p.created_at
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         ORDER BY p.created_at DESC 
         LIMIT 5"
    );
    
    // Recent submissions
    $recentSubmissions = $db->fetchAll(
        "SELECT id, name, email, status, is_duplicate, created_at
         FROM contact_submissions
         ORDER BY created_at DESC 
         LIMIT 5"
    );
    
    // Monthly revenue (last 6 months)
    $monthlyRevenue = $db->fetchAll(
        "SELECT 
            strftime('%Y-%m', payment_date) as month,
            SUM(amount) as total
         FROM project_payments
         WHERE status = 'Received'
         AND payment_date >= date('now', '-6 months')
         GROUP BY strftime('%Y-%m', payment_date)
         ORDER BY month ASC"
    );

    // Real task workload counts
    $taskRow = $db->fetch(
        "SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Todo' THEN 1 ELSE 0 END) as todo,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'Review' THEN 1 ELSE 0 END) as review,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status != 'Completed' AND due_date IS NOT NULL AND due_date != '' AND date(due_date) < date('now') THEN 1 ELSE 0 END) as overdue
         FROM project_tasks"
    );

    // Tasks grouped by priority
    $tasksByPriority = $db->fetchAll(
        "SELECT priority, COUNT(*) as count
         FROM project_tasks
         GROUP BY priority"
    );

    // Active projects progress via pre-aggregated subquery (no cross-join multiplication)
    $activeProjectsProgress = $db->fetchAll(
        "SELECT
            p.id,
            p.title,
            p.status,
            c.name as client_name,
            COALESCE(t.task_total, 0) as task_total,
            COALESCE(t.task_completed, 0) as task_completed,
            CASE
                WHEN COALESCE(t.task_total, 0) > 0
                THEN ROUND((COALESCE(t.task_completed, 0) * 100.0) / t.task_total)
                ELSE 0
            END as task_progress
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN (
            SELECT
                project_id,
                COUNT(*) as task_total,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as task_completed
            FROM project_tasks
            GROUP BY project_id
         ) t ON p.id = t.project_id
         WHERE p.status NOT IN ('Cancelled', 'Completed')
         ORDER BY p.updated_at DESC, p.id DESC
         LIMIT 8"
    );
    foreach ($activeProjectsProgress as &$apRow) {
        $apRow['id'] = (int)$apRow['id'];
        $apRow['task_total'] = (int)$apRow['task_total'];
        $apRow['task_completed'] = (int)$apRow['task_completed'];
        $apRow['task_progress'] = (int)$apRow['task_progress'];
    }
    unset($apRow);

    // Recent tasks across projects
    $recentTasks = $db->fetchAll(
        "SELECT
            pt.id,
            pt.project_id,
            p.title as project_title,
            pt.title,
            pt.status,
            pt.priority,
            pt.due_date,
            pt.updated_at
         FROM project_tasks pt
         LEFT JOIN projects p ON pt.project_id = p.id
         ORDER BY pt.updated_at DESC, pt.id DESC
         LIMIT 6"
    );
    
    Response::success([
        'counts' => [
            'clients' => (int)$clientCount,
            'projects' => (int)$projectCount,
            'active_projects' => (int)$activeProjects,
            'pending_submissions' => (int)$pendingSubmissions
        ],
        'task_counts' => [
            'total' => (int)($taskRow['total'] ?? 0),
            'todo' => (int)($taskRow['todo'] ?? 0),
            'in_progress' => (int)($taskRow['in_progress'] ?? 0),
            'review' => (int)($taskRow['review'] ?? 0),
            'completed' => (int)($taskRow['completed'] ?? 0),
            'overdue' => (int)($taskRow['overdue'] ?? 0)
        ],
        'tasks_by_priority' => $tasksByPriority,
        'active_projects_progress' => $activeProjectsProgress,
        'recent_tasks' => $recentTasks,
        'budget' => [
            'total_budget' => (float)($budgetStats['total_budget'] ?? 0),
            'total_expenses' => (float)($budgetStats['total_expenses'] ?? 0),
            'total_received' => (float)($budgetStats['total_received'] ?? 0),
            'profit' => (float)($budgetStats['total_received'] ?? 0) - (float)($budgetStats['total_expenses'] ?? 0)
        ],
        'projects_by_status' => $projectsByStatus,
        'recent_clients' => $recentClients,
        'recent_projects' => $recentProjects,
        'recent_submissions' => $recentSubmissions,
        'monthly_revenue' => $monthlyRevenue
    ]);
}

/**
 * Get financial report for date range
 */
function getFinancialReport(array $params): void {
    $db = Database::getInstance();
    
    $startDate = $params['start'] ?? date('Y-m-01');
    $endDate = $params['end'] ?? date('Y-m-d');
    
    // Total revenue and expenses
    $totalRevResult = $db->fetch(
        "SELECT COALESCE(SUM(amount), 0) as total_revenue FROM project_payments WHERE status = 'Received' AND payment_date BETWEEN ? AND ?",
        [$startDate, $endDate]
    );
    $totalExpResult = $db->fetch(
        "SELECT COALESCE(SUM(amount), 0) as total_expenses FROM project_expenses WHERE expense_date BETWEEN ? AND ?",
        [$startDate, $endDate]
    );
    
    // Completed projects count (use date() so updated_at timestamps on endDate are included)
    $completedProjects = $db->fetch(
        "SELECT COUNT(*) as count
         FROM projects
         WHERE status = 'Completed'
         AND date(updated_at) BETWEEN ? AND ?",
        [$startDate, $endDate]
    )['count'] ?? 0;
    
    // Projects with financial data (pre-aggregated to prevent cross-join multiplication)
    $projects = $db->fetchAll(
        "SELECT p.id, p.title, c.name as client_name,
                COALESCE(e.total_expenses, 0) as total_expenses,
                COALESCE(pay.total_received, 0) as total_received
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN (
            SELECT project_id, SUM(amount) as total_expenses
            FROM project_expenses
            WHERE expense_date BETWEEN ? AND ?
            GROUP BY project_id
         ) e ON p.id = e.project_id
         LEFT JOIN (
            SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received
            FROM project_payments
            WHERE payment_date BETWEEN ? AND ?
            GROUP BY project_id
         ) pay ON p.id = pay.project_id
         WHERE COALESCE(e.total_expenses, 0) > 0 OR COALESCE(pay.total_received, 0) > 0
         ORDER BY total_received DESC",
        [$startDate, $endDate, $startDate, $endDate]
    );
    
    Response::success([
        'total_revenue' => (float)($totalRevResult['total_revenue'] ?? 0),
        'total_expenses' => (float)($totalExpResult['total_expenses'] ?? 0),
        'completed_projects' => (int)$completedProjects,
        'projects' => $projects
    ]);
}

/**
 * Get budget overview
 */
function getBudgetOverview(array $params): void {
    $db = Database::getInstance();
    
    $year = (string)($params['year'] ?? date('Y'));
    
    // Monthly expenses
    $monthlyExpenses = $db->fetchAll(
        "SELECT 
            strftime('%Y-%m', expense_date) as month,
            category,
            SUM(amount) as total
         FROM project_expenses
         WHERE strftime('%Y', expense_date) = ?
         GROUP BY strftime('%Y-%m', expense_date), category
         ORDER BY month ASC",
        [$year]
    );
    
    // Monthly payments
    $monthlyPayments = $db->fetchAll(
        "SELECT 
            strftime('%Y-%m', payment_date) as month,
            status,
            SUM(amount) as total
         FROM project_payments
         WHERE strftime('%Y', payment_date) = ?
         GROUP BY strftime('%Y-%m', payment_date), status
         ORDER BY month ASC",
        [$year]
    );
    
    // Expenses by category
    $expensesByCategory = $db->fetchAll(
        "SELECT 
            category,
            SUM(amount) as total
         FROM project_expenses
         WHERE strftime('%Y', expense_date) = ?
         GROUP BY category
         ORDER BY total DESC",
        [$year]
    );
    
    // Top projects by budget (pre-aggregated to avoid cross-join multiplication)
    $topProjects = $db->fetchAll(
        "SELECT p.id, p.title, p.total_budget, p.status,
                c.name as client_name,
                COALESCE(e.total_expenses, 0) as total_expenses,
                COALESCE(pay.total_received, 0) as total_received
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN (
            SELECT project_id, SUM(amount) as total_expenses
            FROM project_expenses
            GROUP BY project_id
         ) e ON p.id = e.project_id
         LEFT JOIN (
            SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received
            FROM project_payments
            GROUP BY project_id
         ) pay ON p.id = pay.project_id
         ORDER BY p.total_budget DESC
         LIMIT 10"
    );
    
    Response::success([
        'year' => $year,
        'monthly_expenses' => $monthlyExpenses,
        'monthly_payments' => $monthlyPayments,
        'expenses_by_category' => $expensesByCategory,
        'top_projects' => $topProjects
    ]);
}

/**
 * Export clients to CSV
 */
function exportClients(array $params): void {
    $db = Database::getInstance();
    
    $clients = $db->fetchAll(
        "SELECT c.id, c.name, c.email, c.phone, c.company, c.address, c.notes,
                COUNT(DISTINCT p.id) as total_projects,
                COALESCE(SUM(p.total_budget), 0) as total_budget,
                c.created_at
         FROM clients c
         LEFT JOIN projects p ON c.id = p.client_id
         GROUP BY c.id
         ORDER BY c.name ASC"
    );
    
    $format = $params['format'] ?? 'csv';
    
    if ($format === 'csv') {
        exportToCSV($clients, 'clients_export');
    } elseif ($format === 'pdf') {
        exportToPDF($clients, 'clients_report', 'Clients Report');
    } else {
        // Return JSON for XLSX generation on frontend
        Response::success([
            'data' => $clients,
            'columns' => ['ID', 'Name', 'Email', 'Phone', 'Company', 'Address', 'Notes', 'Total Projects', 'Total Budget', 'Created At'],
            'filename' => 'clients_export_' . date('Y-m-d')
        ]);
    }
}

/**
 * Export projects to CSV
 */
function exportProjects(array $params): void {
    $db = Database::getInstance();
    
    $status = $params['status'] ?? '';
    $startDate = $params['start_date'] ?? null;
    $endDate = $params['end_date'] ?? null;
    $where = [];
    $queryParams = [];
    $expWhere = '';
    $payWhere = '';
    $subParams = [];
    
    if ($startDate && $endDate) {
        $expWhere = "WHERE expense_date BETWEEN ? AND ?";
        $payWhere = "WHERE payment_date BETWEEN ? AND ?";
        $subParams = [$startDate, $endDate, $startDate, $endDate];
    }

    if (!empty($status) && in_array($status, PROJECT_STATUSES, true)) {
        $where[] = "p.status = ?";
        $queryParams[] = $status;
    }

    if ($startDate && $endDate) {
        $where[] = "(COALESCE(e.total_expenses, 0) > 0 OR COALESCE(pay.total_received, 0) > 0 OR date(p.created_at) BETWEEN ? AND ?)";
        $queryParams[] = $startDate;
        $queryParams[] = $endDate;
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $projects = $db->fetchAll(
        "SELECT p.id, p.title, c.name as client_name, s.name as service_name,
                p.status, p.start_date, p.end_date, p.total_budget, p.currency,
                COALESCE(e.total_expenses, 0) as total_expenses,
                COALESCE(pay.total_received, 0) as total_received,
                p.created_at
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN services s ON p.service_id = s.id
         LEFT JOIN (
            SELECT project_id, SUM(amount) as total_expenses
            FROM project_expenses
            {$expWhere}
            GROUP BY project_id
         ) e ON p.id = e.project_id
         LEFT JOIN (
            SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received
            FROM project_payments
            {$payWhere}
            GROUP BY project_id
         ) pay ON p.id = pay.project_id
         {$whereClause}
         ORDER BY p.created_at DESC",
        array_merge($subParams, $queryParams)
    );
    
    $format = $params['format'] ?? 'csv';
    
    if ($format === 'csv') {
        exportToCSV($projects, 'projects_export');
    } elseif ($format === 'pdf') {
        exportToPDF($projects, 'projects_report', 'Projects Report');
    } else {
        Response::success([
            'data' => $projects,
            'columns' => ['ID', 'Title', 'Client', 'Service', 'Status', 'Start Date', 'End Date', 'Budget', 'Currency', 'Expenses', 'Received', 'Created At'],
            'filename' => 'projects_export_' . date('Y-m-d')
        ]);
    }
}

/**
 * Export single project detail
 */
function exportProjectDetail(int $id, array $params): void {
    $db = Database::getInstance();
    
    // Get project
    $project = $db->fetch(
        "SELECT p.*, c.name as client_name, c.email as client_email, s.name as service_name
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN services s ON p.service_id = s.id
         WHERE p.id = ?",
        [$id]
    );
    
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Get expenses
    $expenses = $db->fetchAll(
        "SELECT description, amount, category, expense_date, notes
         FROM project_expenses
         WHERE project_id = ?
         ORDER BY expense_date DESC",
        [$id]
    );
    
    // Get payments
    $payments = $db->fetchAll(
        "SELECT amount, payment_date, payment_method, status, notes
         FROM project_payments
         WHERE project_id = ?
         ORDER BY payment_date DESC",
        [$id]
    );
    
    // Budget summary
    $totalExpenses = array_sum(array_column($expenses, 'amount'));
    $totalReceived = array_sum(array_map(function($p) {
        return $p['status'] === 'Received' ? (float)$p['amount'] : 0;
    }, $payments));
    
    Response::success([
        'project' => $project,
        'expenses' => $expenses,
        'payments' => $payments,
        'summary' => [
            'total_budget' => (float)$project['total_budget'],
            'total_expenses' => $totalExpenses,
            'total_received' => $totalReceived,
            'remaining_budget' => (float)$project['total_budget'] - $totalExpenses,
            'profit' => $totalReceived - $totalExpenses
        ],
        'filename' => 'project_' . $id . '_' . date('Y-m-d')
    ]);
}

/**
 * Helper function to export to CSV
 */
function exportToCSV(array $data, string $filename): void {
    if (empty($data)) {
        Response::error('No data to export', 400);
    }
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Add BOM for Excel UTF-8 compatibility
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // Headers
    fputcsv($output, array_keys($data[0]), ',', '"', '');
    
    // Data rows
    foreach ($data as $row) {
        fputcsv($output, $row, ',', '"', '');
    }
    
    fclose($output);
    exit;
}

/**
 * Export data to PDF (simplified HTML version)
 */
function exportToPDF(array $data, string $filename, string $title = 'Report'): void {
    if (empty($data)) {
        Response::error('No data to export', 400);
    }
    
    // Export as HTML that opens print dialog
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: inline; filename="' . $filename . '_' . date('Y-m-d') . '.html"');
    
    echo '<!DOCTYPE html>';
    echo '<html><head>';
    echo '<meta charset="UTF-8">';
    echo '<title>' . htmlspecialchars($title) . '</title>';
    echo '<style>';
    echo 'body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; background: #f8fafc; color: #0f172a; }';
    echo '.container { background: white; padding: 32px; max-width: 1120px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; }';
    echo 'h1 { color: #0f172a; font-size: 22px; margin: 0 0 6px 0; }';
    echo 'table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }';
    echo 'th { background: #0f172a; color: white; padding: 10px 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }';
    echo 'td { border-bottom: 1px solid #e2e8f0; padding: 10px; }';
    echo 'tr:nth-child(even) td { background: #f8fafc; }';
    echo '.meta { color: #64748b; font-size: 12px; margin: 0 0 18px 0; }';
    echo '.actions { margin-bottom: 20px; padding: 12px 16px; background: #f1f5f9; border-radius: 8px; display: flex; gap: 10px; }';
    echo '.btn { background: #0f172a; color: white; padding: 8px 16px; border: none; cursor: pointer; border-radius: 6px; font-size: 13px; font-weight: 600; }';
    echo '.btn-secondary { background: white; color: #334155; border: 1px solid #cbd5e1; }';
    echo '.currency { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }';
    echo '@media print { body { background: white; margin: 0; } .container { border: none; padding: 0; } .actions { display: none; } @page { margin: 1.2cm; } }';
    echo '</style>';
    echo '</head><body>';
    echo '<div class="container">';
    
    echo '<div class="actions">';
    echo '<button class="btn" onclick="window.print()">Print / Save as PDF</button>';
    echo '<button class="btn btn-secondary" onclick="window.close()">Close</button>';
    echo '</div>';
    
    echo '<h1>ClientHub — ' . htmlspecialchars($title) . '</h1>';
    echo '<p class="meta">Generated: ' . date('Y-m-d H:i:s') . ' &bull; Total Records: ' . count($data) . '</p>';
    echo '<table>';
    
    // Headers
    echo '<thead><tr>';
    foreach (array_keys($data[0]) as $header) {
        echo '<th>' . htmlspecialchars(ucwords(str_replace('_', ' ', $header))) . '</th>';
    }
    echo '</tr></thead>';
    
    // Data rows
    echo '<tbody>';
    foreach ($data as $row) {
        echo '<tr>';
        foreach ($row as $key => $cell) {
            $class = (strpos($key, 'budget') !== false || strpos($key, 'amount') !== false || 
                     strpos($key, 'expenses') !== false || strpos($key, 'received') !== false) 
                     ? 'currency' : '';
            $value = $cell ?? '';
            
            // Format numbers
            if ($class === 'currency' && is_numeric($value)) {
                $value = 'Rp ' . number_format($value, 0, ',', '.');
            }
            
            echo '<td class="' . $class . '">' . htmlspecialchars($value) . '</td>';
        }
        echo '</tr>';
    }
    echo '</tbody></table>';
    
    echo '</div>';
    echo '</body></html>';
    
    exit;
}

/**
 * Download SQLite Database Backup
 */
function handleBackupDatabase(): void {
    $db = Database::getInstance();
    $config = $db->getConfig();
    $dbPath = $config['DB_PATH'] ?? (__DIR__ . '/../data/database.sqlite');
    
    if (!file_exists($dbPath)) {
        Response::error('Database file not found', 404);
    }
    
    header('Content-Type: application/x-sqlite3');
    header('Content-Disposition: attachment; filename="clienthub_backup_' . date('Y-m-d_His') . '.sqlite"');
    header('Content-Length: ' . filesize($dbPath));
    
    readfile($dbPath);
    exit;
}

