<?php
/**
 * Environment Configuration for Client Management System
 * Database: SQLite
 */

return [
    // Database Configuration (SQLite)
    'DB_PATH' => __DIR__ . '/../data/database.sqlite',
    
    // Application Settings
    'APP_NAME' => 'Client Management System',
    'APP_ENV' => 'development', // 'development' or 'production'
    'APP_DEBUG' => true,
    'APP_URL' => 'http://localhost:8000',
    
    // Session Configuration (30 days lifetime)
    'SESSION_LIFETIME' => 2592000,
    'SESSION_SECRET' => 'client-management-secret-key-change-in-production',
    
    // File Upload Configuration
    'MAX_FILE_SIZE' => 5242880, // 5MB in bytes
    'ALLOWED_FILE_TYPES' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'txt'],
    
    // CORS Configuration (allowed origins)
    'CORS_ALLOWED_ORIGINS' => [
        'http://localhost:5173',
        'http://localhost:8000',
        'http://localhost:3000',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:5173'
    ],
    
    // Default Admin (for first-time setup)
    'DEFAULT_ADMIN_USERNAME' => 'admin',
    'DEFAULT_ADMIN_PASSWORD' => 'admin123',
];
