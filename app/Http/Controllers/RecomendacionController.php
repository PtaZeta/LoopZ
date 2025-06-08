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

        $seedCancionId = $request->input('seedCancionId');
        $seedUsuarioId = $request->input('seedUsuarioId');
        $porPagina = $request->input('porPagina', 10);
        $pagina = $request->input('pagina', 1);
        $offset = ($pagina - 1) * $porPagina;

        $cancionesRecomendadas = collect();
        $cancionesAObtener = $porPagina;

        $baseQuery = Cancion::query()
            ->with(['generos', 'usuarios'])
            ->where('publico', true);

        if ($seedCancionId) {
            $seedCancion = Cancion::with(['generos', 'usuarios'])->find($seedCancionId);
            if ($seedCancion) {
                $baseQuery->where('id', '<>', $seedCancionId);

                $seedGeneros = $seedCancion->generos->pluck('id')->toArray();
                $seedUsuario = $seedCancion->usuarios->first();

                if (!empty($seedGeneros) || $seedUsuario) {
                    $primerQuery = clone $baseQuery;
                    $primerQuery->where(function ($q) use ($seedGeneros, $seedUsuario) {
                        if (!empty($seedGeneros)) {
                            $q->whereHas('generos', fn($g) => $g->whereIn('genero_id', $seedGeneros));
                        }
                        if ($seedUsuario) {
                            $q->orWhereHas('usuarios', fn($u) => $u->where('users.id', $seedUsuario->id));
                        }
                    });

                    $primerResultados = $primerQuery->inRandomOrder()->limit($cancionesAObtener)->get();
                    $cancionesRecomendadas = $cancionesRecomendadas->merge($primerResultados);
                    $cancionesAObtener -= $primerResultados->count();
                }
            }
        }

        if ($cancionesAObtener > 0 && ($seedUsuarioId || (isset($seedCancion) && $seedCancion->usuarios->isNotEmpty()))) {
            $seedUsuarioActualId = $seedUsuarioId ?: ($seedCancion->usuarios->first()->id ?? null);

            if ($seedUsuarioActualId) {
                $segundoQuery = clone $baseQuery;
                $segundoQuery->whereHas('usuarios', fn($u) => $u->where('users.id', $seedUsuarioActualId))
                           ->whereNotIn('id', $cancionesRecomendadas->pluck('id')->toArray());

                $segundoResultados = $segundoQuery->inRandomOrder()->limit($cancionesAObtener)->get();
                $cancionesRecomendadas = $cancionesRecomendadas->merge($segundoResultados);
                $cancionesAObtener -= $segundoResultados->count();
            }
        }

        if ($cancionesAObtener > 0 && isset($seedGeneros) && !empty($seedGeneros)) {
            $tercerQuery = clone $baseQuery;
            $tercerQuery->whereHas('generos', fn($q) => $q->whereIn('genero_id', $seedGeneros))
                       ->whereNotIn('id', $cancionesRecomendadas->pluck('id')->toArray());

            $tercerResultados = $tercerQuery->inRandomOrder()->limit($cancionesAObtener)->get();
            $cancionesRecomendadas = $cancionesRecomendadas->merge($tercerResultados);
            $cancionesAObtener -= $tercerResultados->count();
        }

        if ($cancionesAObtener > 0) {
            $alternativaQuery = Cancion::query()
                ->with(['generos', 'usuarios'])
                ->where('publico', true)
                ->whereNotIn('id', $cancionesRecomendadas->pluck('id')->toArray());

            $alternativaResultados = $alternativaQuery->inRandomOrder()->limit($cancionesAObtener)->get();
            $cancionesRecomendadas = $cancionesRecomendadas->merge($alternativaResultados);
        }

        $resultadoPaginado = $cancionesRecomendadas->unique('id')
                                            ->skip($offset)
                                            ->take($porPagina);

        if ($resultadoPaginado->isEmpty() && $pagina > 1 && $cancionesRecomendadas->count() <= $offset) {
            return response()->json([]);
        }

        return response()->json($resultadoPaginado->values());
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
