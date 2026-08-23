<?php
/**
 * Expenses API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all expenses for a project
 */
function getProjectExpenses(int $projectId): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    $expenses = $db->fetchAll(
        "SELECT * FROM project_expenses 
         WHERE project_id = ? 
         ORDER BY expense_date DESC, created_at DESC",
        [$projectId]
    );
    
    // Get summary
    $summary = $db->fetch(
        "SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
         FROM project_expenses 
         WHERE project_id = ?",
        [$projectId]
    );
    
    Response::success([
        'expenses' => $expenses,
        'summary' => [
            'total' => (float)$summary['total'],
            'count' => (int)$summary['count']
        ]
    ]);
}

/**
 * Create new expense
 */
function createExpense(int $projectId, array $body): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('description', 'Description is required')
        ->maxLength('description', 255, 'Description must not exceed 255 characters')
        ->required('amount', 'Amount is required')
        ->numeric('amount')
        ->positive('amount')
        ->required('expense_date', 'Expense date is required')
        ->date('expense_date')
        ->inArray('category', EXPENSE_CATEGORIES);
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create expense
    $expenseId = $db->insert('project_expenses', [
        'project_id' => $projectId,
        'description' => Validator::sanitize($body['description']),
        'amount' => (float)$body['amount'],
        'category' => $body['category'] ?? 'Other',
        'expense_date' => $body['expense_date'],
        'notes' => isset($body['notes']) ? Validator::sanitize($body['notes']) : null
    ]);
    
    $expense = $db->fetch("SELECT * FROM project_expenses WHERE id = ?", [$expenseId]);
    
    Response::created($expense, 'Expense created successfully');
}

/**
 * Update expense
 */
function updateExpense(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if expense exists
    $existing = $db->fetch("SELECT id FROM project_expenses WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Expense not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('description', 'Description is required')
        ->maxLength('description', 255, 'Description must not exceed 255 characters')
        ->required('amount', 'Amount is required')
        ->numeric('amount')
        ->positive('amount')
        ->required('expense_date', 'Expense date is required')
        ->date('expense_date')
        ->inArray('category', EXPENSE_CATEGORIES);
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update expense
    $db->update('project_expenses', [
        'description' => Validator::sanitize($body['description']),
        'amount' => (float)$body['amount'],
        'category' => $body['category'] ?? 'Other',
        'expense_date' => $body['expense_date'],
        'notes' => isset($body['notes']) ? Validator::sanitize($body['notes']) : null
    ], 'id = ?', [$id]);
    
    $expense = $db->fetch("SELECT * FROM project_expenses WHERE id = ?", [$id]);
    
    Response::success($expense, 'Expense updated successfully');
}

/**
 * Delete expense
 */
function deleteExpense(int $id): void {
    $db = Database::getInstance();
    
    // Check if expense exists
    $existing = $db->fetch("SELECT id FROM project_expenses WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Expense not found');
    }
    
    $db->delete('project_expenses', 'id = ?', [$id]);
    
    Response::success(null, 'Expense deleted successfully');
}
