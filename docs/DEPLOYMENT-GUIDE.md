# Deployment Guide - Hostinger

Step-by-step guide to deploy the Client Management System on Hostinger shared hosting.

## Prerequisites

- Hostinger account with a hosting plan
- Domain name (or use Hostinger's temporary domain)
- Supabase database already set up (see SETUP-GUIDE.md)
- Node.js installed locally for building frontend

## Overview

```
yourdomain.com/
├── api/          ← Backend PHP files
│   └── index.php (main entry point)
└── index.html    ← Frontend files (built Vue.js app)
```

---

## Step 1: Build Frontend

1. Open terminal in `frontend` directory

2. Create production `.env` file:
   ```
   VITE_API_URL=https://yourdomain.com/api
   ```

3. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

4. This creates a `dist` folder with:
   ```
   dist/
   ├── index.html
   ├── assets/
   │   ├── index-xxxxx.js
   │   └── index-xxxxx.css
   └── ...
   ```

---

## Step 2: Prepare Backend

1. Navigate to `backend/config/`

2. Create `.env.php` from example:
   ```bash
   cp .env.example.php .env.php
   ```

3. Edit `.env.php` with production settings:

```php
<?php
return [
    // Environment
    'APP_ENV' => 'production',
    'APP_DEBUG' => false,  // IMPORTANT: Disable debug in production
    
    // Database (Supabase)
    'DB_HOST' => 'db.YOUR_PROJECT_ID.supabase.co',
    'DB_PORT' => '5432',
    'DB_NAME' => 'postgres',
    'DB_USER' => 'postgres',
    'DB_PASSWORD' => 'YOUR_SUPABASE_DB_PASSWORD',
    
    // Supabase Storage
    'SUPABASE_URL' => 'https://YOUR_PROJECT_ID.supabase.co',
    'SUPABASE_KEY' => 'YOUR_SUPABASE_ANON_KEY',
    'SUPABASE_BUCKET' => 'client-files',
    
    // CORS - Only allow your domain
    'CORS_ALLOWED_ORIGINS' => [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
    ],
];
```

4. Create `.htaccess` in backend folder for API routing:

```apache
RewriteEngine On
RewriteBase /api/

# Handle API requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Protect sensitive files
<FilesMatch "(\.env\.php|\.env|\.git|composer\.(json|lock))$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

---

## Step 3: Upload Files to Hostinger

### Using File Manager (Web-based)

1. Log in to Hostinger hPanel
2. Go to **Files** → **File Manager**
3. Navigate to `public_html` (or your domain's root folder)
4. Delete default files (index.html, etc.) if any

5. **Upload frontend files:**
   - Upload contents of `frontend/dist/` to `public_html/`
   - Structure should be:
     ```
     public_html/
     ├── index.html
     └── assets/
     ```

6. **Upload backend files:**
   - Create `api` folder in `public_html/`
   - Upload contents of `backend/` to `public_html/api/`
   - Structure should be:
     ```
     public_html/
     └── api/
         ├── index.php
         ├── config/
         ├── api/
         ├── middleware/
         ├── utils/
         └── .htaccess
         └── ...
     ```

### Using FTP (FileZilla)

1. Get FTP credentials from Hostinger hPanel → **Files** → **FTP Accounts**

2. Connect using FileZilla:
   - Host: `ftp.yourdomain.com` or IP address
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21

3. Upload files as described above

---

## Step 4: Configure Root .htaccess

Create/edit `.htaccess` in `public_html/` for SPA routing:

```apache
RewriteEngine On
RewriteBase /

# Redirect HTTP to HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routes - pass to backend
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# Frontend SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ index.html [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## Step 5: Set File Permissions

In Hostinger File Manager or via FTP:

1. Set permissions for folders: `755`
   - `api/`
   - `api/config/`
   - `api/logs/`

2. Set permissions for PHP files: `644`

3. Create `logs` directory if it doesn't exist:
   - Create `api/logs/` folder
   - Set permissions to `755`

---

## Step 6: Configure PHP Version

1. In Hostinger hPanel, go to **Advanced** → **PHP Configuration**
2. Select PHP 8.0 or higher
3. Enable required extensions:
   - `pdo_pgsql` (for PostgreSQL)
   - `json`
   - `mbstring`
   - `curl`

---

## Step 7: Test the Deployment

1. **Test API endpoint:**
   - Visit `https://yourdomain.com/api/auth/check-setup`
   - Should return: `{"success":true,"data":{"needs_setup":true}}`

2. **Test frontend:**
   - Visit `https://yourdomain.com`
   - Should see the login page or setup page

3. **Complete setup:**
   - If first time, complete admin setup
   - Log in and test all features

---

## Step 8: SSL Certificate

Hostinger usually provides free SSL. To enable:

1. Go to Hostinger hPanel
2. Navigate to **Security** → **SSL**
3. Enable "Free SSL" for your domain
4. Wait for certificate installation (usually < 10 minutes)
5. Enable "Force HTTPS" option

---

## Troubleshooting

### 500 Internal Server Error

1. Check `api/logs/` for error logs
2. Verify `.env.php` exists and has correct syntax
3. Check PHP version is 8.0+
4. Verify PostgreSQL PDO extension is enabled

### 404 Not Found on API

1. Verify `.htaccess` files are uploaded
2. Check if mod_rewrite is enabled
3. Verify file structure matches expected layout

### Database Connection Failed

1. Check Supabase credentials in `.env.php`
2. Supabase free tier pauses after inactivity - wake it up
3. Verify SSL mode is enabled (required for Supabase)

### CORS Errors

1. Check `CORS_ALLOWED_ORIGINS` in `.env.php`
2. Ensure your domain (with https) is listed
3. Clear browser cache

### Login Not Working

1. Check browser console for errors
2. Verify API URL is correct in frontend build
3. Check session table exists in database

### Files Not Uploading

1. Check PHP `upload_max_filesize` (should be >= 5M)
2. Check PHP `post_max_size` (should be >= 8M)
3. Verify Supabase Storage bucket exists
4. Check Supabase API key

### Blank Page

1. Check browser console for JavaScript errors
2. Verify all frontend assets uploaded correctly
3. Check if Vue.js bundle is loading

---

## Security Checklist

- [ ] `APP_DEBUG` set to `false` in `.env.php`
- [ ] `APP_ENV` set to `production`
- [ ] HTTPS enabled and forced
- [ ] `.env.php` protected by `.htaccess`
- [ ] Strong admin password set
- [ ] CORS configured for your domain only
- [ ] Database credentials not exposed

---

## Updating the Application

### Frontend Updates

1. Make changes locally
2. Run `npm run build`
3. Upload new `dist/` contents to `public_html/`
4. Clear browser cache

### Backend Updates

1. Make changes locally
2. Upload changed files to `public_html/api/`
3. Don't overwrite `.env.php` unless needed

---

## Backup Recommendations

1. **Database:** Supabase handles backups automatically (7 days for free tier)
2. **Files:** Download `public_html/` periodically via File Manager
3. **Configuration:** Keep local copy of `.env.php`

---

## Alternative: Subdomain Setup

If you want the app on a subdomain (e.g., `app.yourdomain.com`):

1. Create subdomain in Hostinger hPanel
2. Point subdomain to a folder (e.g., `public_html/clientapp/`)
3. Upload files to that folder instead
4. Update `.env.php` CORS settings
5. Update frontend API URL before building
