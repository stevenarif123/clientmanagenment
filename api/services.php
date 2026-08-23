<?php
/**
 * Services API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all services
 */
function getServices(): void {
    $db = Database::getInstance();
    
    $services = $db->fetchAll(
        "SELECT s.*, 
                COUNT(p.id) as project_count
         FROM services s
         LEFT JOIN projects p ON s.id = p.service_id
         GROUP BY s.id
         ORDER BY s.name ASC"
    );
    
    Response::success($services);
}

/**
 * Create new service
 */
function createService(array $body): void {
    $db = Database::getInstance();
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('name', 'Service name is required')
        ->maxLength('name', 255, 'Name must not exceed 255 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check for duplicate name
    $existing = $db->fetch("SELECT id FROM services WHERE LOWER(name) = LOWER(?)", [$body['name']]);
    if ($existing) {
        Response::error('A service with this name already exists', 400);
    }
    
    // Create service
    $serviceId = $db->insert('services', [
        'name' => Validator::sanitize($body['name']),
        'description' => isset($body['description']) ? Validator::sanitize($body['description']) : null,
        'is_active' => $body['is_active'] ?? true
    ]);
    
    $service = $db->fetch("SELECT * FROM services WHERE id = ?", [$serviceId]);
    
    Response::created($service, 'Service created successfully');
}

/**
 * Update service
 */
function updateService(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if service exists
    $existing = $db->fetch("SELECT id FROM services WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Service not found');
    }
    
    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('name', 'Service name is required')
        ->maxLength('name', 255, 'Name must not exceed 255 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check for duplicate name (excluding current)
    $duplicate = $db->fetch(
        "SELECT id FROM services WHERE LOWER(name) = LOWER(?) AND id != ?",
        [$body['name'], $id]
    );
    if ($duplicate) {
        Response::error('A service with this name already exists', 400);
    }
    
    // Update service
    $db->update('services', [
        'name' => Validator::sanitize($body['name']),
        'description' => isset($body['description']) ? Validator::sanitize($body['description']) : null,
        'is_active' => $body['is_active'] ?? true
    ], 'id = ?', [$id]);
    
    $service = $db->fetch("SELECT * FROM services WHERE id = ?", [$id]);
    
    Response::success($service, 'Service updated successfully');
}

/**
 * Delete service
 */
function deleteService(int $id): void {
    $db = Database::getInstance();
    
    // Check if service exists
    $existing = $db->fetch("SELECT id FROM services WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Service not found');
    }
    
    // Check for related projects
    $projectCount = $db->fetch("SELECT COUNT(*) as count FROM projects WHERE service_id = ?", [$id]);
    if ($projectCount['count'] > 0) {
        Response::error('Cannot delete service with existing projects. Deactivate it instead.', 400);
    }
    
    $db->delete('services', 'id = ?', [$id]);
    
    Response::success(null, 'Service deleted successfully');
}
