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
        $seedId = $request->input('seedSongId');

        $query = Cancion::query()
            ->where('publico', true)
            ->when($seedId, fn($q) => $q->where('id', '<>', $seedId));

        if ($seedId) {
            $seed = Cancion::with('generos')->find($seedId);
            if ($seed && $seed->generos->isNotEmpty()) {
                $genreIds = $seed->generos->pluck('id')->toArray();
                $query->whereHas('generos', fn($q) => $q->whereIn('genero_id', $genreIds));
            }
        }

        $result = $query->inRandomOrder()->limit(10)->get();
        if ($result->isEmpty()) {
            $result = Cancion::where('publico', true)
                ->inRandomOrder()
                ->limit(10)
                ->get();
        }

        return response()->json($result);
    }
}
