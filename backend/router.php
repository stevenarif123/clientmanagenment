<?php
/**
 * Router script for PHP built-in server
 * Usage: php -S localhost:8000 router.php
 */

// Get the requested URI
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Debug log
error_log("Router: Requested URI: {$uri}");

// If it's a static file that exists, serve it
if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    error_log("Router: Serving static file: {$uri}");
    return false; // Let PHP serve the file
}

// Route everything else to index.php
error_log("Router: Routing to index.php");
$_SERVER['SCRIPT_NAME'] = '/index.php';
require_once __DIR__ . '/index.php';
