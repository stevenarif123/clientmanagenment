# ClientHub - Client & Project Management System

A unified, lightweight client and project management system. Track clients, projects, budgets, expenses, payments, communications, and website inquiries all in one place.

## Features

- **Client Management** - Full CRUD operations, search, and communication history
- **Project Tracking** - 5 status levels (Pending, In Progress, Completed, On Hold, Cancelled)
- **Budget Management** - Track expenses and payments with automated budget calculations and profit margins
- **Communication Logs** - Record emails, WhatsApp messages, and internal notes
- **File Management** - Upload and organize project attachments
- **Contact Form Integration** - Auto-capture submissions from your website with duplicate detection
- **Financial Reports & Export** - Dashboard metrics, budget breakdown, CSV and PDF report generation
- **Zero Build Step** - HTML + Vue 3 CDN (No Node.js or npm build required)
- **Zero Cloud Dependency** - Embedded SQLite database (self-contained, fast, and portable)

## Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | Vue 3 (CDN), Tailwind CSS (CDN), Axios |
| **Backend** | Vanilla PHP 8.0+ REST API |
| **Database** | SQLite 3 (Auto-initialized with WAL mode & foreign keys) |
| **Routing** | Front Controller & Hash Router |
| **Auth** | Bearer Token Session-based authentication |

## Unified Project Structure

```
ClientManagement/
├── index.html            # Main Single Page Application UI
├── index.php             # Main REST API router
├── router.php            # Development server router
├── start-server.bat      # One-click launch script
├── .htaccess             # Apache deployment rules
│
├── assets/               # Core CSS & JS
│   ├── css/app.css       # Custom styling & themes
│   └── js/
│       ├── api.js        # Axios HTTP client
│       ├── auth.js       # Reactive auth store
│       └── utils.js      # Formatting helpers
│
├── js/                   # Vue 3 Components & Pages
│   ├── components/
│   │   ├── layout.js     # Sidebar, Header & Navigation
│   │   ├── modals.js     # Modals (Clients, Projects, Expenses, Payments, Comms)
│   │   └── stats-card.js # Metrics cards
│   └── pages/
│       ├── dashboard.js  # Dashboard overview
│       ├── clients.js    # Client directory & details
│       ├── projects.js   # Project tracking & budgets
│       ├── submissions.js# Website inquiries
│       ├── services.js   # Services catalog
│       ├── reports.js    # Financial statements & export
│       └── login.js      # Login & setup views
│
├── api/                  # PHP API Controller Endpoints
│   ├── auth.php
│   ├── clients.php
│   ├── projects.php
│   ├── expenses.php
│   ├── payments.php
│   ├── communications.php
│   ├── services.php
│   ├── submissions.php
│   ├── files.php
│   └── reports.php
│
├── config/               # Configuration
│   ├── .env.php
│   ├── .env.example.php
│   ├── database.php      # SQLite connection & migrations
│   └── constants.php
│
├── middleware/           # Auth middleware
│   └── auth.php
│
├── utils/                # Utilities
│   ├── response.php
│   ├── validator.php
│   ├── duplicateDetector.php
│   └── logger.php
│
├── data/                 # SQLite database storage (Protected)
│   ├── database.sqlite
│   └── .htaccess
│
└── setup/                # SQL Schemas
    ├── database-schema-sqlite.sql
    └── seed-data.sql
```

## Quick Start

### Prerequisites

- PHP 8.0+ with `pdo_sqlite` enabled (default on PHP 8)
- No Node.js, npm, or database server installation required!

### Running Locally (Development)

**Option 1: Windows Batch File**
Double click `start-server.bat`

**Option 2: Terminal**
```bash
php -S localhost:8000 router.php
```

Then open your browser and navigate to:
```
http://localhost:8000
```

### Initial Admin Setup

If starting with a fresh database, navigating to `http://localhost:8000` will automatically display the **Initial Admin Setup** screen to create your administrator account.

## Production Deployment (Hostinger / cPanel)

1. Upload the entire `ClientManagement/` folder to your web root (`public_html/`).
2. Verify that `data/.htaccess` exists to protect the SQLite database file from direct browser download.
3. Ensure PHP 8.0+ is selected in your hosting control panel.
4. Access `https://yourdomain.com` in your browser.

## License

MIT License.
