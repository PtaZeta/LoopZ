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
        return Inertia::render('playlists/Show', [
            'playlist' => $playlist,
        ]);
    }

    public function edit(Playlist $playlist)
    {
        return Inertia::render('playlists/Edit', [
            'playlist' => $playlist->append('imagen_url') // Assuming imagen_url accessor exists and needed
        ]);
    }

    public function update(UpdatePlaylistRequest $request, Playlist $playlist)
    {
        $validatedData = $request->validated();

        if (array_key_exists('eliminar_imagen', $validatedData) && $validatedData['eliminar_imagen'] === true) {
            if ($playlist->imagen && Storage::disk('public')->exists($playlist->imagen)) {
                Storage::disk('public')->delete($playlist->imagen);
            }
            $validatedData['imagen'] = null;
        } else {
            if ($request->hasFile('imagen')) {
                $newPath = $request->file('imagen')->store('playlist_images', 'public');
                if ($playlist->imagen && Storage::disk('public')->exists($playlist->imagen)) {
                    Storage::disk('public')->delete($playlist->imagen);
                }
                $validatedData['imagen'] = $newPath;
            } else {
                unset($validatedData['imagen']);
            }
        }

        if(array_key_exists('eliminar_imagen', $validatedData)){
             unset($validatedData['eliminar_imagen']);
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
