<?php
/**
 * Communications API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all communications for a project
 */
function getProjectCommunications(int $projectId): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    $communications = $db->fetchAll(
        "SELECT * FROM communications 
         WHERE project_id = ? 
         ORDER BY created_at DESC",
        [$projectId]
    );
    
    Response::success($communications);
}

/**
 * Get all communications for a client
 */
function getClientCommunications(int $clientId): void {
    $db = Database::getInstance();
    
    // Check if client exists
    $client = $db->fetch("SELECT id FROM clients WHERE id = ?", [$clientId]);
    if (!$client) {
        Response::notFound('Client not found');
    }
    
    $communications = $db->fetchAll(
        "SELECT c.*, p.title as project_title
         FROM communications c
         LEFT JOIN projects p ON c.project_id = p.id
         WHERE c.client_id = ? OR p.client_id = ?
         ORDER BY c.created_at DESC",
        [$clientId, $clientId]
    );
    
    Response::success($communications);
}

/**
 * Create new communication
 */
function createCommunication(int $projectId, array $body): void {
    $db = Database::getInstance();
    
    // Check if project exists and get client_id
    $project = $db->fetch("SELECT id, client_id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('type', 'Communication type is required')
        ->inArray('type', COMMUNICATION_TYPES)
        ->required('content', 'Content is required')
        ->maxLength('subject', 255, 'Subject must not exceed 255 characters')
        ->maxLength('contact_info', 255, 'Contact info must not exceed 255 characters')
        ->inArray('direction', ['incoming', 'outgoing']);
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create communication
    $commId = $db->insert('communications', [
        'project_id' => $projectId,
        'client_id' => $project['client_id'],
        'type' => $body['type'],
        'subject' => isset($body['subject']) ? Validator::sanitize($body['subject']) : null,
        'content' => Validator::sanitize($body['content']),
        'contact_info' => isset($body['contact_info']) ? Validator::sanitize($body['contact_info']) : null,
        'direction' => $body['direction'] ?? 'outgoing'
    ]);
    
    $communication = $db->fetch("SELECT * FROM communications WHERE id = ?", [$commId]);
    
    Response::created($communication, 'Communication logged successfully');
}

/**
 * Delete communication
 */
function deleteCommunication(int $id): void {
    $db = Database::getInstance();
    
    // Check if communication exists
    $existing = $db->fetch("SELECT id FROM communications WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Communication not found');
    }
    
    $db->delete('communications', 'id = ?', [$id]);
    
    Response::success(null, 'Communication deleted successfully');
}
