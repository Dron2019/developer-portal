<?php

use Illuminate\Support\Facades\Route;

// Catch-all route: serve the React SPA for any non-API request
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
