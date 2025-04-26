<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\CancionController;
use App\Http\Controllers\ContenedorController;
use App\Http\Controllers\EPController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SingleController;
use App\Models\Cancion;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\User;

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
Route::get('/biblioteca', function () {
        $usuario = Auth::user();
        $playlists = $usuario->perteneceContenedores()
            ->where('tipo', 'playlist')
            ->with('usuarios:id,name')
            ->orderBy('pertenece_user.created_at', 'desc')
            ->get();

        $playlistsLoopZs = $usuario->loopzContenedores()
            ->where('tipo', 'playlist')
            ->with('usuarios:id,name')
            ->orderBy('loopzs_contenedores.created_at', 'desc')
            ->get();


        return Inertia::render('Biblioteca', [
            'playlists' => $playlists,
            'playlistsLoopZs' => $playlistsLoopZs,
        ]);
})->name('biblioteca');


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


    Route::resource('playlists', ContenedorController::class);

    Route::get('/playlists/{contenedor}/songs/search', [ContenedorController::class, 'buscarCanciones'])->name('playlists.songs.search');
    Route::post('/playlists/{contenedor}/songs', [ContenedorController::class, 'anadirCancion'])->name('playlists.songs.add');
    Route::delete('/playlists/{contenedor}/songs/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('playlists.songs.remove');

    Route::resource('albumes', ContenedorController::class);

    Route::get('/albumes/{contenedor}/songs/search', [ContenedorController::class, 'buscarCanciones'])->name('albumes.songs.search');
    Route::post('/albumes/{contenedor}/songs', [ContenedorController::class, 'anadirCancion'])->name('albumes.songs.add');
    Route::delete('/albumes/{contenedor}/songs/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('albumes.songs.remove');

    Route::resource('eps', ContenedorController::class);

    Route::get('/eps/{contenedor}/songs/search', [ContenedorController::class, 'buscarCanciones'])->name('eps.songs.search');
    Route::post('/eps/{contenedor}/songs', [ContenedorController::class, 'anadirCancion'])->name('eps.songs.add');
    Route::delete('/eps/{contenedor}/songs/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('eps.songs.remove');

    Route::resource('singles', ContenedorController::class);

    Route::get('/singles/{contenedor}/songs/search', [ContenedorController::class, 'buscarCanciones'])->name('singles.songs.search');
    Route::post('/singles/{contenedor}/songs', [ContenedorController::class, 'anadirCancion'])->name('singles.songs.add');
    Route::delete('/singles/{contenedor}/songs/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('singles.songs.remove');

    Route::get('/playlists/{contenedor}/loopz', [ContenedorController::class, 'loopzPlaylist'])->name('playlists.loopzPlaylist');

});


require __DIR__.'/auth.php';
