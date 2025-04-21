<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\CancionController;
use App\Http\Controllers\EPController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\SingleController;
use App\Models\Cancion;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    $cancionesAleatorias = Cancion::query()
        ->inRandomOrder()
        ->limit(8)
        ->get()
        ->map(function ($cancion) {
            return $cancion;
        });

    $artistasPopulares = [];

    return Inertia::render('Welcome', [
        'auth' => [
            'user' => Auth::user(),
        ],
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'cancionesAleatorias' => $cancionesAleatorias,
        'artistasPopulares' => $artistasPopulares,
    ]);
})->name('welcome');


Route::get('/genres/{slug}', function (string $slug) {
     return Inertia::render('Static/FeatureUnavailable', [
         'featureName' => 'Explorar por Género (' . e($slug) . ')'
     ]);
})->name('genres.show');

Route::get('/artists/{slug}', function (string $slug) {
     return Inertia::render('Static/FeatureUnavailable', [
         'featureName' => 'Página de Artista (' . e($slug) . ')'
     ]);
})->name('artists.show');


Route::inertia('/terms', 'Static/Terms')->name('terms');
Route::inertia('/privacy', 'Static/Privacy')->name('privacy');
Route::inertia('/contact', 'Static/Contact')->name('contact');


Route::get('/dashboard', function () {
    return Inertia::render('Dashboard', [
        'auth' => ['user' => Auth::user()],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');


Route::middleware('auth')->group(function () {

    Route::get('/profile/index', [ProfileController::class, 'index'])->name('profile.index');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('canciones', CancionController::class);
    Route::resource('playlists', PlaylistController::class);
    Route::resource('albumes', AlbumController::class);
    Route::resource('eps', EPController::class);
    Route::resource('singles', SingleController::class);

    Route::get('/playlists/{playlist}/songs/search', [PlaylistController::class, 'buscarCanciones'])->name('songs.search');
    Route::post('/playlists/{playlist}/songs', [PlaylistController::class, 'anadirCancion'])->name('playlists.songs.add');
    Route::delete('/playlists/{playlist}/songs/{pivotId}', [PlaylistController::class, 'quitarCancionPorPivot'])->name('playlists.songs.remove');

    Route::get('/albumes/{album}/songs/search', [AlbumController::class, 'buscarCanciones'])->name('albumes.songs.search');
    Route::post('/albumes/{album}/songs', [AlbumController::class, 'anadirCancion'])->name('albumes.songs.add');
    Route::delete('/albumes/{album}/songs/{pivotId}', [AlbumController::class, 'quitarCancionPorPivot'])->name('albumes.songs.remove');

    Route::get('/eps/{ep}/songs/search', [EPController::class, 'buscarCanciones'])->name('eps.songs.search');
    Route::post('/eps/{ep}/songs', [EPController::class, 'anadirCancion'])->name('eps.songs.add');
    Route::delete('/eps/{ep}/songs/{pivotId}', [EPController::class, 'quitarCancionPorPivot'])->name('eps.songs.remove');

    Route::get('/singles/{single}/songs/search', [SingleController::class, 'buscarCanciones'])->name('singles.songs.search');
    Route::post('/singles/{single}/songs', [SingleController::class, 'anadirCancion'])->name('singles.songs.add');
    Route::delete('/singles/{single}/songs/{pivotId}', [SingleController::class, 'quitarCancionPorPivot'])->name('singles.songs.remove');

    Route::get('/users/search', [CancionController::class, 'searchUsers'])->name('users.search');

});


require __DIR__.'/auth.php';
