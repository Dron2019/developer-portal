# Developer Portal

Developer Portal — портал для розробників з управлінням GitHub-репозиторіями, проектами, серверними доступами та командами.

## Структура директорій

```
developer-portal/
├── backend/          # Laravel 11 (PHP 8.2+)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   │   └── api.php
│   ├── .env.example
│   └── composer.json
└── frontend/         # React 18 + Vite + Tailwind CSS
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── layouts/
    │   ├── pages/
    │   ├── store/
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## Стек технологій

| Компонент | Технологія |
|-----------|-----------|
| **Backend** | PHP 8.2+ / Laravel 11 |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **База даних** | MySQL |
| **Авторизація** | JWT + OAuth2 (GitHub) |
| **State Management** | Zustand |
| **HTTP Client** | Axios + TanStack Query |

## Запуск Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve
```

## Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend буде доступний на `http://localhost:5173`, backend API на `http://localhost:8000`.

---

## Production Deployment

### Requirements

- Ubuntu 22.04+ (or any Debian-based distro)
- PHP 8.2+ with extensions: `mbstring`, `xml`, `pdo_mysql`, `curl`, `zip`, `bcmath`, `tokenizer`
- Composer 2
- Node.js 20+ and npm
- MySQL 8+ (or MariaDB 10.6+)
- Nginx
- SSL certificate (Let's Encrypt recommended)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-org/developer-portal.git /var/www/developer-portal
cd /var/www/developer-portal
```

---

### 2. Backend setup

```bash
cd /var/www/developer-portal/backend

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Copy and configure environment
cp .env.example .env
```

Edit `.env` with production values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_HOST=127.0.0.1
DB_DATABASE=developer_portal
DB_USERNAME=portal_user
DB_PASSWORD=your_strong_password

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=https://api.yourdomain.com/api/auth/github/callback

# Mail (use SMTP in production)
MAIL_MAILER=smtp
MAIL_HOST=smtp.yourmailprovider.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_mail_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com

FRONTEND_URL=https://yourdomain.com
```

```bash
# Generate application key and JWT secret
php artisan key:generate
php artisan jwt:secret

# Run migrations and seeders
php artisan migrate --force
php artisan db:seed --force

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set storage permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Create the storage symlink
php artisan storage:link
```

---

### 3. Frontend build

```bash
cd /var/www/developer-portal/frontend

# Install dependencies
npm ci

# Create production environment file
cp .env.example .env.production 2>/dev/null || true
```

Set the API base URL in `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com
```

```bash
# Build for production
npm run build
```

The compiled assets will be in `frontend/dist/`.

---

### 4. MySQL database

```sql
CREATE DATABASE developer_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON developer_portal.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### 5. Nginx configuration

Create `/etc/nginx/sites-available/developer-portal`:

```nginx
# API (Laravel backend)
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    root /var/www/developer-portal/backend/public;
    index index.php;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}

# Frontend (React SPA)
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    root /var/www/developer-portal/frontend/dist;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

```bash
ln -s /etc/nginx/sites-available/developer-portal /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### 6. SSL certificate (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

### 7. Queue worker (optional, for background jobs)

If the application uses queued jobs or notifications, set up a Supervisor worker:

```bash
apt install supervisor -y
```

Create `/etc/supervisor/conf.d/developer-portal-worker.conf`:

```ini
[program:developer-portal-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/developer-portal/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/developer-portal/backend/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl start developer-portal-worker:*
```

---

### 8. Updating the application

```bash
cd /var/www/developer-portal

git pull origin main

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd ../frontend
npm ci
npm run build

# Restart PHP-FPM
systemctl restart php8.2-fpm
```

---

### Directory permissions summary

| Path | Owner | Mode |
|------|-------|------|
| `backend/storage/` | `www-data` | `775` |
| `backend/bootstrap/cache/` | `www-data` | `775` |
| `frontend/dist/` | deploy user | `755` |
