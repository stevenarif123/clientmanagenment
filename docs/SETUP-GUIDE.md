# Setup Guide

Complete step-by-step guide to set up the Client Management System.

## Prerequisites

- PHP 8.0 or higher
- Node.js 18+ and npm
- A Supabase account (free tier works)
- Web hosting with PHP support (e.g., Hostinger)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: ClientManagement (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
4. Click "Create new project" and wait for setup

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the contents of `backend/setup/database-schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

This creates all necessary tables:
- `admins` - Admin users
- `clients` - Client information
- `services` - Service types
- `projects` - Projects linked to clients
- `project_services` - Many-to-many relationship
- `expenses` - Project expenses
- `payments` - Client payments
- `communications` - Communication logs
- `files` - File metadata
- `submissions` - Contact form submissions
- `sessions` - Auth sessions
- `api_logs` - Request logging

## Step 3: (Optional) Load Sample Data

1. In SQL Editor, create another new query
2. Copy contents of `backend/setup/seed-data.sql`
3. Paste and run

This adds sample clients, projects, and data for testing.

## Step 4: Get Supabase Connection Details

1. Go to **Project Settings** (gear icon)
2. Click **Database** in the left menu
3. Scroll to "Connection string" section
4. Note down these values:
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432` (usually)
   - **Database name**: `postgres`
   - **User**: `postgres`
   - **Password**: The password you created earlier

## Step 5: Configure Backend

1. Navigate to `backend/config/`
2. Copy `.env.example.php` to `.env.php`:
   ```bash
   cp .env.example.php .env.php
   ```
3. Edit `.env.php` with your Supabase credentials:

```php
<?php
return [
    // Environment
    'APP_ENV' => 'development', // Change to 'production' when deploying
    'APP_DEBUG' => true,        // Set to false in production
    
    // Database (Supabase PostgreSQL)
    'DB_HOST' => 'db.YOUR_PROJECT_ID.supabase.co',
    'DB_PORT' => '5432',
    'DB_NAME' => 'postgres',
    'DB_USER' => 'postgres',
    'DB_PASSWORD' => 'YOUR_DATABASE_PASSWORD',
    
    // Supabase Storage (for file uploads)
    'SUPABASE_URL' => 'https://YOUR_PROJECT_ID.supabase.co',
    'SUPABASE_KEY' => 'YOUR_ANON_KEY', // Found in Project Settings > API
    'SUPABASE_BUCKET' => 'client-files',
    
    // CORS
    'CORS_ALLOWED_ORIGINS' => [
        'http://localhost:5173',  // Vite dev server
        'https://yourdomain.com', // Production domain
    ],
];
```

### Finding Your Supabase API Key

1. Go to **Project Settings** > **API**
2. Copy the `anon` `public` key (under "Project API keys")
3. The Project URL is shown at the top

### Setting Up Supabase Storage

1. Go to **Storage** in left sidebar
2. Click "New bucket"
3. Name it `client-files`
4. Toggle ON "Public bucket" (or configure RLS policies)
5. Click "Create bucket"

## Step 6: Set Up Frontend

1. Open terminal in the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API URL in `src/services/api.js`:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
   ```

4. Create `.env` file in frontend folder:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

## Step 7: Run Development Servers

### Option A: Using PHP Built-in Server (Recommended for Development)

1. Start PHP server for backend:
   ```bash
   cd backend
   php -S localhost:8000
   ```

2. In a new terminal, start Vite dev server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

### Option B: Using XAMPP/WAMP

1. Copy `backend` folder to your htdocs/www directory
2. Access via http://localhost/backend
3. Update frontend `.env`:
   ```
   VITE_API_URL=http://localhost/backend/api
   ```
4. Run `npm run dev` in frontend folder

## Step 8: Initial Admin Setup

1. Open the application in your browser
2. You'll be redirected to the Setup page (first time only)
3. Create your admin account:
   - **Username**: Your admin username (min 3 characters)
   - **Password**: Secure password (min 6 characters)
   - **Email**: (Optional) For notifications
4. Click "Create Admin Account"
5. You'll be logged in automatically

## Step 9: Integrate Contact Form (Optional)

To receive submissions from your website's contact form, make a POST request to the submissions endpoint:

```javascript
// Example: Add to your website's contact form
async function submitContactForm(formData) {
    const response = await fetch('https://your-api-domain.com/api/submissions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,       // Optional
            company: formData.company,   // Optional
            service: formData.service,   // Optional
            message: formData.message,
            source: 'website'            // Optional: track submission source
        }),
    });
    
    return response.json();
}
```

The submission endpoint is public and doesn't require authentication.

## Troubleshooting

### "Connection refused" error
- Ensure PHP server is running
- Check if port 8000 is available
- Verify database credentials in `.env.php`

### CORS errors
- Add your frontend URL to `CORS_ALLOWED_ORIGINS` in `.env.php`
- Clear browser cache and restart servers

### "Database connection failed"
- Verify Supabase credentials
- Check if project is paused (free tier pauses after inactivity)
- Ensure SSL is enabled (Supabase requires it)

### "Table does not exist"
- Run the database schema SQL again
- Check for any SQL errors in the output

### File upload fails
- Create the `client-files` bucket in Supabase Storage
- Check bucket permissions
- Verify `SUPABASE_KEY` is correct

## Next Steps

- Read [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for production deployment
- Read [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for API reference
