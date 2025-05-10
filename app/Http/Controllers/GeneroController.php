<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGeneroRequest;
use App\Http\Requests\UpdateGeneroRequest;
use App\Models\Genero;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;
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


    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGeneroRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Genero $genero)
    {
        return Inertia::render('Genero/Show', [
            'genero' => $genero,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Genero $genero)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGeneroRequest $request, Genero $genero)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Genero $genero)
    {
        //
    }
}
