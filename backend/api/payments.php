<?php
/**
 * Payments API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all payments for a project
 */
function getProjectPayments(int $projectId): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id, total_budget FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    $payments = $db->fetchAll(
        "SELECT * FROM project_payments 
         WHERE project_id = ? 
         ORDER BY payment_date DESC, created_at DESC",
        [$projectId]
    );
    
    // Get summary
    $summary = $db->fetch(
        "SELECT 
            COALESCE(SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END), 0) as total_received,
            COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending,
            COALESCE(SUM(CASE WHEN status = 'Refunded' THEN amount ELSE 0 END), 0) as total_refunded,
            COUNT(*) as count
         FROM project_payments 
         WHERE project_id = ?",
        [$projectId]
    );
    
    $totalBudget = (float)$project['total_budget'];
    $totalReceived = (float)($summary['total_received'] ?? 0);
    $outstanding = $totalBudget - $totalReceived;
    
    Response::success([
        'payments' => $payments,
        'summary' => [
            'total_budget' => $totalBudget,
            'total_received' => $totalReceived,
            'total_pending' => (float)($summary['total_pending'] ?? 0),
            'total_refunded' => (float)($summary['total_refunded'] ?? 0),
            'outstanding' => $outstanding,
            'payment_progress' => $totalBudget > 0 ? round(($totalReceived / $totalBudget) * 100, 2) : 0,
            'count' => (int)($summary['count'] ?? 0)
        ]
    ]);
}

/**
 * Create new payment
 */
function createPayment(int $projectId, array $body): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('amount', 'Amount is required')
        ->numeric('amount')
        ->positive('amount')
        ->required('payment_date', 'Payment date is required')
        ->date('payment_date')
        ->inArray('status', PAYMENT_STATUSES)
        ->inArray('payment_method', PAYMENT_METHODS);
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create payment
    $paymentId = $db->insert('project_payments', [
        'project_id' => $projectId,
        'amount' => (float)$body['amount'],
        'payment_date' => $body['payment_date'],
        'payment_method' => $body['payment_method'] ?? null,
        'status' => $body['status'] ?? 'Pending',
        'notes' => isset($body['notes']) ? Validator::sanitize($body['notes']) : null
    ]);
    
    $payment = $db->fetch("SELECT * FROM project_payments WHERE id = ?", [$paymentId]);
    
    Response::created($payment, 'Payment created successfully');
}

/**
 * Update payment
 */
function updatePayment(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if payment exists
    $existing = $db->fetch("SELECT id FROM project_payments WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Payment not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('amount', 'Amount is required')
        ->numeric('amount')
        ->positive('amount')
        ->required('payment_date', 'Payment date is required')
        ->date('payment_date')
        ->inArray('status', PAYMENT_STATUSES)
        ->inArray('payment_method', PAYMENT_METHODS);
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update payment
    $db->update('project_payments', [
        'amount' => (float)$body['amount'],
        'payment_date' => $body['payment_date'],
        'payment_method' => $body['payment_method'] ?? null,
        'status' => $body['status'] ?? 'Pending',
        'notes' => isset($body['notes']) ? Validator::sanitize($body['notes']) : null
    ], 'id = ?', [$id]);
    
    $payment = $db->fetch("SELECT * FROM project_payments WHERE id = ?", [$id]);
    
    Response::success($payment, 'Payment updated successfully');
}

/**
 * Delete payment
 */
function deletePayment(int $id): void {
    $db = Database::getInstance();
    
    // Check if payment exists
    $existing = $db->fetch("SELECT id FROM project_payments WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Payment not found');
    }
    
    $db->delete('project_payments', 'id = ?', [$id]);
    
    Response::success(null, 'Payment deleted successfully');
}
