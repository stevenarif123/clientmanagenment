-- Sample Data for Testing
-- Run this after database-schema.sql

-- =====================================================
-- SAMPLE CLIENTS
-- =====================================================
INSERT INTO clients (name, email, phone, company, address, notes) VALUES
('Ahmad Rizki', 'ahmad.rizki@email.com', '+6281234567890', 'PT Teknologi Maju', 'Jl. Sudirman No. 123, Jakarta', 'Good client, always pays on time'),
('Siti Nurhaliza', 'siti.nurhaliza@company.co.id', '+6281234567891', 'CV Berkah Jaya', 'Jl. Gatot Subroto No. 45, Bandung', 'Referred by Ahmad'),
('Budi Santoso', 'budi.santoso@gmail.com', '+6281234567892', NULL, 'Jl. Pahlawan No. 78, Surabaya', 'Individual client, freelance projects'),
('Diana Putri', 'diana.putri@startup.io', '+6281234567893', 'Startup Digital ID', 'Jl. Kuningan No. 56, Jakarta Selatan', 'Startup client, multiple projects expected'),
('Eko Prasetyo', 'eko.prasetyo@business.com', '+6281234567894', 'Toko Online Sejahtera', 'Jl. Mangga Dua No. 99, Jakarta Utara', 'E-commerce focus');

-- =====================================================
-- SAMPLE PROJECTS
-- =====================================================
INSERT INTO projects (client_id, service_id, title, description, status, start_date, end_date, total_budget, currency) VALUES
-- Ahmad Rizki's projects
(1, 1, 'Company Website Redesign', 'Complete redesign of corporate website with modern UI', 'In Progress', '2024-01-15', '2024-03-15', 25000000, 'IDR'),
(1, 3, 'Brand Identity Design', 'New logo and brand guidelines', 'Completed', '2023-11-01', '2023-12-15', 8000000, 'IDR'),

-- Siti Nurhaliza's projects
(2, 4, 'E-Commerce Platform', 'Full e-commerce website with payment gateway integration', 'In Progress', '2024-02-01', '2024-05-01', 45000000, 'IDR'),

-- Budi Santoso's projects
(3, 1, 'Portfolio Website', 'Personal portfolio website', 'Completed', '2023-10-01', '2023-10-30', 5000000, 'IDR'),
(3, 5, 'Monthly Maintenance', 'Ongoing website maintenance', 'In Progress', '2024-01-01', '2024-12-31', 12000000, 'IDR'),

-- Diana Putri's projects
(4, 2, 'Mobile App MVP', 'Minimum viable product for startup mobile app', 'Pending', '2024-04-01', '2024-08-01', 75000000, 'IDR'),
(4, 3, 'App UI/UX Design', 'Complete UI/UX design for mobile app', 'In Progress', '2024-02-15', '2024-03-30', 15000000, 'IDR'),

-- Eko Prasetyo's projects
(5, 4, 'Online Store Setup', 'WooCommerce setup with custom theme', 'On Hold', '2024-01-20', '2024-03-20', 20000000, 'IDR'),
(5, 6, 'SEO Optimization', '3-month SEO campaign', 'Pending', '2024-04-01', '2024-06-30', 9000000, 'IDR');

-- =====================================================
-- SAMPLE EXPENSES
-- =====================================================
INSERT INTO project_expenses (project_id, description, amount, category, expense_date, notes) VALUES
-- Project 1: Company Website Redesign
(1, 'Premium theme license', 500000, 'Software', '2024-01-20', 'ThemeForest purchase'),
(1, 'Stock images package', 750000, 'Materials', '2024-01-22', 'Shutterstock subscription'),
(1, 'Hosting setup - 1 year', 1200000, 'Hosting', '2024-01-25', 'VPS hosting'),
(1, 'Freelance developer assistance', 3000000, 'Labor', '2024-02-10', '2 weeks of work'),

-- Project 2: Brand Identity Design
(2, 'Adobe Creative Cloud', 800000, 'Software', '2023-11-05', 'Monthly subscription'),
(2, 'Font license', 350000, 'Materials', '2023-11-10', 'Premium font family'),

-- Project 3: E-Commerce Platform
(3, 'WooCommerce extensions', 2500000, 'Software', '2024-02-05', 'Payment gateway + shipping'),
(3, 'SSL Certificate', 500000, 'Hosting', '2024-02-08', '1 year SSL'),
(3, 'Product photography', 1500000, 'Materials', '2024-02-15', 'Professional product shots'),

-- Project 5: Monthly Maintenance
(5, 'Security plugin', 400000, 'Software', '2024-01-05', 'Wordfence premium'),

-- Project 7: App UI/UX Design
(7, 'Figma subscription', 600000, 'Software', '2024-02-15', 'Monthly design tool');

-- =====================================================
-- SAMPLE PAYMENTS
-- =====================================================
INSERT INTO project_payments (project_id, amount, payment_date, payment_method, status, notes) VALUES
-- Project 1: Company Website Redesign
(1, 12500000, '2024-01-15', 'Bank Transfer', 'Received', '50% down payment'),
(1, 6250000, '2024-02-15', 'Bank Transfer', 'Received', '25% progress payment'),

-- Project 2: Brand Identity Design (Completed - fully paid)
(2, 4000000, '2023-11-01', 'Bank Transfer', 'Received', '50% down payment'),
(2, 4000000, '2023-12-15', 'Bank Transfer', 'Received', 'Final payment'),

-- Project 3: E-Commerce Platform
(3, 22500000, '2024-02-01', 'Bank Transfer', 'Received', '50% down payment'),

-- Project 4: Portfolio Website (Completed - fully paid)
(4, 2500000, '2023-10-01', 'E-Wallet', 'Received', '50% down payment'),
(4, 2500000, '2023-10-30', 'E-Wallet', 'Received', 'Final payment'),

-- Project 5: Monthly Maintenance
(5, 3000000, '2024-01-01', 'Bank Transfer', 'Received', 'Q1 payment'),

-- Project 7: App UI/UX Design
(7, 7500000, '2024-02-15', 'Bank Transfer', 'Received', '50% down payment');

-- =====================================================
-- SAMPLE COMMUNICATIONS
-- =====================================================
INSERT INTO communications (project_id, client_id, type, subject, content, contact_info, direction) VALUES
-- Project 1 communications
(1, 1, 'email', 'Project Kickoff', 'Hi Ahmad, Thank you for choosing us for your website redesign project. Please find attached the project timeline and milestones.', 'ahmad.rizki@email.com', 'outgoing'),
(1, 1, 'whatsapp', NULL, 'Confirmed meeting for next Monday at 2 PM to discuss design mockups.', '+6281234567890', 'outgoing'),
(1, 1, 'whatsapp', NULL, 'Client approved the homepage design. Moving to inner pages.', '+6281234567890', 'incoming'),

-- Project 3 communications
(3, 2, 'email', 'E-Commerce Requirements', 'Dear Siti, Please review the attached requirements document for the e-commerce platform.', 'siti.nurhaliza@company.co.id', 'outgoing'),
(3, 2, 'note', 'Meeting Notes', 'Discussed payment gateway options. Client prefers Midtrans for local payments. Will also integrate PayPal for international customers.', NULL, 'outgoing'),

-- Project 7 communications
(7, 4, 'whatsapp', NULL, 'Sent initial wireframes for review. Waiting for feedback.', '+6281234567893', 'outgoing'),
(7, 4, 'email', 'UI Design Progress Update', 'Hi Diana, Please find the updated UI mockups in the attached Figma link.', 'diana.putri@startup.io', 'outgoing');

-- =====================================================
-- SAMPLE CONTACT SUBMISSIONS
-- =====================================================
INSERT INTO contact_submissions (name, email, phone, service_id, message, status, converted_client_id) VALUES
('Rina Wijaya', 'rina.wijaya@newclient.com', '+6281234567895', 1, 'Hi, I need a website for my restaurant. Can you provide a quote?', 'New', NULL),
('Hendra Kusuma', 'hendra.k@email.com', '+6281234567896', 4, 'Looking for someone to build an online store. Budget around 30 million IDR.', 'Reviewed', NULL),
('Ahmad Rizki', 'ahmad.rizki@email.com', '+6281234567890', 2, 'Interested in mobile app development for my company.', 'Converted', 1),
('Dewi Lestari', 'dewi.lestari@company.com', '+6281234567897', 3, 'Need UI/UX design for our new product. Urgent project.', 'New', NULL),
('Spam Bot', 'spam@spammer.com', NULL, NULL, 'Buy cheap products at www.spam-link.com!!!', 'Spam', NULL);

-- Mark the Ahmad Rizki submission as duplicate (existing client)
UPDATE contact_submissions SET is_duplicate = TRUE WHERE id = 3;

-- =====================================================
-- SAMPLE DUPLICATE WARNINGS
-- =====================================================
INSERT INTO duplicate_warnings (submission_id, duplicate_of_client_id, match_type, is_resolved, resolved_at) VALUES
(3, 1, 'both', TRUE, '2024-02-01 10:00:00');
