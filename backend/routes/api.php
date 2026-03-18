<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectServerController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\RepositoryRequestController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:api');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:api');
    Route::get('/github/redirect', [AuthController::class, 'githubRedirect']);
    Route::get('/github/callback', [AuthController::class, 'githubCallback']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {

    // Users (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
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
    Route::post('/repositories/requests', [RepositoryRequestController::class, 'store']);
    Route::get('/repositories/requests', [RepositoryRequestController::class, 'index']);
    Route::put('/repositories/requests/{id}', [RepositoryRequestController::class, 'update']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
});
