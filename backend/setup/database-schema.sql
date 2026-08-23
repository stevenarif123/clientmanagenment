-- Client Management System Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ADMINS TABLE
-- =====================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SESSIONS TABLE (Authentication)
-- =====================================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================
-- SERVICES TABLE (Dynamic service types)
-- =====================================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_name ON clients(name);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES services(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    -- Status options: Pending, In Progress, Completed, On Hold, Cancelled
    start_date DATE,
    end_date DATE,
    total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IDR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_service ON projects(service_id);

-- =====================================================
-- PROJECT EXPENSES TABLE (Budget tracking)
-- =====================================================
CREATE TABLE project_expenses (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Other',
    -- Categories: Materials, Labor, Hosting, Software, Transportation, Other
    expense_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_project ON project_expenses(project_id);
CREATE INDEX idx_expenses_category ON project_expenses(category);

-- =====================================================
-- PROJECT PAYMENTS TABLE (Payment tracking)
-- =====================================================
CREATE TABLE project_payments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    -- Payment methods: Bank Transfer, Cash, E-Wallet, Other
    status VARCHAR(50) DEFAULT 'Pending',
    -- Status options: Pending, Received, Refunded
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_project ON project_payments(project_id);
CREATE INDEX idx_payments_status ON project_payments(status);

-- =====================================================
-- COMMUNICATIONS TABLE (Emails, WhatsApp, Notes)
-- =====================================================
CREATE TABLE communications (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    -- Types: email, whatsapp, note
    subject VARCHAR(255),
    content TEXT NOT NULL,
    contact_info VARCHAR(255),
    -- Email address or phone number contacted
    direction VARCHAR(20) DEFAULT 'outgoing',
    -- Direction: incoming, outgoing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communications_project ON communications(project_id);
CREATE INDEX idx_communications_client ON communications(client_id);
CREATE INDEX idx_communications_type ON communications(type);

-- =====================================================
-- FILE UPLOADS TABLE
-- =====================================================
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    -- Size in bytes
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES admins(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_project ON file_uploads(project_id);
CREATE INDEX idx_files_client ON file_uploads(client_id);

-- =====================================================
-- CONTACT SUBMISSIONS TABLE (From website contact form)
-- =====================================================
CREATE TABLE contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_id INTEGER REFERENCES services(id),
    message TEXT,
    status VARCHAR(50) DEFAULT 'New',
    -- Status options: New, Reviewed, Converted, Spam
    converted_client_id INTEGER REFERENCES clients(id),
    is_duplicate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_email ON contact_submissions(email);
CREATE INDEX idx_submissions_phone ON contact_submissions(phone);
CREATE INDEX idx_submissions_status ON contact_submissions(status);

-- =====================================================
-- DUPLICATE WARNINGS TABLE
-- =====================================================
CREATE TABLE duplicate_warnings (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
    duplicate_of_submission_id INTEGER REFERENCES contact_submissions(id) ON DELETE SET NULL,
    duplicate_of_client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    match_type VARCHAR(50) NOT NULL,
    -- Match types: email, phone, both
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_duplicates_submission ON duplicate_warnings(submission_id);

-- =====================================================
-- API LOGS TABLE (Request logging)
-- =====================================================
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    admin_id INTEGER REFERENCES admins(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_body TEXT,
    response_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_logs_created ON api_logs(created_at);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Budget Summary View
CREATE OR REPLACE VIEW v_project_budget_summary AS
SELECT 
    p.id AS project_id,
    p.title,
    p.total_budget,
    p.currency,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'Received'), 0) AS total_received,
    p.total_budget - COALESCE(SUM(e.amount), 0) AS remaining_budget,
    CASE 
        WHEN p.total_budget > 0 
        THEN ROUND((COALESCE(SUM(e.amount), 0) / p.total_budget * 100), 2)
        ELSE 0 
    END AS budget_utilization_percent
FROM projects p
LEFT JOIN project_expenses e ON p.id = e.project_id
LEFT JOIN project_payments pay ON p.id = pay.project_id
GROUP BY p.id, p.title, p.total_budget, p.currency;

-- Client Summary View
CREATE OR REPLACE VIEW v_client_summary AS
SELECT 
    c.id AS client_id,
    c.name,
    c.email,
    c.company,
    COUNT(DISTINCT p.id) AS total_projects,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'In Progress') AS active_projects,
    COALESCE(SUM(p.total_budget), 0) AS total_budget_all_projects,
    MAX(p.created_at) AS last_project_date
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
GROUP BY c.id, c.name, c.email, c.company;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default services
INSERT INTO services (name, description) VALUES
('Web Development', 'Custom website development including frontend and backend'),
('Mobile App Development', 'iOS and Android mobile application development'),
('UI/UX Design', 'User interface and user experience design services'),
('E-Commerce', 'Online store development with payment integration'),
('Website Maintenance', 'Ongoing website maintenance and support'),
('SEO Services', 'Search engine optimization services'),
('Other', 'Other custom services');

-- Insert default expense categories (for reference, stored in app)
-- Categories: Materials, Labor, Hosting, Software, Transportation, Other
