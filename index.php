<?php
/**
 * Main API Router
 * Entry point for all API requests
 */

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Load configuration
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/utils/response.php';
require_once __DIR__ . '/utils/validator.php';
require_once __DIR__ . '/utils/logger.php';

// Initialize logger (lazy - only if needed)
$logger = null;

// Set exception handler
set_exception_handler(function ($e) use (&$logger) {
    if ($logger === null) {
        $logger = new Logger();
    }
    $logger->logError($e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    
    $config = require __DIR__ . '/config/.env.php';
    $message = ($config['APP_DEBUG'] ?? false) ? $e->getMessage() : 'Internal server error';
    Response::serverError($message);
});

// CORS Headers
$config = require __DIR__ . '/config/.env.php';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $config['CORS_ALLOWED_ORIGINS'] ?? [])) {
    header("Access-Control-Allow-Origin: {$origin}");
} elseif (($config['APP_ENV'] ?? 'development') === 'development') {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Max-Age: 86400");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path if exists (adjust based on your hosting setup)
$basePath = '/api';
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}

// Ensure URI starts with /
if ($uri === '' || $uri[0] !== '/') {
    $uri = '/' . $uri;
}

// Get request body
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?? [];

// Initialize auth middleware
$auth = new AuthMiddleware();

// Check authentication for protected routes
$currentAdmin = null;
$fullRoute = $method . ' /api' . $uri;

if (!$auth->isPublicRoute($method, '/api' . $uri)) {
    $currentAdmin = $auth->authenticate();
    if (!$currentAdmin) {
        Response::unauthorized('Authentication required');
    }
}

// Route matching helper
function matchRoute(string $pattern, string $uri, &$params = []): bool {
    $pattern = preg_replace('/\/:([^\/]+)/', '/(?P<$1>[^/]+)', $pattern);
    $pattern = '#^' . $pattern . '$#';
    
    if (preg_match($pattern, $uri, $matches)) {
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        return true;
    }
    return false;
}

// Log request (disabled during debugging to avoid early DB connection)
// if ($logger === null) $logger = new Logger();
// $logger->logRequest(
//     $uri,
//     $method,
//     $currentAdmin['admin_id'] ?? null,
//     $rawBody ?: null
// );

// =====================================================
// ROUTES
// =====================================================

$params = [];

// Authentication Routes
if ($uri === '/auth/login' && $method === 'POST') {
    require __DIR__ . '/api/auth.php';
    handleLogin($body);
}

if ($uri === '/auth/logout' && $method === 'POST') {
    require __DIR__ . '/api/auth.php';
    handleLogout($currentAdmin['token'] ?? '');
}

if ($uri === '/auth/verify' && $method === 'GET') {
    require __DIR__ . '/api/auth.php';
    handleVerify($currentAdmin);
}

if ($uri === '/auth/check-setup' && $method === 'GET') {
    require __DIR__ . '/api/auth.php';
    handleCheckSetup();
}

if ($uri === '/auth/setup' && $method === 'POST') {
    require __DIR__ . '/api/auth.php';
    handleSetup($body);
}

if ($uri === '/auth/profile' && $method === 'PUT') {
    require __DIR__ . '/api/auth.php';
    handleUpdateProfile((int)$currentAdmin['admin_id'], $body);
}

if ($uri === '/auth/change-password' && $method === 'PUT') {
    require __DIR__ . '/api/auth.php';
    handleChangePassword((int)$currentAdmin['admin_id'], $body);
}


// Client Routes
if ($uri === '/clients' && $method === 'GET') {
    require __DIR__ . '/api/clients.php';
    getClients($_GET);
}

if ($uri === '/clients' && $method === 'POST') {
    require __DIR__ . '/api/clients.php';
    createClient($body);
}

if (matchRoute('/clients/:id', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/clients.php';
    getClient((int)$params['id']);
}

if (matchRoute('/clients/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/clients.php';
    updateClient((int)$params['id'], $body);
}

if (matchRoute('/clients/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/clients.php';
    deleteClient((int)$params['id']);
}

// Project Routes
if ($uri === '/projects' && $method === 'GET') {
    require __DIR__ . '/api/projects.php';
    getProjects($_GET);
}

if ($uri === '/projects' && $method === 'POST') {
    require __DIR__ . '/api/projects.php';
    createProject($body);
}

if (matchRoute('/projects/:id', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/projects.php';
    getProject((int)$params['id']);
}

if (matchRoute('/projects/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/projects.php';
    updateProject((int)$params['id'], $body);
}

if (matchRoute('/projects/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/projects.php';
    deleteProject((int)$params['id']);
}

if (matchRoute('/projects/:id/budget-summary', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/projects.php';
    getProjectBudgetSummary((int)$params['id']);
}

// Expense Routes
if (matchRoute('/projects/:id/expenses', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/expenses.php';
    getProjectExpenses((int)$params['id']);
}

if (matchRoute('/projects/:id/expenses', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/expenses.php';
    createExpense((int)$params['id'], $body);
}

if (matchRoute('/expenses/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/expenses.php';
    updateExpense((int)$params['id'], $body);
}

if (matchRoute('/expenses/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/expenses.php';
    deleteExpense((int)$params['id']);
}

// Payment Routes
if (matchRoute('/projects/:id/payments', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/payments.php';
    getProjectPayments((int)$params['id']);
}

if (matchRoute('/projects/:id/payments', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/payments.php';
    createPayment((int)$params['id'], $body);
}

if (matchRoute('/payments/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/payments.php';
    updatePayment((int)$params['id'], $body);
}

if (matchRoute('/payments/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/payments.php';
    deletePayment((int)$params['id']);
}

// Task & Milestone Routes
if ($uri === '/tasks/board' && $method === 'GET') {
    require __DIR__ . '/api/tasks.php';
    getGlobalTaskBoard();
}

if (matchRoute('/projects/:id/tasks/reorder', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/tasks.php';
    reorderProjectTasks((int)$params['id']);
}

if (matchRoute('/projects/:id/tasks', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/tasks.php';
    getProjectTasks((int)$params['id']);
}

if (matchRoute('/projects/:id/tasks', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/tasks.php';
    createProjectTask((int)$params['id']);
}

if (matchRoute('/tasks/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/tasks.php';
    updateTask((int)$params['id']);
}

if (matchRoute('/tasks/:id/toggle', $uri, $params) && $method === 'PATCH') {
    require __DIR__ . '/api/tasks.php';
    toggleTaskStatus((int)$params['id']);
}

if (matchRoute('/tasks/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/tasks.php';
    deleteTask((int)$params['id']);
}

// Client Portal Routes
if (matchRoute('/portal/:token', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/portal.php';
    getPortalData((string)$params['token']);
}

if (matchRoute('/projects/:id/regenerate-portal-token', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/portal.php';
    regeneratePortalToken((int)$params['id']);
}

// Communication Routes

if (matchRoute('/projects/:id/communications', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/communications.php';
    getProjectCommunications((int)$params['id']);
}

if (matchRoute('/projects/:id/communications', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/communications.php';
    createCommunication((int)$params['id'], $body);
}

if (matchRoute('/clients/:id/communications', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/communications.php';
    getClientCommunications((int)$params['id']);
}

if (matchRoute('/communications/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/communications.php';
    deleteCommunication((int)$params['id']);
}

// Service Routes
if ($uri === '/services' && $method === 'GET') {
    require __DIR__ . '/api/services.php';
    getServices();
}

if ($uri === '/services' && $method === 'POST') {
    require __DIR__ . '/api/services.php';
    createService($body);
}

if (matchRoute('/services/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/services.php';
    updateService((int)$params['id'], $body);
}

if (matchRoute('/services/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/services.php';
    deleteService((int)$params['id']);
}

// Submission Routes
if ($uri === '/submissions' && $method === 'GET') {
    require __DIR__ . '/api/submissions.php';
    getSubmissions($_GET);
}

if ($uri === '/submissions' && $method === 'POST') {
    require __DIR__ . '/api/submissions.php';
    createSubmission($body);
}

if (matchRoute('/submissions/:id', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/submissions.php';
    getSubmission((int)$params['id']);
}

if (matchRoute('/submissions/:id', $uri, $params) && $method === 'PUT') {
    require __DIR__ . '/api/submissions.php';
    updateSubmission((int)$params['id'], $body);
}

if (matchRoute('/submissions/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/submissions.php';
    deleteSubmission((int)$params['id']);
}

if (matchRoute('/submissions/:id/convert', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/submissions.php';
    convertToClient((int)$params['id'], $body);
}

if (matchRoute('/submissions/:id/duplicates', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/submissions.php';
    getSubmissionDuplicates((int)$params['id']);
}

// File Routes
if (matchRoute('/projects/:id/files', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/files.php';
    getProjectFiles((int)$params['id']);
}

if (matchRoute('/clients/:id/files', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/files.php';
    getClientFiles((int)$params['id']);
}

if ($uri === '/files/upload' && $method === 'POST') {
    require __DIR__ . '/api/files.php';
    uploadFile($_FILES, $_POST, $currentAdmin['admin_id']);
}

if (matchRoute('/files/:id', $uri, $params) && $method === 'DELETE') {
    require __DIR__ . '/api/files.php';
    deleteFile((int)$params['id']);
}

// Report Routes
if ($uri === '/reports/dashboard' && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    getDashboardStats();
}

if ($uri === '/reports/financial' && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    getFinancialReport($_GET);
}

if ($uri === '/reports/budget-overview' && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    getBudgetOverview($_GET);
}

if ($uri === '/reports/export/clients' && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    exportClients($_GET);
}

if ($uri === '/reports/export/projects' && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    exportProjects($_GET);
}

if (matchRoute('/reports/export/project/:id', $uri, $params) && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    exportProjectDetail((int)$params['id'], $_GET);
}

if ($uri === '/reports/backup-db' && $method === 'GET') {
    require __DIR__ . '/api/reports.php';
    handleBackupDatabase();
}


// 404 - Route not found
Response::notFound('Endpoint not found');
