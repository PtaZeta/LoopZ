import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PlayerImagenItem } from '@/Layouts/AuthenticatedLayout';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';


const obtenerUrlImagenResultado = (item, tipo) => {
    if (!item) return null;
    if (tipo === 'cancion' || tipo === 'album' || tipo === 'ep' || tipo === 'single') {
        if (item.imagen) {
            return item.imagen.startsWith('http') ? item.imagen : `/storage/${item.imagen}`;
        }
        if (item.image_url) return item.image_url;
        if (item.album?.image_url) return item.album.image_url;
    }
    if (tipo === 'user' && item.profile_photo_url) return item.profile_photo_url;
    if (tipo === 'playlist' && item.image_url) return item.image_url;
    return null;
};


export default function SearchIndex({ searchQuery, results, filters }) {
    const { users, canciones, playlists, albumes, eps, singles } = results;

    const tieneResultados = users?.length > 0 || canciones?.length > 0 || playlists?.length > 0 || albumes?.length > 0 || eps?.length > 0 || singles?.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title={`Resultados de búsqueda para "${searchQuery}"`} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                    Resultados de búsqueda para: <span className="text-blue-500">{searchQuery}</span>
                </h1>

                {!tieneResultados && (
                    <p className="text-gray-400 text-lg">No se encontraron resultados para tu búsqueda.</p>
                )}

                {users && users.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Usuarios</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {users.map(user => (
                                <Link key={user.id} href={route('profile.show', user.id)} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/70 transition ease-in-out duration-150 block">
                                    <p className="text-center text-white font-medium">{user.name}</p>
                                    <p className="text-center text-sm text-gray-400">{user.email}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {canciones && canciones.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Canciones</h2>
                        <ul className="space-y-3">
                            {canciones.map(cancion => (
                                <li key={cancion.id} className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700/70 transition ease-in-out duration-150">
                                    <Link href={route('canciones.show', cancion.id)} className="flex items-center space-x-3">
                                        <div>
                                            <p className="text-white font-medium">{cancion.titulo}</p>
                                            <p className="text-sm text-gray-400">
                                                {cancion.usuarios?.map(u => u.name).join(', ') || cancion.artista || 'Artista Desconocido'}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {playlists && playlists.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Playlists</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {playlists.map(playlist => (
                                <Link key={playlist.id} href={route('playlists.show', playlist.id)} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/70 transition ease-in-out duration-150 block">
                                    <p className="text-white font-medium mt-2">{playlist.nombre}</p>
                                    {playlist.user && <p className="text-sm text-gray-400">De: {playlist.user.name}</p>}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {albumes && albumes.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Álbumes</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {albumes.map(album => (
                                <Link key={album.id} href={route('albumes.show', album.id)} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/70 transition ease-in-out duration-150 block">
                                    <p className="text-white font-medium mt-2">{album.titulo}</p>
                                    <p className="text-sm text-gray-400">{album.artista || 'Artista Desconocido'}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}


            </div>
        </AuthenticatedLayout>
    );
}
