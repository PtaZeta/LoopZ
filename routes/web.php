<?php

use App\Http\Controllers\AlbumController;
use App\Http\Controllers\CancionController;
use App\Http\Controllers\ContenedorController;
use App\Http\Controllers\EPController;
use App\Http\Controllers\GeneroController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecomendacionController;
use App\Http\Controllers\ReproduccionController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SingleController;
use App\Models\Cancion;
use App\Models\Genero;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    $cancionesAleatorias = Cancion::inRandomOrder()->limit(8)->with('generos')->get();
    $artistasPopulares = [];
    $generos = Genero::all();
    return Inertia::render('Welcome', [
        'auth' => ['user' => Auth::user()],
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'cancionesAleatorias' => $cancionesAleatorias,
        'artistasPopulares' => $artistasPopulares,
        'generos' => $generos,
    ]);
})->name('welcome');

Route::get('/api/welcome-random', function () {
    $canciones = Cancion::with('generos')->inRandomOrder()->take(8)->get();
    return response()->json($canciones);
});

Route::get('/biblioteca', function () {
    $usuario = Auth::user();

    $playlists = $usuario->perteneceContenedores()
        ->where(fn($q) => $q->where('tipo', 'playlist')->orWhere('tipo', 'loopz'))
        ->with(['usuarios' => fn($q) => $q->select('users.id', 'users.name')->withPivot('propietario')])
        ->orderBy('pertenece_user.created_at', 'desc')
        ->get()
        ->map(fn($item) => tap($item, fn($i) => $i->tipo = $i->tipo === 'loopz' ? 'loopz' : 'playlist'));

    $loopzs = $usuario->loopzContenedores()
        ->with(['usuarios' => fn($q) => $q->select('users.id', 'users.name')->withPivot('propietario')])
        ->orderBy('loopzs_contenedores.created_at', 'desc')
        ->get();

    $lanzamientos = $usuario->perteneceContenedores()
        ->whereIn('tipo', ['album', 'ep', 'single'])
        ->with(['usuarios' => fn($q) => $q->select('users.id', 'users.name')->withPivot('propietario')])
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


Route::middleware('auth')->group(function () {

    Route::post('/canciones/{id}/incrementar-visualizacion', [CancionController::class, 'incrementarVisualizacion']);

    Route::get('/radio', function () {
        return Inertia::render('Radio');
    })->name('radio');

    Route::get('/profile/{user}', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/canciones/buscar-originales', [CancionController::class, 'buscarCancionesOriginales'])->name('canciones.buscar-originales');
    Route::get('/usuarios/buscar', [CancionController::class, 'buscarUsuarios'])->name('usuarios.buscar');

    Route::resource('canciones', CancionController::class);

    Route::resource('playlists', ContenedorController::class);
    Route::get('/playlists/{contenedor}/canciones/search', [ContenedorController::class, 'buscarCanciones'])->name('playlists.canciones.search');
    Route::post('/playlists/{contenedor}/canciones', [ContenedorController::class, 'anadirCancion'])->name('playlists.canciones.add');
    Route::delete('/playlists/{contenedor}/canciones/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('playlists.canciones.remove');

    Route::resource('albumes', ContenedorController::class);
    Route::get('/albumes/{contenedor}/canciones/search', [ContenedorController::class, 'buscarCanciones'])->name('albumes.canciones.search');
    Route::post('/albumes/{contenedor}/canciones', [ContenedorController::class, 'anadirCancion'])->name('albumes.canciones.add');
    Route::delete('/albumes/{contenedor}/canciones/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('albumes.canciones.remove');

    Route::resource('eps', ContenedorController::class);
    Route::get('/eps/{contenedor}/canciones/search', [ContenedorController::class, 'buscarCanciones'])->name('eps.canciones.search');
    Route::post('/eps/{contenedor}/canciones', [ContenedorController::class, 'anadirCancion'])->name('eps.canciones.add');
    Route::delete('/eps/{contenedor}/canciones/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('eps.canciones.remove');

    Route::resource('singles', ContenedorController::class);
    Route::get('/singles/{contenedor}/canciones/search', [ContenedorController::class, 'buscarCanciones'])->name('singles.canciones.search');
    Route::post('/singles/{contenedor}/canciones', [ContenedorController::class, 'anadirCancion'])->name('singles.canciones.add');
    Route::delete('/singles/{contenedor}/canciones/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('singles.canciones.remove');

    Route::get('/lanzamiento/crear', [ContenedorController::class, 'crearLanzamiento'])->name('lanzamiento.crear');
    Route::post('/lanzamiento', [ContenedorController::class, 'storeLanzamiento'])->name('lanzamiento.storeLanzamiento');

    Route::get('/lanzamientos/{contenedor}/canciones/search', [ContenedorController::class, 'buscarCanciones'])->name('lanzamientos.canciones.search');
    Route::post('/lanzamientos/{contenedor}/canciones', [ContenedorController::class, 'anadirCancion'])->name('lanzamientos.canciones.add');
    Route::delete('/lanzamientos/{contenedor}/canciones/{pivotId}', [ContenedorController::class, 'quitarCancionPorPivot'])->name('lanzamientos.canciones.remove');

    Route::post('/contenedores/{contenedor}/toggle-loopz', [ContenedorController::class, 'toggleLoopz'])
        ->name('contenedores.toggle-loopz')
        ->where('contenedor', '[0-9]+');

    Route::resource('loopzs', ContenedorController::class);
    Route::get('/loopzs/{contenedor}/canciones/search', [ContenedorController::class, 'buscarCanciones'])->name('loopzs.canciones.search');
    Route::post('/cancion/{cancion}/loopz', [CancionController::class, 'cancionloopz'])->name('cancion.loopz');
    Route::get('/genero/{genero}', [GeneroController::class, 'show'])->name('genero.show');

    Route::get('/search', [SearchController::class, 'index'])->name('search.index');
    Route::post('/api/recomendaciones', [RecomendacionController::class, 'index']);
    Route::post('/playlist/{playlist}/{cancion}/toggle', [ContenedorController::class, 'toggleCancion'])
        ->name('playlist.toggleCancion');

    Route::post('/profile/{id}/seguir', [ProfileController::class, 'seguirUsuario'])->name('profile.seguirUsuario');

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
