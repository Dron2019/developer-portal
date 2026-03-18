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
| **База даних** | PostgreSQL |
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
