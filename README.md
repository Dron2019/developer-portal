# Developer Portal

Developer Portal — портал для розробників з управлінням GitHub-репозиторіями, проектами, серверними доступами та командами.

## Структура директорій

```
developer-portal/         # Laravel 11 (PHP 8.2+) + React 18 + Vite
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Middleware/
│   └── Models/
├── database/
│   └── migrations/
├── routes/
│   ├── api.php
│   └── web.php
├── src/                  # React front-end source
│   ├── api/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── store/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── composer.json
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

## Запуск

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve
```

```bash
npm install
npm run dev
```

Backend API буде доступний на `http://localhost:8000`, Vite dev server на `http://localhost:5173`.

---

## Production Deployment

### Requirements

- Ubuntu 22.04+ (or any Debian-based distro)
- PHP 8.2+ with extensions: `mbstring`, `xml`, `pdo_mysql`, `curl`, `zip`, `bcmath`, `tokenizer`
- Composer 2
- Node.js 20+ and npm
- MySQL 8+ (or MariaDB 10.6+)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-org/developer-portal.git /var/www/developer-portal
cd /var/www/developer-portal
```

---

### 2. Install dependencies

```bash
composer install --no-dev --optimize-autoloader
npm ci
```

---

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with production values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_HOST=127.0.0.1
DB_DATABASE=developer_portal
DB_USERNAME=portal_user
DB_PASSWORD=your_strong_password

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/github/callback

# Mail (use SMTP in production)
MAIL_MAILER=smtp
MAIL_HOST=smtp.yourmailprovider.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_mail_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com

VITE_API_URL=https://yourdomain.com
```

---

### 4. Bootstrap the application

```bash
# Generate application key and JWT secret
php artisan key:generate
php artisan jwt:secret

# Run migrations
php artisan migrate --force

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create the storage symlink
php artisan storage:link

# Set storage permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

---

### 5. Build the frontend

```bash
npm run build
```

The compiled React SPA will be output to `dist/`. Copy it into `public/` so Laravel serves it:

```bash
cp -r dist/* public/
```

---

### 6. MySQL database

```sql
CREATE DATABASE developer_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON developer_portal.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
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
command=php /var/www/developer-portal/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/developer-portal/storage/logs/worker.log
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

composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

npm ci
npm run build
cp -r dist/* public/

systemctl restart php8.2-fpm
```

---

### Directory permissions summary

| Path | Owner | Mode |
|------|-------|------|
| `storage/` | `www-data` | `775` |
| `bootstrap/cache/` | `www-data` | `775` |
| `public/` | deploy user | `755` |
