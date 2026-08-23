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
    
    Response::success([
        'counts' => [
            'clients' => (int)$clientCount,
            'projects' => (int)$projectCount,
            'active_projects' => (int)$activeProjects,
            'pending_submissions' => (int)$pendingSubmissions
        ],
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
    
    // Completed projects count
    $completedProjects = $db->fetch(
        "SELECT COUNT(*) as count
         FROM projects
         WHERE status = 'Completed'
         AND updated_at BETWEEN ? AND ?",
        [$startDate, $endDate]
    )['count'] ?? 0;
    
    // Projects with financial data
    $projects = $db->fetchAll(
        "SELECT p.id, p.title, c.name as client_name,
                COALESCE(SUM(e.amount), 0) as total_expenses,
                COALESCE(SUM(CASE WHEN pay.status = 'Received' THEN pay.amount ELSE 0 END), 0) as total_received
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN project_expenses e ON p.id = e.project_id 
            AND e.expense_date BETWEEN ? AND ?
         LEFT JOIN project_payments pay ON p.id = pay.project_id 
            AND pay.payment_date BETWEEN ? AND ?
         GROUP BY p.id, c.name
         HAVING COALESCE(SUM(e.amount), 0) > 0 OR COALESCE(SUM(CASE WHEN pay.status = 'Received' THEN pay.amount ELSE 0 END), 0) > 0
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
    
    // Top projects by budget
    $topProjects = $db->fetchAll(
        "SELECT p.id, p.title, p.total_budget, p.status,
                c.name as client_name,
                COALESCE(SUM(e.amount), 0) as total_expenses,
                COALESCE(SUM(CASE WHEN pay.status = 'Received' THEN pay.amount ELSE 0 END), 0) as total_received
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN project_expenses e ON p.id = e.project_id
         LEFT JOIN project_payments pay ON p.id = pay.project_id
         GROUP BY p.id, c.name
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
    
    if (!empty($status) && in_array($status, PROJECT_STATUSES)) {
        $where[] = "p.status = ?";
        $queryParams[] = $status;
    }
    
    if ($startDate && $endDate) {
        $where[] = "(e.expense_date BETWEEN ? AND ? OR pay.payment_date BETWEEN ? AND ?)";
        $queryParams[] = $startDate;
        $queryParams[] = $endDate;
        $queryParams[] = $startDate;
        $queryParams[] = $endDate;
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $projects = $db->fetchAll(
        "SELECT p.id, p.title, c.name as client_name, s.name as service_name,
                p.status, p.start_date, p.end_date, p.total_budget, p.currency,
                COALESCE(SUM(e.amount), 0) as total_expenses,
                COALESCE(SUM(CASE WHEN pay.status = 'Received' THEN pay.amount ELSE 0 END), 0) as total_received,
                p.created_at
         FROM projects p
         LEFT JOIN clients c ON p.client_id = c.id
         LEFT JOIN services s ON p.service_id = s.id
         LEFT JOIN project_expenses e ON p.id = e.project_id
         LEFT JOIN project_payments pay ON p.id = pay.project_id
         {$whereClause}
         GROUP BY p.id, c.name, s.name
         ORDER BY p.created_at DESC",
        $queryParams
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
    echo 'body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }';
    echo '.container { background: white; padding: 30px; max-width: 1200px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }';
    echo 'h1 { color: #333; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 20px; }';
    echo 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
    echo 'th { background: #333; color: white; padding: 12px 8px; text-align: left; font-weight: 600; }';
    echo 'td { border: 1px solid #ddd; padding: 10px 8px; }';
    echo 'tr:nth-child(even) { background: #f9f9f9; }';
    echo 'tr:hover { background: #f0f0f0; }';
    echo '.meta { color: #666; font-size: 14px; margin: 20px 0; }';
    echo '.actions { margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 5px; }';
    echo '.btn { background: #333; color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 4px; font-size: 14px; margin-right: 10px; }';
    echo '.btn:hover { background: #555; }';
    echo '.currency { text-align: right; font-family: monospace; }';
    echo '@media print { ';
    echo '  body { background: white; margin: 0; }';
    echo '  .container { box-shadow: none; padding: 0; }';
    echo '  .actions { display: none; }';
    echo '  @page { margin: 1cm; }';
    echo '}';
    echo '</style>';
    echo '</head><body>';
    echo '<div class="container">';
    
    echo '<div class="actions">';
    echo '<button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>';
    echo '<button class="btn" onclick="window.close()">✖ Close</button>';
    echo '</div>';
    
    echo '<h1>' . htmlspecialchars($title) . '</h1>';
    echo '<p class="meta">Generated: ' . date('Y-m-d H:i:s') . ' | Total Records: ' . count($data) . '</p>';
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

