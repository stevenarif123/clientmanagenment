<?php
/**
 * Database Connection Class
 * Handles SQLite database connection with auto-initialization
 */

class Database {
    private static $instance = null;
    private $connection;
    private $config;

    private function __construct() {
        $this->config = require __DIR__ . '/.env.php';
        $this->connect();
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    private function connect(): void {
        $dbPath = $this->config['DB_PATH'] ?? (__DIR__ . '/../data/database.sqlite');
        $dbDir = dirname($dbPath);

        // Ensure database directory exists
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }

        $isNewDb = !file_exists($dbPath) || filesize($dbPath) === 0;

        try {
            $this->connection = new PDO(
                "sqlite:" . $dbPath,
                null,
                null,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 10,
                ]
            );

            // Configure SQLite optimizations & integrity
            $this->connection->exec("PRAGMA journal_mode = WAL;");
            $this->connection->exec("PRAGMA foreign_keys = ON;");
            $this->connection->exec("PRAGMA busy_timeout = 5000;");

            // Auto-initialize schema if new database
            if ($isNewDb) {
                $this->initializeSchema();
            } else {
                $this->ensureMigrations();
            }

        } catch (PDOException $e) {
            if ($this->config['APP_DEBUG'] ?? false) {
                throw new Exception("SQLite Database connection failed: " . $e->getMessage());
            }
            throw new Exception("Database connection failed");
        }
    }

    /**
     * Auto-migrate schema updates for existing databases
     */
    public function ensureMigrations(): void {
        try {
            // 1. Create project_tasks table if not exists
            $this->connection->exec("
                CREATE TABLE IF NOT EXISTS project_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'Todo',
                    priority TEXT DEFAULT 'Medium',
                    due_date TEXT,
                    completed_at TEXT,
                    order_index INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            ");
            $this->connection->exec("CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);");
            $this->connection->exec("CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);");

            // 2. Add portal_token to projects table if missing
            $projectCols = $this->connection->query("PRAGMA table_info(projects)")->fetchAll(PDO::FETCH_ASSOC);
            $colNames = array_column($projectCols, 'name');
            
            if (!in_array('portal_token', $colNames)) {
                $this->connection->exec("ALTER TABLE projects ADD COLUMN portal_token TEXT;");
                $this->connection->exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_portal_token ON projects(portal_token);");
            }
            if (!in_array('portal_enabled', $colNames)) {
                $this->connection->exec("ALTER TABLE projects ADD COLUMN portal_enabled INTEGER DEFAULT 1;");
            }

            // 3. Populate portal_token for any projects that don't have one
            $projectsWithoutToken = $this->connection->query("SELECT id FROM projects WHERE portal_token IS NULL OR portal_token = ''")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($projectsWithoutToken as $p) {
                $token = bin2hex(random_bytes(16));
                $stmt = $this->connection->prepare("UPDATE projects SET portal_token = ? WHERE id = ?");
                $stmt->execute([$token, $p['id']]);
            }
        } catch (Exception $e) {
            // Ignore if tables do not exist yet
        }
    }

    /**
     * Initialize schema from SQLite DDL script
     */
    public function initializeSchema(): void {
        $schemaFile = __DIR__ . '/../setup/database-schema-sqlite.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $this->connection->exec($sql);
        }
        $this->ensureMigrations();
    }


    public function getConnection(): PDO {
        return $this->connection;
    }

    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetch(string $sql, array $params = []): ?array {
        $stmt = $this->query($sql, $params);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function fetchAll(string $sql, array $params = []): array {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function insert(string $table, array $data): int {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->query($sql, array_values($data));
        
        return (int)$this->connection->lastInsertId();
    }

    public function update(string $table, array $data, string $where, array $whereParams = []): int {
        $set = implode(', ', array_map(fn($col) => "{$col} = ?", array_keys($data)));
        $sql = "UPDATE {$table} SET {$set}, updated_at = CURRENT_TIMESTAMP WHERE {$where}";
        
        $stmt = $this->query($sql, array_merge(array_values($data), $whereParams));
        return $stmt->rowCount();
    }

    public function delete(string $table, string $where, array $params = []): int {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    public function getConfig(?string $key = null) {
        if ($key === null) {
            return $this->config;
        }
        return $this->config[$key] ?? null;
    }
}
