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
    Route::get('/usuarios/buscar', [CancionController::class, 'buscarUsuarios'])->name('usuarios.buscar');

});


require __DIR__.'/auth.php';
