<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Cancion;

class RecomendacionController extends Controller
{
        public function index(Request $request)
    {
        $userId = Auth::id();

        $seedSongId = $request->input('seedSongId');
        $seedArtistUserId = $request->input('seedArtistUserId');
        $perPage = $request->input('perPage', 10);
        $page = $request->input('page', 1);
        $offset = ($page - 1) * $perPage;

        $recommendedSongs = collect();
        $songsToFetch = $perPage;

        $baseQuery = Cancion::query()
            ->with(['generos', 'usuarios'])
            ->where('publico', true);

        if ($seedSongId) {
            $seedSong = Cancion::with(['generos', 'usuarios'])->find($seedSongId);
            if ($seedSong) {
                $baseQuery->where('id', '<>', $seedSongId);

                $seedGenres = $seedSong->generos->pluck('id')->toArray();
                $seedCreatorUser = $seedSong->usuarios->first();

                if (!empty($seedGenres) || $seedCreatorUser) {
                    $tier1Query = clone $baseQuery;
                    $tier1Query->where(function ($q) use ($seedGenres, $seedCreatorUser) {
                        if (!empty($seedGenres)) {
                            $q->whereHas('generos', fn($g) => $g->whereIn('genero_id', $seedGenres));
                        }
                        if ($seedCreatorUser) {
                            $q->orWhereHas('usuarios', fn($u) => $u->where('users.id', $seedCreatorUser->id));
                        }
                    });

                    $tier1Results = $tier1Query->inRandomOrder()->limit($songsToFetch)->get();
                    $recommendedSongs = $recommendedSongs->merge($tier1Results);
                    $songsToFetch -= $tier1Results->count();
                }
            }
        }

        if ($songsToFetch > 0 && ($seedArtistUserId || (isset($seedSong) && $seedSong->usuarios->isNotEmpty()))) {
            $currentSeedArtistUserId = $seedArtistUserId ?: ($seedSong->usuarios->first()->id ?? null);

            if ($currentSeedArtistUserId) {
                $tier2Query = clone $baseQuery;
                $tier2Query->whereHas('usuarios', fn($u) => $u->where('users.id', $currentSeedArtistUserId))
                           ->whereNotIn('id', $recommendedSongs->pluck('id')->toArray());

                $tier2Results = $tier2Query->inRandomOrder()->limit($songsToFetch)->get();
                $recommendedSongs = $recommendedSongs->merge($tier2Results);
                $songsToFetch -= $tier2Results->count();
            }
        }

        if ($songsToFetch > 0 && isset($seedGenres) && !empty($seedGenres)) {
            $tier3Query = clone $baseQuery;
            $tier3Query->whereHas('generos', fn($q) => $q->whereIn('genero_id', $seedGenres))
                       ->whereNotIn('id', $recommendedSongs->pluck('id')->toArray());

            $tier3Results = $tier3Query->inRandomOrder()->limit($songsToFetch)->get();
            $recommendedSongs = $recommendedSongs->merge($tier3Results);
            $songsToFetch -= $tier3Results->count();
        }

        if ($songsToFetch > 0) {
            $fallbackQuery = Cancion::query()
                ->with(['generos', 'usuarios'])
                ->where('publico', true)
                ->whereNotIn('id', $recommendedSongs->pluck('id')->toArray());

            $fallbackResults = $fallbackQuery->inRandomOrder()->limit($songsToFetch)->get();
            $recommendedSongs = $recommendedSongs->merge($fallbackResults);
        }

        $paginatedResult = $recommendedSongs->unique('id')
                                            ->skip($offset)
                                            ->take($perPage);

        if ($paginatedResult->isEmpty() && $page > 1 && $recommendedSongs->count() <= $offset) {
            return response()->json([]);
        }

        return response()->json($paginatedResult->values());
    }

    protected function getFallbackRecommendations(int $limit = 10)
    {
        return response()->json(
            Cancion::where('publico', true)
                ->with(['generos', 'usuarios'])
                ->inRandomOrder()
                ->limit($limit)
                ->get()
        );
    }

}
