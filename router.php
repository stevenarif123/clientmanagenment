<?php
/**
 * Unified Server Router for PHP Built-in Server
 * Usage: php -S localhost:8000 router.php
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// 1. Route API requests to index.php
if (strpos($uri, '/api') === 0) {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
    require_once __DIR__ . '/index.php';
    return;
}

// 2. Serve static files if they exist on disk (CSS, JS, images, fonts, etc.)
if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false; // Let PHP built-in web server serve the static asset
}

// 3. Serve main Single Page Application entry for all other routes
if (file_exists(__DIR__ . '/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    readfile(__DIR__ . '/index.html');
    return;
}

// Fallback 404
http_response_code(404);
echo "404 Not Found";
