<?php
/**
 * Production Environment Configuration for Client Management System
 * Database: SQLite (Zero configuration required)
 */

return [
    // Database Configuration (SQLite)
    'DB_PATH' => __DIR__ . '/../data/database.sqlite',
    
    // Application Settings
    'APP_NAME' => 'ClientHub - Client & Project Management',
    'APP_ENV' => 'production', // 'development' or 'production'
    'APP_DEBUG' => false,      // Set to true only when troubleshooting
    'APP_URL' => '',           // Optional: your full domain e.g. https://client.yourdomain.com (or leave empty for auto-detect)
    
    // Session Configuration (30 days lifetime)
    'SESSION_LIFETIME' => 2592000,
    'SESSION_SECRET' => 'ch_sec_' . hash('sha256', __DIR__ . 'client-hub-secure-salt-2026'),
    
    // File Upload Configuration
    'MAX_FILE_SIZE' => 10485760, // 10MB in bytes
    'ALLOWED_FILE_TYPES' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'txt'],
    
    // CORS Configuration (allowed origins)
    'CORS_ALLOWED_ORIGINS' => [
        '*'
    ],
    
    // Default Admin (for first-time setup if database is fresh)
    'DEFAULT_ADMIN_USERNAME' => 'admin',
    'DEFAULT_ADMIN_PASSWORD' => 'Mantapfb1_',
    
    // Machine & AI Agent Integration API Key
    'API_KEY' => 'ch_key_b94e82d71f654a93c082e5192847a163',
];
