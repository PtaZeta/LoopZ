<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Arr; // Para trabajar con arrays
use Illuminate\Support\Facades\Storage;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('query', '');

        $limitCanciones = 10;
        $limitOtros = 6;

        $cancionIds = Cancion::search($query)->keys();
        $userIds = User::search($query)->keys();
        $playlistIds = Contenedor::search($query)->where('tipo', 'playlist')->keys();
        $epIds = Contenedor::search($query)->where('tipo', 'ep')->keys();
        $singleIds = Contenedor::search($query)->where('tipo', 'single')->keys();
        $albumIds = Contenedor::search($query)->where('tipo', 'album')->keys();

        $allCanciones = Cancion::whereIn('id', $cancionIds)->with('usuarios')->limit($limitCanciones)->get();
        $allUsers = User::whereIn('id', $userIds)->limit($limitOtros)->get();
        $allPlaylists = Contenedor::whereIn('id', $playlistIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();
        $allEps = Contenedor::whereIn('id', $epIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();
        $allSingles = Contenedor::whereIn('id', $singleIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();
        $allAlbumes = Contenedor::whereIn('id', $albumIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();

        $principal = null;
        $principalItem = null;
        $principalKey = null;

        if ($query) {
            $userPrincipal = $allUsers->firstWhere('name', 'LIKE', $query);
            if ($userPrincipal) {
                $principalItem = $userPrincipal;
                $principalKey = 'user';
            }
            if (!$principalItem) {
                $cancionPrincipal = $allCanciones->firstWhere('titulo', 'LIKE', $query);
                if ($cancionPrincipal) {
                    $principalItem = $cancionPrincipal;
                    $principalKey = 'cancion';
                }
            }
            if (!$principalItem) {
                $playlistPrincipal = $allPlaylists->firstWhere('nombre', 'LIKE', $query);
                if ($playlistPrincipal) {
                    $principalItem = $playlistPrincipal;
                    $principalKey = 'playlist';
                }
            }
            if (!$principalItem) {
                $albumPrincipal = $allAlbumes->firstWhere('nombre', 'LIKE', $query);
                if ($albumPrincipal) {
                    $principalItem = $albumPrincipal;
                    $principalKey = 'album';
                }
            }
            if (!$principalItem) {
                $epPrincipal = $allEps->firstWhere('nombre', 'LIKE', $query);
                if ($epPrincipal) {
                    $principalItem = $epPrincipal;
                    $principalKey = 'ep';
                }
            }
            if (!$principalItem) {
                $singlePrincipal = $allSingles->firstWhere('nombre', 'LIKE', $query);
                if ($singlePrincipal) {
                    $principalItem = $singlePrincipal;
                    $principalKey = 'single';
                }
            }
        }

        if (!$principalItem) {
             if ($allUsers->isNotEmpty()) { $principalItem = $allUsers->first(); $principalKey = 'user'; }
             else if ($allCanciones->isNotEmpty()) { $principalItem = $allCanciones->first(); $principalKey = 'cancion'; }
             else if ($allPlaylists->isNotEmpty()) { $principalItem = $allPlaylists->first(); $principalKey = 'playlist'; }
             else if ($allAlbumes->isNotEmpty()) { $principalItem = $allAlbumes->first(); $principalKey = 'album'; }
             else if ($allEps->isNotEmpty()) { $principalItem = $allEps->first(); $principalKey = 'ep'; }
             else if ($allSingles->isNotEmpty()) { $principalItem = $allSingles->first(); $principalKey = 'single'; }
        }

        $relatedContent = [
            'canciones' => collect(),
        ];
        $otherRelatedSections = [];

        if ($principalItem) {
            switch ($principalKey) {
                case 'user':
                    $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                        $principalItem->perteneceCanciones()->with('usuarios')->limit($limitCanciones)->get()
                    );
                    $otherRelatedSections['playlists_del_artista'] = $principalItem->perteneceContenedores()
                                                                       ->where('tipo', 'playlist')
                                                                       ->with('usuarios')
                                                                       ->limit($limitOtros)->get();
                    $otherRelatedSections['albumes_del_artista'] = $principalItem->perteneceContenedores()
                                                                      ->where('tipo', 'album')
                                                                      ->with('usuarios')
                                                                      ->limit($limitOtros)->get();
                    $otherRelatedSections['eps_del_artista'] = $principalItem->perteneceContenedores()
                                                                  ->where('tipo', 'ep')
                                                                  ->with('usuarios')
                                                                  ->limit($limitOtros)->get();
                    $otherRelatedSections['singles_del_artista'] = $principalItem->perteneceContenedores()
                                                                      ->where('tipo', 'single')
                                                                      ->with('usuarios')
                                                                      ->limit($limitOtros)->get();
                    break;

                case 'playlist':
                case 'album':
                case 'ep':
                case 'single':
                    $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                        $principalItem->canciones()->with('usuarios')->limit($limitCanciones)->get()
                    );

                    $artists = $principalItem->usuarios;
                    if ($artists->isNotEmpty()) {
                        $otherRelatedSections['artistas_relacionados'] = $artists->take($limitOtros);

                        $otherContainers = Contenedor::whereHas('usuarios', function ($q) use ($artists) {
                            $q->whereIn('users.id', $artists->pluck('id'));
                        })
                        ->where('id', '!=', $principalItem->id)
                        ->whereIn('tipo', ['album', 'playlist', 'ep', 'single'])
                        ->with('usuarios')
                        ->inRandomOrder()
                        ->limit($limitOtros)
                        ->get();
                        if($otherContainers->isNotEmpty()) {
                            $otherRelatedSections['mas_de_estos_artistas'] = $otherContainers;
                        }
                    }

                    $generoPredominante = $principalItem->generoPredominante();
                    if ($generoPredominante && $generoPredominante !== 'Sin género') {
                        $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                            Cancion::whereHas('generos', function ($q) use ($generoPredominante) {
                                $q->where('nombre', $generoPredominante);
                            })
                            ->where('id', '!=', $principalItem->id)
                            ->with('usuarios')
                            ->inRandomOrder()
                            ->limit($limitCanciones)
                            ->get()
                        );
                    }
                    break;

                case 'cancion':
                    $songArtists = $principalItem->usuarios;
                    if ($songArtists->isNotEmpty()) {
                        $otherRelatedSections['artistas_de_la_cancion'] = $songArtists->take($limitOtros);

                        $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                            Cancion::whereHas('usuarios', function ($q) use ($songArtists) {
                                $q->whereIn('users.id', $songArtists->pluck('id'));
                            })
                            ->where('id', '!=', $principalItem->id)
                            ->with('usuarios')
                            ->inRandomOrder()
                            ->limit($limitCanciones)
                            ->get()
                        );

                        $otherRelatedSections['contenedores_del_artista'] = Contenedor::whereHas('usuarios', function ($q) use ($songArtists) {
                            $q->whereIn('users.id', $songArtists->pluck('id'));
                        })
                        ->whereIn('tipo', ['album', 'playlist', 'ep', 'single'])
                        ->with('usuarios')
                        ->inRandomOrder()
                        ->limit($limitOtros)
                        ->get();
                    }

                    $generosCancion = $principalItem->generos->pluck('nombre');
                    if ($generosCancion->isNotEmpty()) {
                        $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                            Cancion::whereHas('generos', function ($q) use ($generosCancion) {
                                $q->whereIn('nombre', $generosCancion);
                            })
                            ->where('id', '!=', $principalItem->id)
                            ->with('usuarios')
                            ->inRandomOrder()
                            ->limit($limitCanciones)
                            ->get()
                        );
                    }
                    break;
            }
        }

        $relatedContent['canciones'] = $relatedContent['canciones']->unique('id')->take($limitCanciones);


        $loopzSongIds = [];
        if ($usuario = Auth::user()) {
            $loopzContainer = $usuario->perteneceContenedores()
                                      ->where('tipo', 'loopz')
                                      ->with('canciones:id')
                                      ->first();
            if ($loopzContainer && $loopzContainer->canciones) {
                 $loopzSongIds = $loopzContainer->canciones->pluck('id')->toArray();
            }
        }

        $allCanciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds));
        $allPlaylists->each(fn($p) => $p->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $allEps->each(fn($ep) => $ep->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $allSingles->each(fn($s) => $s->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $allAlbumes->each(fn($a) => $a->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $relatedContent['canciones']->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds));


        $results = [
            'canciones' => $allCanciones->filter(fn($item) => !($principalKey === 'cancion' && $item->id === $principalItem->id))->values()->take($limitCanciones),
            'users'     => $allUsers->filter(fn($item) => !($principalKey === 'user' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'playlists' => $allPlaylists->filter(fn($item) => !($principalKey === 'playlist' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'eps'       => $allEps->filter(fn($item) => !($principalKey === 'ep' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'singles'   => $allSingles->filter(fn($item) => !($principalKey === 'single' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'albumes'   => $allAlbumes->filter(fn($item) => !($principalKey === 'album' && $item->id === $principalItem->id))->values()->take($limitOtros),
        ];

        $usuarioPlaylistsAñadir = Auth::user();

        $userPlaylists = $usuarioPlaylistsAñadir->perteneceContenedores()
            ->where('tipo', 'playlist')
            ->with('canciones:id')
            ->select('id', 'nombre', 'imagen')
            ->get();

        $userPlaylists->each(function ($playlist) {
            if ($playlist->imagen && !filter_var($playlist->imagen, FILTER_VALIDATE_URL)) {
                $playlist->imagen = Storage::disk('s3')->url($playlist->imagen);
            }
        });


        return Inertia::render('Search/Index', [
            'searchQuery' => $query,
            'results' => $results,
            'principal' => $principalItem,
            'principalKey' => $principalKey,
            'relatedContent' => $otherRelatedSections,
            'relatedSongs' => $relatedContent['canciones'],
            'filters' => [],
        'auth' => [
            'user' => $usuarioPlaylistsAñadir ? [
                'id' => $usuarioPlaylistsAñadir->id,
                'name' => $usuarioPlaylistsAñadir->name,
                'playlists' => $userPlaylists->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'nombre' => $p->nombre,
                        'imagen' => $p->imagen,
                        'canciones' => $p->canciones,
                    ];
                }),
            ] : null,
        ],
        ]);
    }
}
