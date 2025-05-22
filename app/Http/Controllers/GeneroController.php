<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGeneroRequest;
use App\Http\Requests\UpdateGeneroRequest;
use App\Models\Cancion;
use App\Models\Contenedor;
use App\Models\Genero;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class GeneroController extends Controller
{
    public function storeGenres()
    {
        $token = $this->getAccessToken();

        if (!$token) {
            return response()->json(['error' => 'Unable to get access token'], 500);
        }

        $response = Http::withToken($token)->get(env('SPOTIFY_API_URL') . '/recommendations/available-genre-seeds');

        if ($response->successful()) {
            $genres = $response->json()['genres'];

            foreach ($genres as $genre) {
                Genero::updateOrCreate(['nombre' => $genre]);
            }

            return response()->json(['message' => 'Géneros guardados correctamente']);
        }

        return response()->json(['error' => 'Failed to fetch genres'], 500);
    }

    private function getAccessToken()
    {
        $client_id = env('SPOTIFY_CLIENT_ID');
        $client_secret = env('SPOTIFY_CLIENT_SECRET');
        $base64_credentials = base64_encode("$client_id:$client_secret");

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $base64_credentials,
        ])->asForm()->post('https://accounts.spotify.com/api/token', [
            'grant_type' => 'authorization_code',
            'code' => request()->get('code'),
            'redirect_uri' => env('SPOTIFY_REDIRECT_URI'),
        ]);

        if ($response->successful()) {
            return $response->json()['access_token'];
        }

        return response()->json([
            'error' => 'Failed to get access token',
            'status' => $response->status(),
            'message' => $response->json()
        ], 500);
    }

    public function index()
    {

    }

    public function create()
    {

    }

    public function store(StoreGeneroRequest $request)
    {

    }
    public function show(Genero $genero)
    {
        $userId = Auth::id();
        $generoFiltro = $genero->nombre;

        $playlistsDelGenero = Contenedor::where('tipo', 'playlist')
            ->where('publico', true)
            ->whereDoesntHave('usuarios', function ($query) use ($userId) {
                $query->where('user_id', $userId)->where('propietario', true);
            })
            ->whereHas('canciones.generos', function ($query) use ($generoFiltro) {
                $query->where('nombre', $generoFiltro);
            })
            ->with(['canciones.generos', 'usuarios'])
            ->get()
            ->values();

        $cancionesDelGenero = Cancion::whereHas('generos', function ($query) use ($generoFiltro) {
                $query->where('nombre', $generoFiltro);
            })
            ->with(['generos', 'usuarios'])
            ->get()
            ->values();

        $usuariosDelGenero = User::where('id', '!=', $userId)
            ->whereHas('perteneceCanciones.generos', function ($query) use ($generoFiltro) {
                $query->where('nombre', $generoFiltro);
            })
            ->with('perteneceCanciones')
            ->inRandomOrder()
            ->get(['id', 'name', 'foto_perfil'])
            ->values();

        return Inertia::render('genero/Show', [
            'genero' => $genero,
            'playlists' => $playlistsDelGenero,
            'canciones' => $cancionesDelGenero,
            'usuariosDelGenero' => $usuariosDelGenero,
        ]);
    }


    public function edit(Genero $genero)
    {

    }

    public function update(UpdateGeneroRequest $request, Genero $genero)
    {

    }

    public function destroy(Genero $genero)
    {

    }
}
