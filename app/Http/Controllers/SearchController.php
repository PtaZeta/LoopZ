<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function index(Request $request)
{
    $query = $request->input('query', '');

    // Buscar canciones por título o por nombre de usuario relacionado
    $canciones = Cancion::with('usuarios')
        ->where('titulo', 'like', "%{$query}%")
        ->orWhereHas('usuarios', function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%");
        })
        ->get();

    // Buscar usuarios por nombre
    $users = User::where('name', 'like', "%{$query}%")->get();

    // Buscar contenedores por nombre o nombre del usuario relacionado
    $playlists = Contenedor::with('usuarios')
        ->where('tipo', 'playlist')
        ->where(function ($q) use ($query) {
            $q->where('nombre', 'like', "%{$query}%")
              ->orWhereHas('usuarios', function ($q2) use ($query) {
                  $q2->where('name', 'like', "%{$query}%");
              });
        })
        ->get();

    $eps = Contenedor::with('usuarios')
        ->where('tipo', 'ep')
        ->where(function ($q) use ($query) {
            $q->where('nombre', 'like', "%{$query}%")
              ->orWhereHas('usuarios', function ($q2) use ($query) {
                  $q2->where('name', 'like', "%{$query}%");
              });
        })
        ->get();

    $singles = Contenedor::with('usuarios')
        ->where('tipo', 'single')
        ->where(function ($q) use ($query) {
            $q->where('nombre', 'like', "%{$query}%")
              ->orWhereHas('usuarios', function ($q2) use ($query) {
                  $q2->where('name', 'like', "%{$query}%");
              });
        })
        ->get();

    $albumes = Contenedor::with('usuarios')
        ->where('tipo', 'album')
        ->where(function ($q) use ($query) {
            $q->where('nombre', 'like', "%{$query}%")
              ->orWhereHas('usuarios', function ($q2) use ($query) {
                  $q2->where('name', 'like', "%{$query}%");
              });
        })
        ->get();

    return Inertia::render('Search/Index', [
        'searchQuery' => $query,
        'results' => [
            'canciones' => $canciones,
            'users'     => $users,
            'playlists' => $playlists,
            'eps'       => $eps,
            'singles'   => $singles,
            'albumes'   => $albumes
        ],
        'filters' => [],
    ]);
}

}

