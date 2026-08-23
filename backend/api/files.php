<?php
/**
 * File Uploads API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Get all files for a project
 */
function getProjectFiles(int $projectId): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    $files = $db->fetchAll(
        "SELECT f.*, a.username as uploaded_by_name
         FROM file_uploads f
         LEFT JOIN admins a ON f.uploaded_by = a.id
         WHERE f.project_id = ?
         ORDER BY f.uploaded_at DESC",
        [$projectId]
    );
    
    Response::success($files);
}

/**
 * Get all files for a client
 */
function getClientFiles(int $clientId): void {
    $db = Database::getInstance();
    
    // Check if client exists
    $client = $db->fetch("SELECT id FROM clients WHERE id = ?", [$clientId]);
    if (!$client) {
        Response::notFound('Client not found');
    }
    
    $files = $db->fetchAll(
        "SELECT f.*, a.username as uploaded_by_name, p.title as project_title
         FROM file_uploads f
         LEFT JOIN admins a ON f.uploaded_by = a.id
         LEFT JOIN projects p ON f.project_id = p.id
         WHERE f.client_id = ? OR p.client_id = ?
         ORDER BY f.uploaded_at DESC",
        [$clientId, $clientId]
    );
    
    Response::success($files);
}

/**
 * Upload file
 */
function uploadFile(array $files, array $data, int $adminId): void {
    $db = Database::getInstance();
    
    // Check if file was uploaded
    if (empty($files['file'])) {
        Response::error('No file uploaded', 400);
    }
    
    $file = $files['file'];
    
    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
        ];
        $message = $errorMessages[$file['error']] ?? 'Unknown upload error';
        Response::error($message, 400);
    }
    
    // Check file size (5MB max)
    if ($file['size'] > MAX_FILE_SIZE) {
        Response::error('File size exceeds 5MB limit', 400);
    }
    
    // Check file extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        Response::error('File type not allowed. Allowed types: ' . implode(', ', ALLOWED_EXTENSIONS), 400);
    }
    
    // Validate project_id or client_id
    $projectId = isset($data['project_id']) ? (int)$data['project_id'] : null;
    $clientId = isset($data['client_id']) ? (int)$data['client_id'] : null;
    
    if (!$projectId && !$clientId) {
        Response::error('Either project_id or client_id is required', 400);
    }
    
    if ($projectId) {
        $project = $db->fetch("SELECT id, client_id FROM projects WHERE id = ?", [$projectId]);
        if (!$project) {
            Response::notFound('Project not found');
        }
        $clientId = $project['client_id'];
    }
    
    if ($clientId && !$projectId) {
        $client = $db->fetch("SELECT id FROM clients WHERE id = ?", [$clientId]);
        if (!$client) {
            Response::notFound('Client not found');
        }
    }
    
    // Generate unique filename
    $newFilename = uniqid() . '_' . time() . '.' . $extension;
    
    // Upload directory (relative to backend)
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Organize by year/month
    $subDir = date('Y/m');
    $fullUploadDir = $uploadDir . $subDir . '/';
    if (!is_dir($fullUploadDir)) {
        mkdir($fullUploadDir, 0755, true);
    }
    
    $filePath = $fullUploadDir . $newFilename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        Response::error('Failed to save uploaded file', 500);
    }
    
    // Generate URL (adjust based on your hosting setup)
    $config = $db->getConfig();
    $baseUrl = rtrim($config['APP_URL'] ?? '', '/');
    $fileUrl = $baseUrl . '/uploads/' . $subDir . '/' . $newFilename;
    
    // Save to database
    $fileId = $db->insert('file_uploads', [
        'project_id' => $projectId,
        'client_id' => $clientId,
        'file_name' => $newFilename,
        'original_name' => $file['name'],
        'file_url' => $fileUrl,
        'file_size' => $file['size'],
        'file_type' => $file['type'],
        'uploaded_by' => $adminId
    ]);
    
    $fileRecord = $db->fetch("SELECT * FROM file_uploads WHERE id = ?", [$fileId]);
    
    Response::created($fileRecord, 'File uploaded successfully');
}

/**
 * Delete file
 */
function deleteFile(int $id): void {
    $db = Database::getInstance();
    
    // Check if file exists
    $file = $db->fetch("SELECT * FROM file_uploads WHERE id = ?", [$id]);
    if (!$file) {
        Response::notFound('File not found');
    }
    
    // Try to delete physical file
    $uploadDir = __DIR__ . '/../uploads/';
    
    // Extract path from URL
    $urlPath = parse_url($file['file_url'], PHP_URL_PATH);
    $relativePath = str_replace('/uploads/', '', $urlPath);
    $filePath = $uploadDir . $relativePath;
    
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    // Delete from database
    $db->delete('file_uploads', 'id = ?', [$id]);
    
    Response::success(null, 'File deleted successfully');
}
