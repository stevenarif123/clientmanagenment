<?php
/**
 * API Response Helper
 * Standardizes API responses
 */

class Response {
    /**
     * Send JSON response
     */
    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send success response
     */
    public static function success($data = null, string $message = 'Success', int $statusCode = 200): void {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    /**
     * Send error response
     */
    public static function error(string $message, int $statusCode = 400, $errors = null): void {
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        self::json($response, $statusCode);
    }

    /**
     * Send paginated response
     */
    public static function paginated(array $data, int $total, int $page, int $perPage): void {
        self::json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage)
            ]
        ]);
    }

    /**
     * Send created response
     */
    public static function created($data = null, string $message = 'Created successfully'): void {
        self::success($data, $message, 201);
    }

    /**
     * Send not found response
     */
    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    /**
     * Send forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    /**
     * Send validation error response
     */
    public static function validationError(array $errors): void {
        self::error('Validation failed', 422, $errors);
    }

    /**
     * Send server error response
     */
    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }
}
