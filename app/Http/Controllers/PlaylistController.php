<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Models\Playlist;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PlaylistController extends Controller
{
    public function index()
    {
        $playlists = Playlist::all();
        return Inertia::render('playlists/Index', [
            'playlists' => $playlists,
        ]);
    }

    public function create()
    {
        return Inertia::render('playlists/Create');
    }

    public function store(StorePlaylistRequest $request)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('imagen')) {
            $path = $request->file('imagen')->store('playlist_images', 'public');
            $validatedData['imagen'] = $path;
        } else {
             unset($validatedData['imagen']);
             // $validatedData['imagen'] = null;
        }

        $playlist = Playlist::create($validatedData);

        return redirect()->route('playlists.index')->with('success', 'Playlist creada exitosamente.');
    }

    public function show(Playlist $playlist)
    {
        // Opcional: Añadir URL completa
        // if ($playlist->imagen) {
        //     $playlist->imagen_url = Storage::disk('public')->url($playlist->imagen);
        // } else {
        //     $playlist->imagen_url = null;
        // }

        return Inertia::render('playlists/Show', [
            'playlist' => $playlist // Asegúrate que los datos necesarios se serialicen (e.g., usando append si usas accesors)
        ]);
    }

    public function edit(Playlist $playlist)
    {
        // Opcional: Añadir URL completa
        // if ($playlist->imagen) {
        //     $playlist->imagen_url = Storage::disk('public')->url($playlist->imagen);
        // } else {
        //     $playlist->imagen_url = null;
        // }

        return Inertia::render('playlists/Edit', [
            'playlist' => $playlist
        ]);
    }

    public function update(UpdatePlaylistRequest $request, Playlist $playlist)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('imagen')) {
            $newPath = $request->file('imagen')->store('playlist_images', 'public');

            if ($playlist->imagen) {
                Storage::disk('public')->delete($playlist->imagen);
            }

            $validatedData['imagen'] = $newPath;
        }

        $playlist->update($validatedData);

        return redirect()->route('playlists.index')->with('success', 'Playlist actualizada exitosamente.');
    }

    public function destroy(Playlist $playlist)
    {
        if ($playlist->imagen) {
            Storage::disk('public')->delete($playlist->imagen);
        }

        $playlist->delete();

        return redirect()->route('playlists.index')->with('success', 'Playlist eliminada exitosamente.');
    }
}