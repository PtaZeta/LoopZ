<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Arr; // Para trabajar con arrays

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('query', '');

        // --- Configuración de límites ---
        $limitCanciones = 10;
        $limitOtros = 6;

        // Paso 1: Realizar la búsqueda inicial para todos los tipos
        // y obtener solo los IDs para una carga eficiente posterior
        $cancionIds = Cancion::search($query)->keys();
        $userIds = User::search($query)->keys();
        $playlistIds = Contenedor::search($query)->where('tipo', 'playlist')->keys();
        $epIds = Contenedor::search($query)->where('tipo', 'ep')->keys();
        $singleIds = Contenedor::search($query)->where('tipo', 'single')->keys();
        $albumIds = Contenedor::search($query)->where('tipo', 'album')->keys();

        // Cargar los modelos con sus relaciones necesarias para la visualización inicial
        $allCanciones = Cancion::whereIn('id', $cancionIds)->with('usuarios')->limit($limitCanciones)->get();
        $allUsers = User::whereIn('id', $userIds)->limit($limitOtros)->get();
        $allPlaylists = Contenedor::whereIn('id', $playlistIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();
        $allEps = Contenedor::whereIn('id', $epIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();
        $allSingles = Contenedor::whereIn('id', $singleIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();
        $allAlbumes = Contenedor::whereIn('id', $albumIds)->with('usuarios', 'canciones.usuarios')->limit($limitOtros)->get();

        // Combinar todos los resultados para determinar el "principal"
        $principal = null;
        $principalItem = null;
        $principalKey = null;

        // Prioridad: Usuario, Canción, Playlist, Album, EP, Single
        // Buscamos el primer resultado que tenga una coincidencia exacta con la query
        // o el primer resultado que tengamos.
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

        // Si no se encontró un principal por coincidencia exacta, toma el primer resultado disponible
        if (!$principalItem) {
             if ($allUsers->isNotEmpty()) { $principalItem = $allUsers->first(); $principalKey = 'user'; }
             else if ($allCanciones->isNotEmpty()) { $principalItem = $allCanciones->first(); $principalKey = 'cancion'; }
             else if ($allPlaylists->isNotEmpty()) { $principalItem = $allPlaylists->first(); $principalKey = 'playlist'; }
             else if ($allAlbumes->isNotEmpty()) { $principalItem = $allAlbumes->first(); $principalKey = 'album'; }
             else if ($allEps->isNotEmpty()) { $principalItem = $allEps->first(); $principalKey = 'ep'; }
             else if ($allSingles->isNotEmpty()) { $principalItem = $allSingles->first(); $principalKey = 'single'; }
        }

        // --- Búsquedas adicionales para contenido relacionado ---
        $relatedContent = [
            'canciones' => collect(), // Una única colección para todas las canciones relacionadas
        ];
        $otherRelatedSections = []; // Para los demás tipos de contenido

        if ($principalItem) {
            switch ($principalKey) {
                case 'user':
                    // Canciones del artista
                    $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                        $principalItem->perteneceCanciones()->with('usuarios')->limit($limitCanciones)->get()
                    );
                    // Playlists del artista
                    $otherRelatedSections['playlists_del_artista'] = $principalItem->perteneceContenedores()
                                                                       ->where('tipo', 'playlist')
                                                                       ->with('usuarios')
                                                                       ->limit($limitOtros)->get();
                    // Álbumes del artista
                    $otherRelatedSections['albumes_del_artista'] = $principalItem->perteneceContenedores()
                                                                      ->where('tipo', 'album')
                                                                      ->with('usuarios')
                                                                      ->limit($limitOtros)->get();
                    // EPs del artista
                    $otherRelatedSections['eps_del_artista'] = $principalItem->perteneceContenedores()
                                                                  ->where('tipo', 'ep')
                                                                  ->with('usuarios')
                                                                  ->limit($limitOtros)->get();
                    // Singles del artista
                    $otherRelatedSections['singles_del_artista'] = $principalItem->perteneceContenedores()
                                                                      ->where('tipo', 'single')
                                                                      ->with('usuarios')
                                                                      ->limit($limitOtros)->get();
                    break;

                case 'playlist':
                case 'album':
                case 'ep':
                case 'single':
                    // Canciones dentro del contenedor principal
                    $relatedContent['canciones'] = $relatedContent['canciones']->concat(
                        $principalItem->canciones()->with('usuarios')->limit($limitCanciones)->get()
                    );

                    // Artistas asociados a este contenedor
                    $artists = $principalItem->usuarios;
                    if ($artists->isNotEmpty()) {
                        $otherRelatedSections['artistas_relacionados'] = $artists->take($limitOtros);

                        // Otros contenedores de estos artistas (excluyendo el principal)
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

                    // Canciones de géneros similares
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
                    // Artistas de la canción principal
                    $songArtists = $principalItem->usuarios;
                    if ($songArtists->isNotEmpty()) {
                        $otherRelatedSections['artistas_de_la_cancion'] = $songArtists->take($limitOtros);

                        // Otras canciones de esos artistas (excluyendo la principal)
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

                        // Contenedores (álbumes/playlists) de esos artistas
                        $otherRelatedSections['contenedores_del_artista'] = Contenedor::whereHas('usuarios', function ($q) use ($songArtists) {
                            $q->whereIn('users.id', $songArtists->pluck('id'));
                        })
                        ->whereIn('tipo', ['album', 'playlist', 'ep', 'single'])
                        ->with('usuarios')
                        ->inRandomOrder()
                        ->limit($limitOtros)
                        ->get();
                    }

                    // Canciones del mismo género
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

        // Eliminar duplicados y limitar la colección final de canciones
        $relatedContent['canciones'] = $relatedContent['canciones']->unique('id')->take($limitCanciones);


        // Lógica para loopz (mantener la misma que tenías)
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

        // Marcar canciones como en loopz para todos los resultados y relacionados
        $allCanciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds));
        $allPlaylists->each(fn($p) => $p->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $allEps->each(fn($ep) => $ep->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $allSingles->each(fn($s) => $s->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $allAlbumes->each(fn($a) => $a->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $relatedContent['canciones']->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds));


        // Filtrar los resultados originales para no duplicar el principal y aplicar límites finales
        $results = [
            'canciones' => $allCanciones->filter(fn($item) => !($principalKey === 'cancion' && $item->id === $principalItem->id))->values()->take($limitCanciones),
            'users'     => $allUsers->filter(fn($item) => !($principalKey === 'user' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'playlists' => $allPlaylists->filter(fn($item) => !($principalKey === 'playlist' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'eps'       => $allEps->filter(fn($item) => !($principalKey === 'ep' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'singles'   => $allSingles->filter(fn($item) => !($principalKey === 'single' && $item->id === $principalItem->id))->values()->take($limitOtros),
            'albumes'   => $allAlbumes->filter(fn($item) => !($principalKey === 'album' && $item->id === $principalItem->id))->values()->take($limitOtros),
        ];


        return Inertia::render('Search/Index', [
            'searchQuery' => $query,
            'results' => $results, // Los resultados generales sin el principal
            'principal' => $principalItem, // El resultado principal
            'principalKey' => $principalKey, // El tipo del resultado principal
            'relatedContent' => $otherRelatedSections, // Otros contenidos relacionados (no canciones)
            'relatedSongs' => $relatedContent['canciones'], // Todas las canciones relacionadas en una sola sección
            'filters' => [],
        ]);
    }
}