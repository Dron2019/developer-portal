<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectServerController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\RepositoryRequestController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\CheckActive;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/github/redirect', [AuthController::class, 'githubRedirect']);
    Route::get('/github/callback', [AuthController::class, 'githubCallback']);
});

// Protected routes
Route::middleware(['auth:sanctum', CheckActive::class])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // User permissions
    Route::get('/users/me/permissions', [UserController::class, 'permissions']);

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::get('/projects/{id}/servers', [ProjectServerController::class, 'index']);
    Route::post('/projects/{id}/servers', [ProjectServerController::class, 'store']);
    Route::get('/projects/{id}/repositories', [RepositoryController::class, 'index']);

    // Repositories
    Route::get('/repositories', [RepositoryController::class, 'index']);
    Route::get('/repositories/{repository}', [RepositoryController::class, 'show']);
    Route::get('/repositories/{repository}/members', [RepositoryController::class, 'members']);
    Route::post('/repositories/sync', [RepositoryController::class, 'sync'])
        ->middleware('role:admin,manager');

    // Repository Requests
    Route::get('/repository-requests', [RepositoryRequestController::class, 'index']);
    Route::post('/repository-requests', [RepositoryRequestController::class, 'store']);
    Route::get('/repository-requests/{repositoryRequest}', [RepositoryRequestController::class, 'show']);
    Route::put('/repository-requests/{repositoryRequest}', [RepositoryRequestController::class, 'update'])
        ->middleware('role:admin,manager');
    Route::delete('/repository-requests/{repositoryRequest}', [RepositoryRequestController::class, 'destroy']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
});

