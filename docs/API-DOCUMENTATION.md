# API Documentation

Complete reference for the Client Management System REST API.

## Base URL

```
Development: http://localhost:8000/api
Production:  https://yourdomain.com/api
```

## Authentication

Most endpoints require authentication via Bearer token.

### Headers

```
Authorization: Bearer <session_token>
Content-Type: application/json
```

### Public Endpoints (No Auth Required)

- `GET /api/auth/check-setup`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/submissions` (for contact form integration)

---

## Response Format

All responses follow this structure:

### Success Response

```json
{
    "success": true,
    "message": "Operation message",
    "data": { ... }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error description",
    "errors": { ... }  // Validation errors (optional)
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## Authentication Endpoints

### Check Setup Status

Check if initial admin setup is needed.

```
GET /api/auth/check-setup
```

**Response:**
```json
{
    "success": true,
    "data": {
        "needs_setup": true
    }
}
```

### Initial Setup

Create the first admin account. Only works if no admins exist.

```
POST /api/auth/setup
```

**Body:**
```json
{
    "username": "admin",
    "password": "securepassword",
    "email": "admin@example.com"  // Optional
}
```

**Response:**
```json
{
    "success": true,
    "message": "Admin account created successfully",
    "data": {
        "token": "session_token_here",
        "admin": {
            "id": 1,
            "username": "admin"
        }
    }
}
```

### Login

```
POST /api/auth/login
```

**Body:**
```json
{
    "username": "admin",
    "password": "securepassword"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "session_token_here",
        "admin": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com"
        }
    }
}
```

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

### Verify Session

```
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response:**
```json
{
    "success": true,
    "message": "Session valid",
    "data": {
        "admin": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com"
        }
    }
}
```

---

## Client Endpoints

### List Clients

```
GET /api/clients
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name, email, company |
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |

**Response:**
```json
{
    "success": true,
    "data": {
        "clients": [
            {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+62812345678",
                "company": "Acme Inc",
                "address": "Jakarta, Indonesia",
                "notes": "VIP client",
                "created_at": "2025-01-01T10:00:00Z",
                "updated_at": "2025-01-01T10:00:00Z"
            }
        ],
        "pagination": {
            "total": 50,
            "page": 1,
            "limit": 20,
            "total_pages": 3
        }
    }
}
```

### Get Single Client

```
GET /api/clients/:id
```

**Response:**
```json
{
    "success": true,
    "data": {
        "client": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "+62812345678",
            "company": "Acme Inc",
            "address": "Jakarta, Indonesia",
            "notes": "VIP client",
            "created_at": "2025-01-01T10:00:00Z",
            "updated_at": "2025-01-01T10:00:00Z",
            "projects_count": 3,
            "total_budget": 50000000,
            "total_paid": 35000000
        }
    }
}
```

### Create Client

```
POST /api/clients
```

**Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+62812345678",
    "company": "Acme Inc",
    "address": "Jakarta, Indonesia",
    "notes": "VIP client"
}
```

**Required Fields:** `name`, `email`

### Update Client

```
PUT /api/clients/:id
```

**Body:** Same as Create (all fields optional)

### Delete Client

```
DELETE /api/clients/:id
```

---

## Project Endpoints

### List Projects

```
GET /api/projects
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| client_id | int | Filter by client |
| status | string | Filter by status |
| search | string | Search by title |
| page | int | Page number |
| limit | int | Items per page |

**Status Options:** `Pending`, `In Progress`, `Completed`, `On Hold`, `Cancelled`

### Get Single Project

```
GET /api/projects/:id
```

**Response includes:** Project details, client info, services, budget summary

### Create Project

```
POST /api/projects
```

**Body:**
```json
{
    "client_id": 1,
    "title": "Company Website Redesign",
    "description": "Complete website overhaul",
    "status": "Pending",
    "budget": 15000000,
    "start_date": "2025-01-15",
    "deadline": "2025-03-15",
    "service_ids": [1, 2, 3]
}
```

**Required Fields:** `client_id`, `title`

### Update Project

```
PUT /api/projects/:id
```

### Delete Project

```
DELETE /api/projects/:id
```

### Get Project Budget Summary

```
GET /api/projects/:id/budget-summary
```

**Response:**
```json
{
    "success": true,
    "data": {
        "budget": 15000000,
        "total_expenses": 5000000,
        "total_payments": 7500000,
        "remaining_budget": 10000000,
        "utilization_percent": 33.33,
        "payment_percent": 50.00,
        "expenses_by_category": {
            "Materials": 2000000,
            "Labor": 2500000,
            "Hosting": 500000
        }
    }
}
```

---

## Expense Endpoints

### List Project Expenses

```
GET /api/projects/:id/expenses
```

### Create Expense

```
POST /api/projects/:id/expenses
```

**Body:**
```json
{
    "description": "Domain registration",
    "amount": 150000,
    "category": "Hosting",
    "expense_date": "2025-01-15",
    "notes": "1 year renewal"
}
```

**Category Options:** `Materials`, `Labor`, `Hosting`, `Software`, `Transportation`, `Other`

### Update Expense

```
PUT /api/expenses/:id
```

### Delete Expense

```
DELETE /api/expenses/:id
```

---

## Payment Endpoints

### List Project Payments

```
GET /api/projects/:id/payments
```

### Create Payment

```
POST /api/projects/:id/payments
```

**Body:**
```json
{
    "amount": 7500000,
    "payment_method": "Bank Transfer",
    "payment_date": "2025-01-10",
    "status": "Received",
    "notes": "50% down payment",
    "reference_number": "TRX-001"
}
```

**Payment Methods:** `Bank Transfer`, `Cash`, `E-Wallet`, `Credit Card`, `Other`

**Payment Status:** `Pending`, `Received`, `Refunded`

### Update Payment

```
PUT /api/payments/:id
```

### Delete Payment

```
DELETE /api/payments/:id
```

---

## Communication Endpoints

### List Project Communications

```
GET /api/projects/:id/communications
```

### List Client Communications

```
GET /api/clients/:id/communications
```

### Create Communication

```
POST /api/projects/:id/communications
```

**Body:**
```json
{
    "type": "email",
    "subject": "Project kickoff",
    "content": "Dear John, We're excited to start...",
    "communication_date": "2025-01-15T10:30:00Z"
}
```

**Communication Types:** `email`, `whatsapp`, `note`

### Delete Communication

```
DELETE /api/communications/:id
```

---

## Service Endpoints

### List Services

```
GET /api/services
```

### Create Service

```
POST /api/services
```

**Body:**
```json
{
    "name": "Web Development",
    "description": "Custom website development",
    "base_price": 5000000
}
```

### Update Service

```
PUT /api/services/:id
```

### Delete Service

```
DELETE /api/services/:id
```

---

## Submission Endpoints (Contact Form)

### List Submissions

```
GET /api/submissions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| search | string | Search name/email |
| page | int | Page number |
| limit | int | Items per page |

**Status Options:** `New`, `Reviewed`, `Converted`, `Spam`

### Create Submission (Public)

```
POST /api/submissions
```

**No authentication required** - Use this for your website's contact form.

**Body:**
```json
{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+62812345678",
    "company": "Tech Corp",
    "service": "Web Development",
    "message": "I need a new website...",
    "source": "website"
}
```

**Required Fields:** `name`, `email`, `message`

### Get Single Submission

```
GET /api/submissions/:id
```

### Update Submission

```
PUT /api/submissions/:id
```

### Delete Submission

```
DELETE /api/submissions/:id
```

### Convert Submission to Client

```
POST /api/submissions/:id/convert
```

**Body:**
```json
{
    "create_project": true,
    "project_title": "Website for Tech Corp",
    "project_budget": 10000000
}
```

### Get Potential Duplicates

```
GET /api/submissions/:id/duplicates
```

---

## File Endpoints

### List Project Files

```
GET /api/projects/:id/files
```

### List Client Files

```
GET /api/clients/:id/files
```

### Upload File

```
POST /api/files/upload
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| file | File | The file to upload (max 5MB) |
| project_id | int | Associated project ID |
| description | string | File description (optional) |

**Allowed Extensions:** jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, zip, rar, txt

### Delete File

```
DELETE /api/files/:id
```

---

## Report Endpoints

### Dashboard Stats

```
GET /api/reports/dashboard
```

**Response:**
```json
{
    "success": true,
    "data": {
        "total_clients": 25,
        "total_projects": 42,
        "active_projects": 12,
        "total_revenue": 450000000,
        "total_expenses": 180000000,
        "pending_payments": 75000000,
        "new_submissions": 5,
        "recent_projects": [...],
        "recent_submissions": [...]
    }
}
```

### Budget Overview

```
GET /api/reports/budget-overview
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | date | Filter from date |
| end_date | date | Filter to date |
| client_id | int | Filter by client |

### Export Clients (CSV)

```
GET /api/reports/export/clients
```

Returns CSV file download.

### Export Projects (CSV)

```
GET /api/reports/export/projects
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| client_id | int | Filter by client |

### Export Project Detail (CSV)

```
GET /api/reports/export/project/:id
```

Exports project with all expenses and payments.

---

## Error Handling

### Validation Errors (422)

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": "Valid email is required",
        "name": "Name must be at least 2 characters"
    }
}
```

### Not Found (404)

```json
{
    "success": false,
    "message": "Client not found"
}
```

### Unauthorized (401)

```json
{
    "success": false,
    "message": "Authentication required"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting at the server level (e.g., Nginx) or implementing it in the API.

## Currency

All monetary values are in **IDR (Indonesian Rupiah)** and stored as integers (no decimals).
