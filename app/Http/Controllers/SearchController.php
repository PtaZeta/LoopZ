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

        $canciones = Cancion::with('usuarios')
            ->where('titulo', 'like', "%{$query}%")
            ->get();

        $users = User::where('name', 'like', "%{$query}%")->get();

        $playlists = Contenedor::with('usuarios')
            ->where('tipo', 'playlist')
            ->where('nombre', 'like', "%{$query}%")
            ->get();

        $eps = Contenedor::with('usuarios')
            ->where('tipo', 'ep')
            ->where('nombre', 'like', "%{$query}%")
            ->get();

        $singles = Contenedor::with('usuarios')
            ->where('tipo', 'single')
            ->where('nombre', 'like', "%{$query}%")
            ->get();

        $albumes = Contenedor::with('usuarios')
            ->where('tipo', 'album')
            ->where('nombre', 'like', "%{$query}%")
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

