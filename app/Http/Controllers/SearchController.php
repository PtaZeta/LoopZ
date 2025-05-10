<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\Genero;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('query', '');

        $canciones   = Cancion::where('titulo', 'like', "%{$query}%")->get();
        $users       = User::where('name', 'like', "%{$query}%")->get();
        $contenedores= Contenedor::where('nombre','like', "%{$query}%")->get();

        $playlists = $contenedores->where('tipo','playlist')->values();
        $eps       = $contenedores->where('tipo','ep')->values();
        $singles   = $contenedores->where('tipo','single')->values();
        $albumes   = $contenedores->where('tipo','album')->values();

        return Inertia::render('Search/Index', [
            'searchQuery' => $query,
            'results'     => [
                'canciones' => $canciones,
                'users'     => $users,
                'playlists' => $playlists,
                'eps'       => $eps,
                'singles'   => $singles,
                'albumes'   => $albumes,
            ],
            'filters'     => [],
        ]);
    }
}
