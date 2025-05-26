<?php

namespace App\Http\Controllers;

use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

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

        $allCanciones = Cancion::whereIn('id', $cancionIds)
            ->with('usuarios')
            ->limit($limitCanciones)
            ->get()
            ->map(function ($cancion) use ($query) {
                $cancion->match_score = $this->calculateMatchScore($cancion->titulo, $query);
                return $cancion;
            })
            ->sortByDesc('match_score');

        $allUsers = User::whereIn('id', $userIds)
            ->limit($limitOtros)
            ->get()
            ->map(function ($user) use ($query) {
                $user->match_score = $this->calculateMatchScore($user->name, $query);
                return $user;
            })
            ->sortByDesc('match_score');

        $allPlaylists = Contenedor::whereIn('id', $playlistIds)
            ->with('usuarios', 'canciones.usuarios')
            ->limit($limitOtros)
            ->get()
            ->map(function ($contenedor) use ($query) {
                $contenedor->match_score = $this->calculateMatchScore($contenedor->nombre, $query);
                return $contenedor;
            })
            ->sortByDesc('match_score');

        $allEps = Contenedor::whereIn('id', $epIds)
            ->with('usuarios', 'canciones.usuarios')
            ->limit($limitOtros)
            ->get()
            ->map(function ($contenedor) use ($query) {
                $contenedor->match_score = $this->calculateMatchScore($contenedor->nombre, $query);
                return $contenedor;
            })
            ->sortByDesc('match_score');

        $allSingles = Contenedor::whereIn('id', $singleIds)
            ->with('usuarios', 'canciones.usuarios')
            ->limit($limitOtros)
            ->get()
            ->map(function ($contenedor) use ($query) {
                $contenedor->match_score = $this->calculateMatchScore($contenedor->nombre, $query);
                return $contenedor;
            })
            ->sortByDesc('match_score');

        $allAlbumes = Contenedor::whereIn('id', $albumIds)
            ->with('usuarios', 'canciones.usuarios')
            ->limit($limitOtros)
            ->get()
            ->map(function ($contenedor) use ($query) {
                $contenedor->match_score = $this->calculateMatchScore($contenedor->nombre, $query);
                return $contenedor;
            })
            ->sortByDesc('match_score');

        $principalItem = null;
        $principalKey = null;

        if ($query) {
            $principalItem = $this->findFirstExactOrBestMatch([
                ['items' => $allUsers, 'key' => 'name', 'type' => 'user'],
                ['items' => $allCanciones, 'key' => 'titulo', 'type' => 'cancion'],
                ['items' => $allPlaylists, 'key' => 'nombre', 'type' => 'playlist'],
                ['items' => $allAlbumes, 'key' => 'nombre', 'type' => 'album'],
                ['items' => $allEps, 'key' => 'nombre', 'type' => 'ep'],
                ['items' => $allSingles, 'key' => 'nombre', 'type' => 'single'],
            ], $query);

            if (!$principalItem) {
                $principalItem =
                    $allUsers->first() ?:
                    $allCanciones->first() ?:
                    $allPlaylists->first() ?:
                    $allAlbumes->first() ?:
                    $allEps->first() ?:
                    $allSingles->first();
                $principalKey = $principalItem ? class_basename(get_class($principalItem)) : null;
            } else {
                $principalKey = $principalItem['type'];
                $principalItem = $principalItem['item'];
            }
        }

        $relatedContent = [
            'canciones' => collect(),
        ];

        $otherRelatedSections = [];

        if ($principalItem) {
            switch ($principalKey) {
                case 'user':
                    $relatedContent['canciones'] = $principalItem->perteneceCanciones()
                        ->with('usuarios')
                        ->limit($limitCanciones)
                        ->get()
                        ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'));

                    $otherRelatedSections['playlists_del_artista'] = $principalItem->perteneceContenedores()
                        ->where('tipo', 'playlist')
                        ->with('usuarios')
                        ->limit($limitOtros)
                        ->get();

                    $otherRelatedSections['albumes_del_artista'] = $principalItem->perteneceContenedores()
                        ->where('tipo', 'album')
                        ->with('usuarios')
                        ->limit($limitOtros)
                        ->get();

                    break;

                case 'playlist':
                case 'album':
                case 'ep':
                case 'single':
                    $relatedContent['canciones'] = $principalItem->canciones()
                        ->with('usuarios')
                        ->limit($limitCanciones)
                        ->get()
                        ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'));

                    $artists = $principalItem->usuarios;
                    if ($artists->isNotEmpty()) {
                        $otherRelatedSections['artistas_relacionados'] = $artists->take($limitOtros);
                    }

                    break;

                case 'cancion':
                    $songArtists = $principalItem->usuarios;
                    if ($songArtists->isNotEmpty()) {
                        $otherRelatedSections['artistas_de_la_cancion'] = $songArtists->take($limitOtros);
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
                            ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'))
                        );
                    }

                    break;
            }

            $relatedContent['canciones'] = $relatedContent['canciones']
                ->unique('id')
                ->sortByDesc('match_score')
                ->take($limitCanciones);
        }

        $loopzSongIds = [];
        if (Auth::check()) {
            $loopzContainer = Auth::user()->perteneceContenedores()
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
            'canciones' => $allCanciones
                ->filter(fn($item) => !($principalItem && $item->id === $principalItem->id))
                ->values()
                ->take($limitCanciones),
            'users' => $allUsers
                ->filter(fn($item) => !($principalItem && $item->id === $principalItem->id))
                ->values()
                ->take($limitOtros),
            'playlists' => $allPlaylists
                ->filter(fn($item) => !($principalItem && $item->id === $principalItem->id))
                ->values()
                ->take($limitOtros),
            'eps' => $allEps
                ->filter(fn($item) => !($principalItem && $item->id === $principalItem->id))
                ->values()
                ->take($limitOtros),
            'singles' => $allSingles
                ->filter(fn($item) => !($principalItem && $item->id === $principalItem->id))
                ->values()
                ->take($limitOtros),
            'albumes' => $allAlbumes
                ->filter(fn($item) => !($principalItem && $item->id === $principalItem->id))
                ->values()
                ->take($limitOtros),
        ];

        $usuarioPlaylistsAñadir = Auth::user();
        $userPlaylists = $usuarioPlaylistsAñadir
            ? $usuarioPlaylistsAñadir->perteneceContenedores()
                ->where('tipo', 'playlist')
                ->select('id', 'nombre', 'imagen')
                ->get()
                ->map(function ($playlist) {
                    if ($playlist->imagen && !Str::startsWith($playlist->imagen, 'http')) {
                        $playlist->imagen = \Storage::disk('s3')->url($playlist->imagen);
                    }
                    return $playlist;
                })
            : collect();

        return Inertia::render('Search/Index', [
            'searchQuery' => $query,
            'results' => $results,
            'principal' => $principalItem,
            'principalKey' => $principalKey,
            'relatedContent' => $otherRelatedSections,
            'relatedSongs' => $relatedContent['canciones'],
            'filters' => [],
            'auth' => $usuarioPlaylistsAñadir
                ? [
                    'user' => [
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
                    ],
                ]
                : null,
        ]);
    }

    private function calculateMatchScore(string $text, string $query): int
    {
        $text = strtolower($text);
        $query = strtolower($query);

        if ($text === $query) return 100;
        if (str_starts_with($text, $query)) return 80;
        if (str_contains($text, " $query ") ||
            str_starts_with($text, "$query ") ||
            str_ends_with($text, " $query")
        ) return 60;
        if (str_contains($text, $query)) return 40;
        if (similar_text($text, $query, $percent)) {
            return (int) $percent;
        }
        return 0;
    }

    private function findFirstExactOrBestMatch(array $candidates, string $query): ?array
    {
        foreach ($candidates as $candidate) {
            $exact = $candidate['items']->firstWhere($candidate['key'], $query);
            if ($exact) {
                return ['item' => $exact, 'type' => $candidate['type']];
            }
        }

        foreach ($candidates as $candidate) {
            $best = $candidate['items']->sortByDesc('match_score')->first();
            if ($best) {
                return ['item' => $best, 'type' => $candidate['type']];
            }
        }

        return null;
    }

    private function addMatchScore($model, string $query, string $field)
    {
        $model->match_score = $this->calculateMatchScore($model->{$field}, $query);
        return $model;
    }
}
