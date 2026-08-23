<?php
/**
 * Application Constants
 */

// Project Status Options
define('PROJECT_STATUSES', [
    'Pending',
    'In Progress',
    'Completed',
    'On Hold',
    'Cancelled'
]);

// Expense Categories
define('EXPENSE_CATEGORIES', [
    'Materials',
    'Labor',
    'Hosting',
    'Software',
    'Transportation',
    'Other'
]);

// Payment Methods
define('PAYMENT_METHODS', [
    'Bank Transfer',
    'Cash',
    'E-Wallet',
    'Credit Card',
    'Other'
]);

// Payment Statuses
define('PAYMENT_STATUSES', [
    'Pending',
    'Received',
    'Refunded'
]);

// Communication Types
define('COMMUNICATION_TYPES', [
    'email',
    'whatsapp',
    'note'
]);

// Submission Statuses
define('SUBMISSION_STATUSES', [
    'New',
    'Reviewed',
    'Converted',
    'Spam'
]);

// Allowed File Extensions
define('ALLOWED_EXTENSIONS', [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'zip', 'rar', 'txt'
]);

// Max File Size (5MB)
define('MAX_FILE_SIZE', 5 * 1024 * 1024);

// Currency
define('DEFAULT_CURRENCY', 'IDR');

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);
