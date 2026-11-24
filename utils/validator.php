<?php
/**
 * Input Validator Utility
 * Server-side validation for all inputs
 */

class Validator {
    private $errors = [];
    private $data = [];

    public function __construct(array $data) {
        $this->data = $data;
    }

    /**
     * Required field validation
     */
    public function required(string $field, ?string $message = null): self {
        if (!isset($this->data[$field]) || trim((string)$this->data[$field]) === '') {
            $this->errors[$field] = $message ?? "{$field} is required";
        }
        return $this;
    }

    /**
     * Email validation
     */
    public function email(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && trim((string)$this->data[$field]) !== '') {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = $message ?? "Invalid email format";
            }
        }
        return $this;
    }

    /**
     * Minimum length validation
     */
    public function minLength(string $field, int $min, ?string $message = null): self {
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) < $min) {
            $this->errors[$field] = $message ?? "{$field} must be at least {$min} characters";
        }
        return $this;
    }

    /**
     * Maximum length validation
     */
    public function maxLength(string $field, int $max, ?string $message = null): self {
        if (isset($this->data[$field]) && strlen((string)$this->data[$field]) > $max) {
            $this->errors[$field] = $message ?? "{$field} must not exceed {$max} characters";
        }
        return $this;
    }

    /**
     * Numeric validation
     */
    public function numeric(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && $this->data[$field] !== '' && $this->data[$field] !== null) {
            if (!is_numeric($this->data[$field])) {
                $this->errors[$field] = $message ?? "{$field} must be a number";
            }
        }
        return $this;
    }

    /**
     * Non-negative number validation (>= 0)
     */
    public function positive(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && is_numeric($this->data[$field])) {
            if ((float)$this->data[$field] < 0) {
                $this->errors[$field] = $message ?? "{$field} must be zero or a positive number";
            }
        }
        return $this;
    }

    /**
     * Strictly positive number validation (> 0)
     */
    public function greaterThanZero(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && is_numeric($this->data[$field])) {
            if ((float)$this->data[$field] <= 0) {
                $this->errors[$field] = $message ?? "{$field} must be greater than 0";
            }
        }
        return $this;
    }

    /**
     * Date validation (Y-m-d format)
     */
    public function date(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && trim((string)$this->data[$field]) !== '') {
            $date = \DateTime::createFromFormat('Y-m-d', (string)$this->data[$field]);
            if (!$date || $date->format('Y-m-d') !== (string)$this->data[$field]) {
                $this->errors[$field] = $message ?? "Invalid date format (expected YYYY-MM-DD)";
            }
        }
        return $this;
    }

    /**
     * In array validation
     */
    public function inArray(string $field, array $allowed, ?string $message = null): self {
        if (isset($this->data[$field]) && $this->data[$field] !== '' && $this->data[$field] !== null) {
            if (!in_array($this->data[$field], $allowed, true)) {
                $this->errors[$field] = $message ?? "{$field} must be one of: " . implode(', ', $allowed);
            }
        }
        return $this;
    }

    /**
     * Phone number validation (basic)
     */
    public function phone(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && trim((string)$this->data[$field]) !== '') {
            $phone = preg_replace('/[\s\-\(\)]/', '', (string)$this->data[$field]);
            if (!preg_match('/^\+?[0-9]{8,15}$/', $phone)) {
                $this->errors[$field] = $message ?? "Invalid phone number format";
            }
        }
        return $this;
    }

    /**
     * Integer validation
     */
    public function integer(string $field, ?string $message = null): self {
        if (isset($this->data[$field]) && $this->data[$field] !== '' && $this->data[$field] !== null) {
            if (filter_var($this->data[$field], FILTER_VALIDATE_INT) === false) {
                $this->errors[$field] = $message ?? "{$field} must be an integer";
            }
        }
        return $this;
    }

    /**
     * Check if validation passed
     */
    public function passes(): bool {
        return empty($this->errors);
    }

    /**
     * Check if validation failed
     */
    public function fails(): bool {
        return !empty($this->errors);
    }

    /**
     * Get validation errors
     */
    public function getErrors(): array {
        return $this->errors;
    }

    /**
     * Get first error message
     */
    public function getFirstError(): ?string {
        return !empty($this->errors) ? reset($this->errors) : null;
    }

    /**
     * Sanitize string input for safe UTF-8 database storage.
     * Note: Prepared statements prevent SQL injection and frontend/HTML templates
     * escape output on render, so avoid HTML-encoding before DB storage to prevent
     * double-escaping entities like "&amp;".
     */
    public static function sanitize(string $input): string {
        return str_replace("\0", '', trim($input));
    }

    /**
     * Sanitize array of inputs
     */
    public static function sanitizeArray(array $data): array {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = self::sanitize($value);
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitizeArray($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }

    /**
     * Quick static validation helper
     */
    public static function validate(array $data, array $rules): array {
        $validator = new self($data);
        foreach ($rules as $field => $ruleStr) {
            $rulesList = is_array($ruleStr) ? $ruleStr : explode('|', $ruleStr);
            foreach ($rulesList as $r) {
                if ($r === 'required') {
                    $validator->required($field);
                } elseif ($r === 'email') {
                    $validator->email($field);
                } elseif (strpos($r, 'min:') === 0) {
                    $validator->minLength($field, (int)substr($r, 4));
                } elseif (strpos($r, 'max:') === 0) {
                    $validator->maxLength($field, (int)substr($r, 4));
                } elseif ($r === 'numeric') {
                    $validator->numeric($field);
                }
            }
        }
        return $validator->getErrors();
    }
}
