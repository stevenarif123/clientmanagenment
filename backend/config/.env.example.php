<?php
/**
 * Environment Configuration Template
 * Copy this file to .env.php
 */

return [
    // Database Configuration (SQLite)
    'DB_PATH' => __DIR__ . '/../data/database.sqlite',
    
    // Application Settings
    'APP_NAME' => 'Client Management System',
    'APP_ENV' => 'production', // 'development' or 'production'
    'APP_DEBUG' => false,
    'APP_URL' => 'https://yourdomain.com',
    
    // Session Configuration
    'SESSION_LIFETIME' => 86400,
    'SESSION_SECRET' => 'generate-a-strong-secret-key-here',
    
    // File Upload Configuration
    'MAX_FILE_SIZE' => 5242880,
    'ALLOWED_FILE_TYPES' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'txt'],
    
    // CORS Configuration
    'CORS_ALLOWED_ORIGINS' => [
        'https://yourdomain.com'
    ],
    
    // Default Admin
    'DEFAULT_ADMIN_USERNAME' => 'admin',
    'DEFAULT_ADMIN_PASSWORD' => 'admin123',
];
