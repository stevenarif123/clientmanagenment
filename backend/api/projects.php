<?php
/**
 * Projects API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all projects with pagination and filters
 */
function getProjects(array $params): void {
    $db = Database::getInstance();
    
    $page = max(1, (int)($params['page'] ?? 1));
    $perPage = min(100, max(1, (int)($params['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;
    $search = $params['search'] ?? '';
    $status = $params['status'] ?? '';
    $clientId = $params['client_id'] ?? '';
    $serviceId = $params['service_id'] ?? '';
    
    $where = [];
    $queryParams = [];
    
    if (!empty($search)) {
        $where[] = "(p.title LIKE ? OR p.description LIKE ?)";
        $searchTerm = "%{$search}%";
        $queryParams[] = $searchTerm;
        $queryParams[] = $searchTerm;
    }
    
    if (!empty($status) && in_array($status, PROJECT_STATUSES)) {
        $where[] = "p.status = ?";
        $queryParams[] = $status;
    }
    
    if (!empty($clientId)) {
        $where[] = "p.client_id = ?";
        $queryParams[] = (int)$clientId;
    }
    
    if (!empty($serviceId)) {
        $where[] = "p.service_id = ?";
        $queryParams[] = (int)$serviceId;
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM projects p {$whereClause}";
    $countResult = $db->fetch($countSql, $queryParams);
    $total = (int)($countResult['total'] ?? 0);
    
    // Get projects with related data
    $sql = "SELECT p.*, 
                   c.name as client_name,
                   c.company as client_company,
                   s.name as service_name,
                   COALESCE(SUM(e.amount), 0) as total_expenses,
                   COALESCE(SUM(CASE WHEN pay.status = 'Received' THEN pay.amount ELSE 0 END), 0) as total_received
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN project_expenses e ON p.id = e.project_id
            LEFT JOIN project_payments pay ON p.id = pay.project_id
            {$whereClause}
            GROUP BY p.id, c.name, c.company, s.name
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?";
    
    $projects = $db->fetchAll($sql, array_merge($queryParams, [$perPage, $offset]));
    
    // Calculate budget utilization for each project
    foreach ($projects as &$project) {
        $project['remaining_budget'] = $project['total_budget'] - $project['total_expenses'];
        $project['budget_utilization'] = $project['total_budget'] > 0 
            ? round(($project['total_expenses'] / $project['total_budget']) * 100, 2) 
            : 0;
    }
    
    Response::paginated($projects, $total, $page, $perPage);
}

/**
 * Get single project by ID
 */
function getProject(int $id): void {
    $db = Database::getInstance();
    
    $sql = "SELECT p.*, 
                   c.name as client_name,
                   c.email as client_email,
                   c.phone as client_phone,
                   c.company as client_company,
                   s.name as service_name,
                   COALESCE(SUM(e.amount), 0) as total_expenses,
                   COALESCE(SUM(CASE WHEN pay.status = 'Received' THEN pay.amount ELSE 0 END), 0) as total_received,
                   COALESCE(SUM(CASE WHEN pay.status = 'Pending' THEN pay.amount ELSE 0 END), 0) as pending_payments
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN project_expenses e ON p.id = e.project_id
            LEFT JOIN project_payments pay ON p.id = pay.project_id
            WHERE p.id = ?
            GROUP BY p.id, c.name, c.email, c.phone, c.company, s.name";
    
    $project = $db->fetch($sql, [$id]);
    
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Calculate budget info
    $project['remaining_budget'] = $project['total_budget'] - $project['total_expenses'];
    $project['budget_utilization'] = $project['total_budget'] > 0 
        ? round(($project['total_expenses'] / $project['total_budget']) * 100, 2) 
        : 0;
    
    // Get recent expenses
    $project['recent_expenses'] = $db->fetchAll(
        "SELECT * FROM project_expenses WHERE project_id = ? ORDER BY expense_date DESC LIMIT 5",
        [$id]
    );
    
    // Get recent payments
    $project['recent_payments'] = $db->fetchAll(
        "SELECT * FROM project_payments WHERE project_id = ? ORDER BY payment_date DESC LIMIT 5",
        [$id]
    );
    
    // Get recent communications
    $project['recent_communications'] = $db->fetchAll(
        "SELECT * FROM communications WHERE project_id = ? ORDER BY created_at DESC LIMIT 5",
        [$id]
    );
    
    Response::success($project);
}

/**
 * Create new project
 */
function createProject(array $body): void {
    $db = Database::getInstance();
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('client_id', 'Client is required')
        ->integer('client_id')
        ->required('service_id', 'Service is required')
        ->integer('service_id')
        ->required('title', 'Project title is required')
        ->maxLength('title', 255, 'Title must not exceed 255 characters')
        ->inArray('status', PROJECT_STATUSES)
        ->date('start_date')
        ->date('end_date')
        ->numeric('total_budget')
        ->positive('total_budget');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if client exists
    $client = $db->fetch("SELECT id FROM clients WHERE id = ?", [(int)$body['client_id']]);
    if (!$client) {
        Response::error('Client not found', 400);
    }
    
    // Check if service exists
    $service = $db->fetch("SELECT id FROM services WHERE id = ?", [(int)$body['service_id']]);
    if (!$service) {
        Response::error('Service not found', 400);
    }
    
    // Create project
    $projectId = $db->insert('projects', [
        'client_id' => (int)$body['client_id'],
        'service_id' => (int)$body['service_id'],
        'title' => Validator::sanitize($body['title']),
        'description' => isset($body['description']) ? Validator::sanitize($body['description']) : null,
        'status' => $body['status'] ?? 'Pending',
        'start_date' => $body['start_date'] ?? null,
        'end_date' => $body['end_date'] ?? null,
        'total_budget' => (float)($body['total_budget'] ?? 0),
        'currency' => $body['currency'] ?? DEFAULT_CURRENCY
    ]);
    
    $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);
    
    Response::created($project, 'Project created successfully');
}

/**
 * Update project
 */
function updateProject(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $existing = $db->fetch("SELECT id FROM projects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Project not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('client_id', 'Client is required')
        ->integer('client_id')
        ->required('service_id', 'Service is required')
        ->integer('service_id')
        ->required('title', 'Project title is required')
        ->maxLength('title', 255, 'Title must not exceed 255 characters')
        ->inArray('status', PROJECT_STATUSES)
        ->date('start_date')
        ->date('end_date')
        ->numeric('total_budget')
        ->positive('total_budget');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update project
    $db->update('projects', [
        'client_id' => (int)$body['client_id'],
        'service_id' => (int)$body['service_id'],
        'title' => Validator::sanitize($body['title']),
        'description' => isset($body['description']) ? Validator::sanitize($body['description']) : null,
        'status' => $body['status'] ?? 'Pending',
        'start_date' => $body['start_date'] ?? null,
        'end_date' => $body['end_date'] ?? null,
        'total_budget' => (float)($body['total_budget'] ?? 0),
        'currency' => $body['currency'] ?? DEFAULT_CURRENCY
    ], 'id = ?', [$id]);
    
    $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$id]);
    
    Response::success($project, 'Project updated successfully');
}

/**
 * Delete project
 */
function deleteProject(int $id): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $existing = $db->fetch("SELECT id FROM projects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Project not found');
    }
    
    // Delete project (cascades to expenses, payments, communications)
    $db->delete('projects', 'id = ?', [$id]);
    
    Response::success(null, 'Project deleted successfully');
}

/**
 * Get project budget summary
 */
function getProjectBudgetSummary(int $id): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id, title, total_budget, currency FROM projects WHERE id = ?", [$id]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Get expenses by category
    $expensesByCategory = $db->fetchAll(
        "SELECT category, SUM(amount) as total 
         FROM project_expenses 
         WHERE project_id = ? 
         GROUP BY category 
         ORDER BY total DESC",
        [$id]
    );
    
    // Get total expenses
    $totalExpenses = $db->fetch(
        "SELECT COALESCE(SUM(amount), 0) as total FROM project_expenses WHERE project_id = ?",
        [$id]
    );
    
    // Get payments summary
    $paymentsSummary = $db->fetch(
        "SELECT 
            COALESCE(SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END), 0) as total_received,
            COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending,
            COALESCE(SUM(CASE WHEN status = 'Refunded' THEN amount ELSE 0 END), 0) as total_refunded
         FROM project_payments 
         WHERE project_id = ?",
        [$id]
    );
    
    $totalBudget = (float)$project['total_budget'];
    $totalExpensesAmount = (float)($totalExpenses['total'] ?? 0);
    $remainingBudget = $totalBudget - $totalExpensesAmount;
    $budgetUtilization = $totalBudget > 0 ? round(($totalExpensesAmount / $totalBudget) * 100, 2) : 0;
    
    Response::success([
        'project_id' => $id,
        'project_title' => $project['title'],
        'currency' => $project['currency'],
        'total_budget' => $totalBudget,
        'total_expenses' => $totalExpensesAmount,
        'remaining_budget' => $remainingBudget,
        'budget_utilization' => $budgetUtilization,
        'expenses_by_category' => $expensesByCategory,
        'payments' => [
            'total_received' => (float)($paymentsSummary['total_received'] ?? 0),
            'total_pending' => (float)($paymentsSummary['total_pending'] ?? 0),
            'total_refunded' => (float)($paymentsSummary['total_refunded'] ?? 0)
        ],
        'profit_estimate' => (float)($paymentsSummary['total_received'] ?? 0) - $totalExpensesAmount
    ]);
}
