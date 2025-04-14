<?php

use App\Http\Controllers\CancionController;
use App\Http\Controllers\ProfileController; // Asegúrate de que ProfileController está importado
use App\Http\Controllers\PlaylistController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {

    Route::get('/profile/index', [ProfileController::class, 'index']) ->name('profile.index'); 

    Route::get('/profile', [ProfileController::class, 'edit']) 
         ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update']) 
         ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy']) 
         ->name('profile.destroy');

    Route::resource('canciones', CancionController::class);
    Route::resource('playlists', PlaylistController::class);
});

require __DIR__.'/auth.php';