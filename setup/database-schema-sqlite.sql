-- Client Management System Database Schema for SQLite
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- =====================================================
-- ADMINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SESSIONS TABLE (Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- SERVICES TABLE (Dynamic service types)
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pending',
    -- Status options: Pending, In Progress, Completed, On Hold, Cancelled
    start_date TEXT,
    end_date TEXT,
    total_budget REAL NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'IDR',
    portal_token TEXT UNIQUE,
    portal_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_service ON projects(service_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_portal_token ON projects(portal_token);

-- =====================================================
-- PROJECT TASKS & MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Todo',
    -- Status options: Todo, In Progress, Review, Completed
    priority TEXT DEFAULT 'Medium',
    -- Priority options: Low, Medium, High
    due_date TEXT,
    completed_at TEXT,
    order_index REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);


-- =====================================================
-- PROJECT EXPENSES TABLE (Budget tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT DEFAULT 'Other',
    -- Categories: Materials, Labor, Hosting, Software, Transportation, Other
    expense_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON project_expenses(category);

-- =====================================================
-- PROJECT PAYMENTS TABLE (Payment tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT,
    -- Payment methods: Bank Transfer, Cash, E-Wallet, Other
    status TEXT DEFAULT 'Pending',
    -- Status options: Pending, Received, Refunded
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_project ON project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON project_payments(status);

-- =====================================================
-- COMMUNICATIONS TABLE (Emails, WhatsApp, Notes)
-- =====================================================
CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    -- Types: email, whatsapp, note
    subject TEXT,
    content TEXT NOT NULL,
    contact_info TEXT,
    direction TEXT DEFAULT 'outgoing',
    -- Direction: incoming, outgoing
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communications_project ON communications(project_id);
CREATE INDEX IF NOT EXISTS idx_communications_client ON communications(client_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);

-- =====================================================
-- FILE UPLOADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by INTEGER REFERENCES admins(id),
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_project ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_files_client ON file_uploads(client_id);

-- =====================================================
-- CONTACT SUBMISSIONS TABLE (From website contact form)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    service_id INTEGER REFERENCES services(id),
    message TEXT,
    status TEXT DEFAULT 'New',
    -- Status options: New, Reviewed, Converted, Spam
    converted_client_id INTEGER REFERENCES clients(id),
    is_duplicate INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_submissions_phone ON contact_submissions(phone);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON contact_submissions(status);

-- =====================================================
-- DUPLICATE WARNINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS duplicate_warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
    duplicate_of_submission_id INTEGER REFERENCES contact_submissions(id) ON DELETE SET NULL,
    duplicate_of_client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    match_type TEXT NOT NULL,
    -- Match types: email, phone, both
    is_resolved INTEGER DEFAULT 0,
    resolved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_duplicates_submission ON duplicate_warnings(submission_id);

-- =====================================================
-- API LOGS TABLE (Request logging)
-- =====================================================
CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    admin_id INTEGER REFERENCES admins(id),
    ip_address TEXT,
    user_agent TEXT,
    request_body TEXT,
    response_code INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_logs_created ON api_logs(created_at);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Budget Summary View (pre-aggregated to avoid cross-join multiplication)
CREATE VIEW IF NOT EXISTS v_project_budget_summary AS
SELECT 
    p.id AS project_id,
    p.title,
    p.total_budget,
    p.currency,
    COALESCE(e.total_expenses, 0) AS total_expenses,
    COALESCE(pay.total_received, 0) AS total_received,
    p.total_budget - COALESCE(e.total_expenses, 0) AS remaining_budget,
    CASE 
        WHEN p.total_budget > 0 
        THEN ROUND((COALESCE(e.total_expenses, 0) / p.total_budget * 100), 2)
        ELSE 0 
    END AS budget_utilization_percent
FROM projects p
LEFT JOIN (
    SELECT project_id, SUM(amount) AS total_expenses
    FROM project_expenses
    GROUP BY project_id
) e ON p.id = e.project_id
LEFT JOIN (
    SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) AS total_received
    FROM project_payments
    GROUP BY project_id
) pay ON p.id = pay.project_id;

-- Client Summary View
CREATE VIEW IF NOT EXISTS v_client_summary AS
SELECT 
    c.id AS client_id,
    c.name,
    c.email,
    c.company,
    COUNT(DISTINCT p.id) AS total_projects,
    SUM(CASE WHEN p.status = 'In Progress' THEN 1 ELSE 0 END) AS active_projects,
    COALESCE(SUM(p.total_budget), 0) AS total_budget_all_projects,
    MAX(p.created_at) AS last_project_date
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
GROUP BY c.id, c.name, c.email, c.company;

-- =====================================================
-- INITIAL SEED DATA
-- =====================================================
INSERT INTO services (name, description) VALUES
('Web Development', 'Custom website development including frontend and backend'),
('Mobile App Development', 'iOS and Android mobile application development'),
('UI/UX Design', 'User interface and user experience design services'),
('E-Commerce', 'Online store development with payment integration'),
('Website Maintenance', 'Ongoing website maintenance and support'),
('SEO Services', 'Search engine optimization services'),
('Other', 'Other custom services');
