<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\CancionController;
use App\Http\Controllers\EPController;
use App\Http\Controllers\ProfileController;
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
    Route::resource('albumes', AlbumController::class);
    Route::resource('eps', EPController::class);
});

Route::middleware('auth')->get('/playlists/{playlist}/songs/search', [PlaylistController::class, 'buscarCanciones'])->name('songs.search');
Route::middleware('auth')->post('/playlists/{playlist}/songs', [PlaylistController::class, 'anadirCancion'])->name('playlists.songs.add');
Route::middleware('auth')->delete('/playlists/{playlist}/songs/{pivotId}', [PlaylistController::class, 'quitarCancionPorPivot'])->name('playlists.songs.remove');

Route::middleware('auth')->get('/albumes/{album}/songs/search', [AlbumController::class, 'buscarCanciones'])->name('albumes.songs.search');
Route::middleware('auth')->post('/albumes/{album}/songs', [AlbumController::class, 'anadirCancion'])->name('albumes.songs.add');
Route::middleware('auth')->delete('/albumes/{album}/songs/{pivotId}', [AlbumController::class, 'quitarCancionPorPivot'])->name('albumes.songs.remove');

Route::middleware('auth')->get('/eps/{ep}/songs/search', [EPController::class, 'buscarCanciones'])->name('eps.songs.search');
Route::middleware('auth')->post('/eps/{ep}/songs', [EPController::class, 'anadirCancion'])->name('eps.songs.add');
Route::middleware('auth')->delete('/eps/{ep}/songs/{pivotId}', [EPController::class, 'quitarCancionPorPivot'])->name('eps.songs.remove');

Route::get('/users/search', [CancionController::class, 'searchUsers'])->name('users.search'); // Or point to UserController@search

require __DIR__.'/auth.php';
