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
