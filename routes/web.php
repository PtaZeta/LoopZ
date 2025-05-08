<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\CancionController;
use App\Http\Controllers\ContenedorController;
use App\Http\Controllers\EPController;
use App\Http\Controllers\GeneroController;
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
        ->with('generos')
        ->get();


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
        ->where(function ($query) {
            $query->where('tipo', 'playlist')
                  ->orWhere('tipo', 'loopz');
        })
        ->with(['usuarios' => function ($query) {
           $query->select('users.id', 'users.name')->withPivot('propietario');
        }])
        ->orderBy('pertenece_user.created_at', 'desc')
        ->get()
        ->map(function ($item) {
            $item->tipo = $item->tipo === 'loopz' ? 'loopz' : 'playlist';
            return $item;
         });

    $loopzs = $usuario->loopzContenedores()
         ->with(['usuarios' => function ($query) {
             $query->select('users.id', 'users.name')->withPivot('propietario');
         }])
         ->orderBy('loopzs_contenedores.created_at', 'desc')
         ->get();
    $lanzamientos = $usuario->perteneceContenedores()
        ->whereIn('tipo', ['album', 'ep', 'single'])
        ->with(['usuarios' => function ($query) {
            $query->select('users.id', 'users.name')->withPivot('propietario');
        }])
        ->orderBy('pertenece_user.created_at', 'desc')
        ->get();
    return Inertia::render('Biblioteca', [
        'playlists' => $playlists,
        'loopzContenedores' => $loopzs,
        'lanzamientos' => $lanzamientos,
    ]);
})->middleware(['auth', 'verified'])->name('biblioteca');


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

    Route::post('/contenedores/{contenedor}/toggle-loopz', [ContenedorController::class, 'toggleLoopz'])
         ->name('contenedores.toggle-loopz')
         ->where('contenedor', '[0-9]+');

    Route::resource('loopzs', ContenedorController::class);
    Route::get('/loopzs/{contenedor}/songs/search', [ContenedorController::class, 'buscarCanciones'])->name('loopzs.songs.search');
    Route::get('/cancion/{cancion}/loopz', [CancionController::class, 'cancionloopz'])->name('cancion.loopz');
});

Route::get('/spotify-login', function () {
    $client_id = env('SPOTIFY_CLIENT_ID');
    $redirect_uri = env('SPOTIFY_REDIRECT_URI');
    $scope = 'user-read-private user-read-email';

    $url = 'https://accounts.spotify.com/authorize?' . http_build_query([
        'response_type' => 'code',
        'client_id' => $client_id,
        'redirect_uri' => $redirect_uri,
        'scope' => $scope,
    ]);

    return redirect($url);
});

Route::get('/callback', [GeneroController::class, 'storeGenres']);

require __DIR__.'/auth.php';
