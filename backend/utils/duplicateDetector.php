<?php
/**
 * Duplicate Detector Utility
 * Detects duplicate contact submissions
 */

require_once __DIR__ . '/../config/database.php';

class DuplicateDetector {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Check for duplicates when a new submission comes in
     * Returns array of potential duplicates
     */
    public function checkSubmission(string $email, ?string $phone = null): array {
        $duplicates = [];

        // Check against existing clients
        $clientDuplicates = $this->checkAgainstClients($email, $phone);
        if (!empty($clientDuplicates)) {
            $duplicates['clients'] = $clientDuplicates;
        }

        // Check against existing submissions
        $submissionDuplicates = $this->checkAgainstSubmissions($email, $phone);
        if (!empty($submissionDuplicates)) {
            $duplicates['submissions'] = $submissionDuplicates;
        }

        return $duplicates;
    }

    /**
     * Check against existing clients
     */
    private function checkAgainstClients(string $email, ?string $phone): array {
        $sql = "SELECT id, name, email, phone, company 
                FROM clients 
                WHERE email = ? OR (phone IS NOT NULL AND phone != '' AND phone = ?)";
        
        return $this->db->fetchAll($sql, [$email, $phone ?? '']);
    }

    /**
     * Check against existing submissions
     */
    private function checkAgainstSubmissions(string $email, ?string $phone): array {
        $sql = "SELECT id, name, email, phone, status, created_at 
                FROM contact_submissions 
                WHERE (email = ? OR (phone IS NOT NULL AND phone != '' AND phone = ?))
                AND status != 'Spam'
                ORDER BY created_at DESC
                LIMIT 5";
        
        return $this->db->fetchAll($sql, [$email, $phone ?? '']);
    }

    /**
     * Create duplicate warning record
     */
    public function createWarning(int $submissionId, array $duplicates): void {
        // Create warnings for client duplicates
        if (!empty($duplicates['clients'])) {
            foreach ($duplicates['clients'] as $client) {
                $matchType = $this->determineMatchType($client);
                $this->db->insert('duplicate_warnings', [
                    'submission_id' => $submissionId,
                    'duplicate_of_client_id' => $client['id'],
                    'match_type' => $matchType,
                    'is_resolved' => 0
                ]);
            }
        }

        // Create warnings for submission duplicates
        if (!empty($duplicates['submissions'])) {
            foreach ($duplicates['submissions'] as $submission) {
                $matchType = $this->determineMatchType($submission);
                $this->db->insert('duplicate_warnings', [
                    'submission_id' => $submissionId,
                    'duplicate_of_submission_id' => $submission['id'],
                    'match_type' => $matchType,
                    'is_resolved' => 0
                ]);
            }
        }

        // Mark submission as duplicate
        if (!empty($duplicates['clients']) || !empty($duplicates['submissions'])) {
            $this->db->update(
                'contact_submissions',
                ['is_duplicate' => 1],
                'id = ?',
                [$submissionId]
            );
        }
    }

    /**
     * Determine match type (email, phone, or both)
     */
    private function determineMatchType(array $record): string {
        $hasEmail = !empty($record['email']);
        $hasPhone = !empty($record['phone']);

        if ($hasEmail && $hasPhone) {
            return 'both';
        } elseif ($hasEmail) {
            return 'email';
        } else {
            return 'phone';
        }
    }

    /**
     * Get all warnings for a submission
     */
    public function getWarnings(int $submissionId): array {
        $sql = "SELECT dw.*, 
                       c.name as client_name, c.email as client_email,
                       cs.name as submission_name, cs.email as submission_email
                FROM duplicate_warnings dw
                LEFT JOIN clients c ON dw.duplicate_of_client_id = c.id
                LEFT JOIN contact_submissions cs ON dw.duplicate_of_submission_id = cs.id
                WHERE dw.submission_id = ?
                ORDER BY dw.created_at DESC";
        
        return $this->db->fetchAll($sql, [$submissionId]);
    }

    /**
     * Resolve a duplicate warning
     */
    public function resolveWarning(int $warningId): bool {
        $result = $this->db->update(
            'duplicate_warnings',
            [
                'is_resolved' => 1,
                'resolved_at' => date('Y-m-d H:i:s')
            ],
            'id = ?',
            [$warningId]
        );
        
        return $result > 0;
    }

    /**
     * Mark submission as duplicate manually
     */
    public function markAsDuplicate(int $submissionId, ?int $duplicateOfClientId = null, ?int $duplicateOfSubmissionId = null, string $matchType = 'manual'): bool {
        // Create warning record
        $data = [
            'submission_id' => $submissionId,
            'match_type' => $matchType,
            'is_resolved' => 0
        ];

        if ($duplicateOfClientId) {
            $data['duplicate_of_client_id'] = $duplicateOfClientId;
        }

        if ($duplicateOfSubmissionId) {
            $data['duplicate_of_submission_id'] = $duplicateOfSubmissionId;
        }

        $this->db->insert('duplicate_warnings', $data);

        // Update submission
        $this->db->update(
            'contact_submissions',
            ['is_duplicate' => 1],
            'id = ?',
            [$submissionId]
        );

        return true;
    }
}
