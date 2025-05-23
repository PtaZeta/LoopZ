<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('query', '');

        $canciones = Cancion::search($query)->get();
        $users = User::search($query)->get();

        $playlists = Contenedor::search($query)
                               ->where('tipo', 'playlist')
                               ->get();

        $eps = Contenedor::search($query)
                         ->where('tipo', 'ep')
                         ->get();

        $singles = Contenedor::search($query)
                             ->where('tipo', 'single')
                             ->get();

        $albumes = Contenedor::search($query)
                             ->where('tipo', 'album')
                             ->get();

        $usuario = Auth::user();
        $loopzSongIds = [];

        if ($usuario) {
            $loopzContainer = $usuario->perteneceContenedores()
                                      ->where('tipo', 'loopz')
                                      ->with('canciones:id')
                                      ->first();

            if ($loopzContainer && $loopzContainer->canciones) {
                 $loopzSongIds = $loopzContainer->canciones->pluck('id')->toArray();
            }
        }

        $canciones->each(function ($cancion) use ($loopzSongIds) {
            $cancion->is_in_user_loopz = in_array($cancion->id, $loopzSongIds);
        });

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
