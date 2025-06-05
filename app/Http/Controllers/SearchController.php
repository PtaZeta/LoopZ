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

        // Define los límites mínimos deseados para cada tipo
        $minLimitCanciones = 10;
        $minLimitOtros = 6; // Para usuarios, playlists, álbumes, EPs, singles

        // 1. Búsqueda inicial usando Scout (resultados más relevantes a la query)
        $cancionIds = Cancion::search($query)->keys();
        $userIds = User::search($query)->keys();
        $contenedorIds = Contenedor::search($query)->keys();

        // 2. Obtener y ordenar los resultados iniciales por relevancia (match_score)
        $allContenedores = Contenedor::whereIn('id', $contenedorIds)
            ->with('usuarios', 'canciones.usuarios', 'canciones.generos') // <--- ¡CORREGIDO AQUÍ!
            ->get()
            ->map(function ($contenedor) use ($query) {
                // AQUÍ: Calcula el match_score para el nombre del contenedor
                $contenedor->match_score = $this->calculateMatchScore($contenedor->nombre, $query);
                return $contenedor;
            })
            ->sortByDesc('match_score');

        $allCanciones = Cancion::whereIn('id', $cancionIds)
            ->with('usuarios', 'generos')
            ->get()
            ->map(function ($cancion) use ($query) {
                $cancion->match_score = $this->calculateMatchScore($cancion->titulo, $query);
                return $cancion;
            })
            ->sortByDesc('match_score');

        $allUsers = User::whereIn('id', $userIds)
            ->get()
            ->map(function ($user) use ($query) {
                $user->match_score = $this->calculateMatchScore($user->name, $query);
                return $user;
            })
            ->sortByDesc('match_score');

        // Filtrar contenedores por tipo
        $initialPlaylists = $allContenedores->filter(fn($contenedor) => $contenedor->tipo === 'playlist');
        $initialEps = $allContenedores->filter(fn($contenedor) => $contenedor->tipo === 'ep');
        $initialSingles = $allContenedores->filter(fn($contenedor) => $contenedor->tipo === 'single');
        $initialAlbumes = $allContenedores->filter(fn($contenedor) => $contenedor->tipo === 'album');

        // 3. Lógica para el elemento principal
        $principalItem = null;
        $principalKey = null;

        if ($query) {
            $principalItem = $this->findFirstExactOrBestMatch([
                ['items' => $allUsers, 'key' => 'name', 'type' => 'user'],
                ['items' => $allCanciones, 'key' => 'titulo', 'type' => 'cancion'],
                ['items' => $initialPlaylists, 'key' => 'nombre', 'type' => 'playlist'],
                ['items' => $initialAlbumes, 'key' => 'nombre', 'type' => 'album'],
                ['items' => $initialEps, 'key' => 'nombre', 'type' => 'ep'],
                ['items' => $initialSingles, 'key' => 'nombre', 'type' => 'single'],
            ], $query);

            if (!$principalItem) {
                $principalItem =
                    $allUsers->first() ?:
                    $allCanciones->first() ?:
                    $initialPlaylists->first() ?:
                    $initialAlbumes->first() ?:
                    $initialEps->first() ?:
                    $initialSingles->first();
                $principalKey = $principalItem ? class_basename(get_class($principalItem)) : null;
            } else {
                $principalKey = $principalItem['type'];
                $principalItem = $principalItem['item'];
            }
        }

        // 4. Lógica para contenido relacionado (ej. canciones de álbumes o artistas)
        $relatedContent = [
            'canciones' => collect(),
        ];
        $otherRelatedSections = [];

        // IDs de canciones ya incluidas para evitar duplicados en el relleno
        $includedSongIds = $allCanciones->pluck('id');


        if ($principalItem) {
            switch ($principalKey) {
                case 'user':
                    // Canciones del artista principal
                    $relatedContent['canciones'] = $relatedContent['canciones']->merge(
                        $principalItem->perteneceCanciones()
                            ->with('usuarios', 'generos')
                            ->whereNotIn('id', $includedSongIds)
                            ->inRandomOrder()
                            ->limit($minLimitCanciones)
                            ->get()
                            ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'))
                    );
                    $includedSongIds = $includedSongIds->merge($relatedContent['canciones']->pluck('id'));

                    // Contenedores del artista principal
                    $otherRelatedSections['playlists_del_artista'] = $principalItem->perteneceContenedores()
                        ->where('tipo', 'playlist')
                        ->with('usuarios')
                        ->inRandomOrder()
                        ->limit($minLimitOtros)
                        ->get();

                    $otherRelatedSections['albumes_del_artista'] = $principalItem->perteneceContenedores()
                        ->where('tipo', 'album')
                        ->with('usuarios')
                        ->inRandomOrder()
                        ->limit($minLimitOtros)
                        ->get();
                    break;

                case 'playlist':
                case 'album':
                case 'ep':
                case 'single':
                    // Canciones del contenedor principal
                    $relatedContent['canciones'] = $relatedContent['canciones']->merge(
                        $principalItem->canciones()
                            ->with('usuarios', 'generos')
                            ->whereNotIn('id', $includedSongIds)
                            ->inRandomOrder()
                            ->limit($minLimitCanciones)
                            ->get()
                            ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'))
                    );
                    $includedSongIds = $includedSongIds->merge($relatedContent['canciones']->pluck('id'));


                    $artists = $principalItem->usuarios;
                    if ($artists->isNotEmpty()) {
                        $otherRelatedSections['artistas_relacionados'] = $artists->take($minLimitOtros);
                    }

                    // Canciones de géneros relacionados del contenedor
                    $generosContenedor = $principalItem->canciones->pluck('generos')->flatten()->unique('id')->pluck('nombre');
                    if ($generosContenedor->isNotEmpty()) {
                        $relatedContent['canciones'] = $relatedContent['canciones']->merge(
                            Cancion::whereHas('generos', function ($q) use ($generosContenedor) {
                                $q->whereIn('nombre', $generosContenedor);
                            })
                            ->whereNotIn('id', $includedSongIds)
                            ->with('usuarios', 'generos')
                            ->inRandomOrder()
                            ->limit($minLimitCanciones) // Puede ser más de la mitad, ajusta si necesario
                            ->get()
                            ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'))
                        );
                        $includedSongIds = $includedSongIds->merge($relatedContent['canciones']->pluck('id'));
                    }
                    break;

                case 'cancion':
                    // Artistas de la canción principal
                    $songArtists = $principalItem->usuarios;
                    if ($songArtists->isNotEmpty()) {
                        $otherRelatedSections['artistas_de_la_cancion'] = $songArtists->take($minLimitOtros);

                        // Canciones de los mismos artistas de la canción principal
                        foreach($songArtists as $artist) {
                            $relatedContent['canciones'] = $relatedContent['canciones']->merge(
                                $artist->perteneceCanciones()
                                    ->with('usuarios', 'generos')
                                    ->whereNotIn('id', $includedSongIds)
                                    ->inRandomOrder()
                                    ->limit(floor($minLimitCanciones / count($songArtists) + 1)) // Distribuir un poco
                                    ->get()
                                    ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'))
                            );
                            $includedSongIds = $includedSongIds->merge($relatedContent['canciones']->pluck('id'));
                            if ($relatedContent['canciones']->count() >= $minLimitCanciones) break; // Si ya llegamos al mínimo
                        }
                    }

                    // Canciones de géneros relacionados de la canción principal
                    $generosCancion = $principalItem->generos->pluck('nombre');
                    if ($generosCancion->isNotEmpty()) {
                        $relatedContent['canciones'] = $relatedContent['canciones']->merge(
                            Cancion::whereHas('generos', function ($q) use ($generosCancion) {
                                $q->whereIn('nombre', $generosCancion);
                            })
                            ->whereNotIn('id', $includedSongIds)
                            ->with('usuarios', 'generos')
                            ->inRandomOrder()
                            ->limit($minLimitCanciones)
                            ->get()
                            ->map(fn($c) => $this->addMatchScore($c, $query, 'titulo'))
                        );
                        $includedSongIds = $includedSongIds->merge($relatedContent['canciones']->pluck('id'));
                    }
                    break;
            }

            // Asegurarse de que las canciones relacionadas sean únicas y limitadas
            $relatedContent['canciones'] = $relatedContent['canciones']
                ->unique('id')
                ->sortByDesc('match_score')
                ->take($minLimitCanciones);
        }

        // 5. Consolidar resultados y aplicar relleno si es necesario
        // Combina las canciones de la búsqueda inicial con las canciones relacionadas del principalItem
        $finalCanciones = $allCanciones->merge($relatedContent['canciones'])->unique('id')->sortByDesc('match_score');
        $finalUsers = $allUsers->unique('id')->sortByDesc('match_score');
        $finalPlaylists = $initialPlaylists->unique('id')->sortByDesc('match_score');
        $finalEps = $initialEps->unique('id')->sortByDesc('match_score');
        $finalSingles = $initialSingles->unique('id')->sortByDesc('match_score');
        $finalAlbumes = $initialAlbumes->unique('id')->sortByDesc('match_score');


        // Rellenar hasta el mínimo de canciones (primero por género/artista, luego aleatorio)
        if ($finalCanciones->count() < $minLimitCanciones) {
            $needed = $minLimitCanciones - $finalCanciones->count();
            $additionalSongs = collect();

            // Intentar rellenar con canciones que compartan géneros o artistas populares
            $allRelevantGenreIds = $finalCanciones->pluck('generos')->flatten()->pluck('id')->unique()
                                ->merge($initialPlaylists->pluck('canciones')->flatten()->pluck('generos')->flatten()->pluck('id')->unique())
                                ->merge($initialEps->pluck('canciones')->flatten()->pluck('generos')->flatten()->pluck('id')->unique())
                                ->merge($initialSingles->pluck('canciones')->flatten()->pluck('generos')->flatten()->pluck('id')->unique())
                                ->merge($initialAlbumes->pluck('canciones')->flatten()->pluck('generos')->flatten()->pluck('id')->unique());

            $allRelevantArtistIds = $finalCanciones->pluck('usuarios')->flatten()->pluck('id')->unique()
                                ->merge($initialPlaylists->pluck('usuarios')->flatten()->pluck('id')->unique())
                                ->merge($initialEps->pluck('usuarios')->flatten()->pluck('id')->unique())
                                ->merge($initialSingles->pluck('usuarios')->flatten()->pluck('id')->unique())
                                ->merge($initialAlbumes->pluck('usuarios')->flatten()->pluck('id')->unique());

            if ($allRelevantGenreIds->isNotEmpty()) {
                $additionalSongs = $additionalSongs->merge(
                    Cancion::whereHas('generos', function ($q) use ($allRelevantGenreIds) {
                        $q->whereIn('generos.id', $allRelevantGenreIds);
                    })
                    ->whereNotIn('id', $finalCanciones->pluck('id'))
                    ->with('usuarios', 'generos')
                    ->inRandomOrder()
                    ->limit($needed)
                    ->get()
                );
                $finalCanciones = $finalCanciones->merge($additionalSongs)->unique('id');
                $needed = $minLimitCanciones - $finalCanciones->count();
                if ($needed <= 0) goto end_song_filling; // Salir del bucle si ya tenemos suficientes
            }

            if ($allRelevantArtistIds->isNotEmpty()) {
                $additionalSongs = $additionalSongs->merge(
                    Cancion::whereHas('usuarios', function ($q) use ($allRelevantArtistIds) {
                        $q->whereIn('users.id', $allRelevantArtistIds);
                    })
                    ->whereNotIn('id', $finalCanciones->pluck('id'))
                    ->with('usuarios', 'generos')
                    ->inRandomOrder()
                    ->limit($needed)
                    ->get()
                );
                $finalCanciones = $finalCanciones->merge($additionalSongs)->unique('id');
                $needed = $minLimitCanciones - $finalCanciones->count();
                if ($needed <= 0) goto end_song_filling;
            }

            // Si aún faltan, rellenar con canciones aleatorias
            if ($needed > 0) {
                $randomCanciones = Cancion::whereNotIn('id', $finalCanciones->pluck('id'))
                                        ->with('usuarios', 'generos')
                                        ->inRandomOrder()
                                        ->limit($needed)
                                        ->get();
                $finalCanciones = $finalCanciones->merge($randomCanciones)->unique('id');
            }
            end_song_filling:; // Etiqueta para goto
        }


        // Rellenar hasta el mínimo de usuarios
        if ($finalUsers->count() < $minLimitOtros) {
            $needed = $minLimitOtros - $finalUsers->count();
            $randomUsers = User::whereNotIn('id', $finalUsers->pluck('id'))
                                ->inRandomOrder()
                                ->limit($needed)
                                ->get();
            $finalUsers = $finalUsers->merge($randomUsers)->unique('id');
        }

        // Rellenar hasta el mínimo de playlists
        if ($finalPlaylists->count() < $minLimitOtros) {
            $needed = $minLimitOtros - $finalPlaylists->count();
            $randomPlaylists = Contenedor::where('tipo', 'playlist')
                                        ->whereNotIn('id', $finalPlaylists->pluck('id'))
                                        ->with('usuarios', 'canciones.usuarios')
                                        ->inRandomOrder()
                                        ->limit($needed)
                                        ->get();
            $finalPlaylists = $finalPlaylists->merge($randomPlaylists)->unique('id');
        }

        // Rellenar hasta el mínimo de EPs
        if ($finalEps->count() < $minLimitOtros) {
            $needed = $minLimitOtros - $finalEps->count();
            $randomEps = Contenedor::where('tipo', 'ep')
                                ->whereNotIn('id', $finalEps->pluck('id'))
                                ->with('usuarios', 'canciones.usuarios')
                                ->inRandomOrder()
                                ->limit($needed)
                                ->get();
            $finalEps = $finalEps->merge($randomEps)->unique('id');
        }

        // Rellenar hasta el mínimo de Singles
        if ($finalSingles->count() < $minLimitOtros) {
            $needed = $minLimitOtros - $finalSingles->count();
            $randomSingles = Contenedor::where('tipo', 'single')
                                    ->whereNotIn('id', $finalSingles->pluck('id'))
                                    ->with('usuarios', 'canciones.usuarios')
                                    ->inRandomOrder()
                                    ->limit($needed)
                                    ->get();
            $finalSingles = $finalSingles->merge($randomSingles)->unique('id');
        }

        // Rellenar hasta el mínimo de Álbumes
        if ($finalAlbumes->count() < $minLimitOtros) {
            $needed = $minLimitOtros - $finalAlbumes->count();
            $randomAlbumes = Contenedor::where('tipo', 'album')
                                    ->whereNotIn('id', $finalAlbumes->pluck('id'))
                                    ->with('usuarios', 'canciones.usuarios')
                                    ->inRandomOrder()
                                    ->limit($needed)
                                    ->get();
            $finalAlbumes = $finalAlbumes->merge($randomAlbumes)->unique('id');
        }


        // 6. Marcar canciones en "Loopz"
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

        $finalCanciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds));
        $finalPlaylists->each(fn($p) => $p->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $finalEps->each(fn($ep) => $ep->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $finalSingles->each(fn($s) => $s->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));
        $finalAlbumes->each(fn($a) => $a->canciones->each(fn($c) => $c->is_in_user_loopz = in_array($c->id, $loopzSongIds)));


        // 7. Preparar los resultados finales para Inertia (aplicando los límites definitivos)
        $results = [
            'canciones' => $finalCanciones->take($minLimitCanciones)->values(),
            'users' => $finalUsers->take($minLimitOtros)->values(),
            'playlists' => $finalPlaylists->take($minLimitOtros)->values(),
            'eps' => $finalEps->take($minLimitOtros)->values(),
            'singles' => $finalSingles->take($minLimitOtros)->values(),
            'albumes' => $finalAlbumes->take($minLimitOtros)->values(),
        ];

        // Obtener las playlists del usuario para el menú contextual
        $usuarioPlaylistsAñadir = Auth::user();
        $userPlaylists = $usuarioPlaylistsAñadir
            ? $usuarioPlaylistsAñadir->perteneceContenedores()
                ->where('tipo', 'playlist')
                ->select('id', 'nombre', 'imagen')
                ->with('canciones:id')
                ->get()
                ->map(function ($playlist) {
                    if ($playlist->imagen && !Str::startsWith($playlist->imagen, 'http')) {
                        $playlist->imagen = \Storage::disk('s3')->url($playlist->imagen);
                    }
                    return $playlist;
                })
            : collect();

        // Renderizar la vista de búsqueda con Inertia
        return Inertia::render('Search/Index', [
            'searchQuery' => $query,
            'results' => $results,
            'principal' => $principalItem,
            'principalKey' => $principalKey,
            'relatedContent' => $otherRelatedSections,
            'relatedSongs' => $finalCanciones->take($minLimitCanciones)->values(),
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

    /**
     * Calcula una puntuación de coincidencia para la búsqueda de texto.
     * Cuanto mayor sea la puntuación, mejor será la coincidencia.
     */
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

    /**
     * Encuentra la primera coincidencia exacta o la mejor coincidencia por puntuación.
     */
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

    /**
     * Añade la puntuación de coincidencia a un modelo.
     */
    private function addMatchScore($model, string $query, string $field)
    {
        $model->match_score = $this->calculateMatchScore($model->{$field}, $query);
        return $model;
    }
}
