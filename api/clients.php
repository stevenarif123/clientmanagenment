<?php
/**
 * Clients API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all clients with pagination and search
 */
function getClients(array $params): void {
    $db = Database::getInstance();
    
    $page = max(1, (int)($params['page'] ?? 1));
    $perPage = min(100, max(1, (int)($params['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;
    $search = $params['search'] ?? '';
    
    $where = '';
    $queryParams = [];
    
    if (!empty($search)) {
        $where = "WHERE c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ? OR c.phone LIKE ?";
        $searchTerm = "%{$search}%";
        $queryParams = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
    }
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM clients c {$where}";
    $countResult = $db->fetch($countSql, $queryParams);
    $total = (int)($countResult['total'] ?? 0);
    
    // Get clients with project counts
    $sql = "SELECT c.*, 
                   COUNT(DISTINCT p.id) as total_projects,
                   COALESCE(SUM(CASE WHEN p.status = 'In Progress' THEN 1 ELSE 0 END), 0) as active_projects,
                   COALESCE(SUM(p.total_budget), 0) as total_budget
            FROM clients c
            LEFT JOIN projects p ON c.id = p.client_id
            {$where}
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?";
    
    $clients = $db->fetchAll($sql, array_merge($queryParams, [$perPage, $offset]));
    
    Response::paginated($clients, $total, $page, $perPage);
}

/**
 * Get single client by ID
 */
function getClient(int $id): void {
    $db = Database::getInstance();
    
    // Use pre-aggregated subqueries per project to prevent cross-join multiplication
    $sql = "SELECT c.*,
                   COUNT(DISTINCT p.id) as total_projects,
                   COALESCE(SUM(CASE WHEN p.status = 'In Progress' THEN 1 ELSE 0 END), 0) as active_projects,
                   COALESCE(SUM(p.total_budget), 0) as total_budget,
                   COALESCE(SUM(ps.total_received), 0) as total_received,
                   COALESCE(SUM(es.total_expenses), 0) as total_expenses
            FROM clients c
            LEFT JOIN projects p ON c.id = p.client_id
            LEFT JOIN (
                SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received
                FROM project_payments
                GROUP BY project_id
            ) ps ON p.id = ps.project_id
            LEFT JOIN (
                SELECT project_id, SUM(amount) as total_expenses
                FROM project_expenses
                GROUP BY project_id
            ) es ON p.id = es.project_id
            WHERE c.id = ?
            GROUP BY c.id";
    
    $client = $db->fetch($sql, [$id]);
    
    if (!$client) {
        Response::notFound('Client not found');
    }
    
    // Get all projects for this client with financial summaries
    $projects = $db->fetchAll(
        "SELECT p.*, s.name as service_name,
                COALESCE(ps.total_received, 0) as total_received,
                COALESCE(es.total_expenses, 0) as total_expenses
         FROM projects p
         LEFT JOIN services s ON p.service_id = s.id
         LEFT JOIN (
             SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received
             FROM project_payments GROUP BY project_id
         ) ps ON p.id = ps.project_id
         LEFT JOIN (
             SELECT project_id, SUM(amount) as total_expenses
             FROM project_expenses GROUP BY project_id
         ) es ON p.id = es.project_id
         WHERE p.client_id = ?
         ORDER BY p.created_at DESC",
        [$id]
    );
    
    $client['recent_projects'] = $projects;
    
    Response::success($client);
}

/**
 * Create new client
 */
function createClient(array $body): void {
    $db = Database::getInstance();
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('name', 'Client name is required')
        ->maxLength('name', 255, 'Name must not exceed 255 characters')
        ->email('email')
        ->phone('phone')
        ->maxLength('company', 255, 'Company name must not exceed 255 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create client
    $clientId = $db->insert('clients', [
        'name' => Validator::sanitize($body['name']),
        'email' => isset($body['email']) ? Validator::sanitize($body['email']) : null,
        'phone' => isset($body['phone']) ? Validator::sanitize($body['phone']) : null,
        'company' => isset($body['company']) ? Validator::sanitize($body['company']) : null,
        'address' => isset($body['address']) ? Validator::sanitize($body['address']) : null,
        'notes' => isset($body['notes']) ? Validator::sanitize($body['notes']) : null
    ]);
    
    $client = $db->fetch("SELECT * FROM clients WHERE id = ?", [$clientId]);
    
    Response::created($client, 'Client created successfully');
}

/**
 * Update client
 */
function updateClient(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if client exists
    $existing = $db->fetch("SELECT id FROM clients WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Client not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('name', 'Client name is required')
        ->maxLength('name', 255, 'Name must not exceed 255 characters')
        ->email('email')
        ->phone('phone')
        ->maxLength('company', 255, 'Company name must not exceed 255 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update client
    $db->update('clients', [
        'name' => Validator::sanitize($body['name']),
        'email' => isset($body['email']) ? Validator::sanitize($body['email']) : null,
        'phone' => isset($body['phone']) ? Validator::sanitize($body['phone']) : null,
        'company' => isset($body['company']) ? Validator::sanitize($body['company']) : null,
        'address' => isset($body['address']) ? Validator::sanitize($body['address']) : null,
        'notes' => isset($body['notes']) ? Validator::sanitize($body['notes']) : null
    ], 'id = ?', [$id]);
    
    $client = $db->fetch("SELECT * FROM clients WHERE id = ?", [$id]);
    
    Response::success($client, 'Client updated successfully');
}

/**
 * Delete client (and cascade delete associated records)
 */
function deleteClient(int $id): void {
    $db = Database::getInstance();
    
    // Check if client exists
    $existing = $db->fetch("SELECT id FROM clients WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Client not found');
    }
    
    // Delete client (SQLite foreign keys CASCADE will remove related records)
    $db->delete('clients', 'id = ?', [$id]);
    
    Response::success(null, 'Client deleted successfully');
}

