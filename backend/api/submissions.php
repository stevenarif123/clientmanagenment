<?php
/**
 * Contact Submissions API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';
require_once __DIR__ . '/../utils/duplicateDetector.php';

/**
 * Get all submissions with pagination and filters
 */
function getSubmissions(array $params): void {
    $db = Database::getInstance();
    
    $page = max(1, (int)($params['page'] ?? 1));
    $perPage = min(100, max(1, (int)($params['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;
    $status = $params['status'] ?? '';
    $showDuplicates = isset($params['show_duplicates']) && ($params['show_duplicates'] === 'true' || $params['show_duplicates'] === true || $params['show_duplicates'] === '1');
    
    $where = [];
    $queryParams = [];
    
    if (!empty($status) && in_array($status, SUBMISSION_STATUSES)) {
        $where[] = "cs.status = ?";
        $queryParams[] = $status;
    }
    
    if (!$showDuplicates) {
        $where[] = "(cs.is_duplicate = 0 OR cs.is_duplicate IS NULL)";
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM contact_submissions cs {$whereClause}";
    $countResult = $db->fetch($countSql, $queryParams);
    $total = (int)($countResult['total'] ?? 0);
    
    // Get submissions
    $sql = "SELECT cs.*, s.name as service_name,
                   c.name as converted_client_name
            FROM contact_submissions cs
            LEFT JOIN services s ON cs.service_id = s.id
            LEFT JOIN clients c ON cs.converted_client_id = c.id
            {$whereClause}
            ORDER BY cs.created_at DESC
            LIMIT ? OFFSET ?";
    
    $submissions = $db->fetchAll($sql, array_merge($queryParams, [$perPage, $offset]));
    
    // Check for duplicate warnings
    foreach ($submissions as &$submission) {
        $warningCount = $db->fetch(
            "SELECT COUNT(*) as count FROM duplicate_warnings WHERE submission_id = ? AND (is_resolved = 0 OR is_resolved IS NULL)",
            [$submission['id']]
        );
        $submission['has_duplicate_warning'] = ((int)($warningCount['count'] ?? 0)) > 0;
    }
    
    Response::paginated($submissions, $total, $page, $perPage);
}

/**
 * Get single submission
 */
function getSubmission(int $id): void {
    $db = Database::getInstance();
    
    $sql = "SELECT cs.*, s.name as service_name,
                   c.name as converted_client_name
            FROM contact_submissions cs
            LEFT JOIN services s ON cs.service_id = s.id
            LEFT JOIN clients c ON cs.converted_client_id = c.id
            WHERE cs.id = ?";
    
    $submission = $db->fetch($sql, [$id]);
    
    if (!$submission) {
        Response::notFound('Submission not found');
    }
    
    // Get duplicate warnings
    $detector = new DuplicateDetector();
    $submission['duplicate_warnings'] = $detector->getWarnings($id);
    
    Response::success($submission);
}

/**
 * Create new submission (public endpoint for contact form)
 */
function createSubmission(array $body): void {
    $db = Database::getInstance();
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('name', 'Name is required')
        ->maxLength('name', 255, 'Name must not exceed 255 characters')
        ->required('email', 'Email is required')
        ->email('email')
        ->phone('phone')
        ->integer('service_id');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check for duplicates
    $detector = new DuplicateDetector();
    $duplicates = $detector->checkSubmission(
        $body['email'],
        $body['phone'] ?? null
    );
    
    // Create submission
    $submissionId = $db->insert('contact_submissions', [
        'name' => Validator::sanitize($body['name']),
        'email' => Validator::sanitize($body['email']),
        'phone' => isset($body['phone']) ? Validator::sanitize($body['phone']) : null,
        'service_id' => isset($body['service_id']) ? (int)$body['service_id'] : null,
        'message' => isset($body['message']) ? Validator::sanitize($body['message']) : null,
        'is_duplicate' => !empty($duplicates) ? 1 : 0
    ]);
    
    // Create duplicate warnings if found
    if (!empty($duplicates)) {
        $detector->createWarning($submissionId, $duplicates);
    }
    
    $submission = $db->fetch("SELECT * FROM contact_submissions WHERE id = ?", [$submissionId]);
    
    Response::created([
        'submission' => $submission,
        'has_duplicates' => !empty($duplicates)
    ], 'Submission received successfully');
}

/**
 * Update submission status
 */
function updateSubmission(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if submission exists
    $existing = $db->fetch("SELECT id FROM contact_submissions WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Submission not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator->inArray('status', SUBMISSION_STATUSES);
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update submission
    $updateData = [];
    
    if (isset($body['status'])) {
        $updateData['status'] = $body['status'];
    }
    
    if (!empty($updateData)) {
        $db->update('contact_submissions', $updateData, 'id = ?', [$id]);
    }
    
    $submission = $db->fetch("SELECT * FROM contact_submissions WHERE id = ?", [$id]);
    
    Response::success($submission, 'Submission updated successfully');
}

/**
 * Delete submission
 */
function deleteSubmission(int $id): void {
    $db = Database::getInstance();
    
    // Check if submission exists
    $existing = $db->fetch("SELECT id FROM contact_submissions WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Submission not found');
    }
    
    $db->delete('contact_submissions', 'id = ?', [$id]);
    
    Response::success(null, 'Submission deleted successfully');
}

/**
 * Convert submission to client
 */
function convertToClient(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if submission exists
    $submission = $db->fetch("SELECT * FROM contact_submissions WHERE id = ?", [$id]);
    if (!$submission) {
        Response::notFound('Submission not found');
    }
    
    if ($submission['status'] === 'Converted') {
        Response::error('Submission already converted to client', 400);
    }
    
    // Create client from submission
    $clientId = $db->insert('clients', [
        'name' => $submission['name'],
        'email' => $submission['email'],
        'phone' => $submission['phone'],
        'company' => $body['company'] ?? null,
        'address' => $body['address'] ?? null,
        'notes' => "Converted from contact form submission.\nOriginal message: " . $submission['message']
    ]);
    
    // Update submission
    $db->update('contact_submissions', [
        'status' => 'Converted',
        'converted_client_id' => $clientId
    ], 'id = ?', [$id]);
    
    // Resolve any duplicate warnings
    $db->query(
        "UPDATE duplicate_warnings SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE submission_id = ?",
        [$id]
    );
    
    $client = $db->fetch("SELECT * FROM clients WHERE id = ?", [$clientId]);
    
    Response::success([
        'client' => $client,
        'submission_id' => $id
    ], 'Submission converted to client successfully');
}

/**
 * Get duplicate warnings for submission
 */
function getSubmissionDuplicates(int $id): void {
    $db = Database::getInstance();
    
    // Check if submission exists
    $existing = $db->fetch("SELECT id FROM contact_submissions WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Submission not found');
    }
    
    $detector = new DuplicateDetector();
    $warnings = $detector->getWarnings($id);
    
    Response::success($warnings);
}
