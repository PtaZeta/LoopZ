import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', nombre = '', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const baseUrl = esStorage ? '/storage/' : '';
    const urlImagenCompleta = src ? `${baseUrl}${src}?t=${new Date().getTime()}` : null;

    const handleImageError = () => {
        setErrorCarga(true);
    };

    const PlaceholderContenido = () => {
        return (
             <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path></svg>
        );
    };

    const claveUnica = urlImagenCompleta || `placeholder-${tipo}-${alt}`;

    return (
        <>
            {urlImagenCompleta && !errorCarga ? (
                <img
                    key={claveUnica}
                    src={urlImagenCompleta}
                    alt={alt}
                    className={claseImagen}
                    onError={handleImageError}
                    loading="lazy"
                />
            ) : (
                <div key={claveUnica} className={`${clasePlaceholder} flex items-center justify-center overflow-hidden`}>
                   <PlaceholderContenido />
                </div>
            )}
        </>
    );
};

const ListaUsuariosPlaylist = ({ usuarios, usuarioLogueadoId }) => {
    if (!usuarios || usuarios.length === 0) {
        return <span className="text-xs text-gray-500 mt-1 truncate w-full">Sin colaboradores</span>;
    }

    const usuariosOrdenados = [...usuarios].sort((a, b) => {
        if (a.id === usuarioLogueadoId) return -1;
        if (b.id === usuarioLogueadoId) return 1;
        return 0;
    });

    const usuariosMostrados = usuariosOrdenados.slice(0, 2);
    const usuariosTooltip = usuariosOrdenados.slice(2);
    const usuariosOcultosCount = usuariosTooltip.length;
    return (
        <div className="relative group mt-1 w-full">
            <p className="text-xs text-gray-400 truncate w-full cursor-default">
                De: {usuariosMostrados.map(u => u.name).join(', ')}
                {usuariosOcultosCount > 0 && (
                    <span className="font-semibold"> +{usuariosOcultosCount} más</span>
                )}
            </p>
            {usuariosOcultosCount > 0 && (
                <div className="absolute bottom-full left-2/3 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-600 text-white text-xs rounded py-1 px-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <ul className="list-none p-0 m-0">
                        {usuariosTooltip.map(u => (
                            <li key={u.id}>{u.name}</li>
                        ))}
                    </ul>
                    <svg className="absolute text-gray-600 h-2 w-full left-100 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                </div>
            )}
        </div>
    );
};


export default function Biblioteca({ playlists, playlistsLoopZs }) {
    const { auth } = usePage().props;
    const usuarioLogueadoId = auth.user.id;

    return (
        <AuthenticatedLayout>
            <Head title="Mi Biblioteca" />

            <main className='pt-3 pb-12 min-h-screen px-4 sm:px-6 lg:px-8'>
                <h3 className="text-2xl font-semibold mb-6 text-gray-100">
                    Tus Playlists
                </h3>
                {playlists && playlists.length > 0 ? (
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {playlists.map(playlist => (
                            <li key={playlist.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col items-center text-center transition duration-200 ease-in-out hover:bg-gray-700">
                                <Link href={route('playlists.show', playlist.id)} className="block w-full p-4 pb-0">
                                    <div className="relative w-full aspect-square mb-3">
                                        <ImagenConPlaceholder
                                            src={playlist.imagen}
                                            alt={`Portada de ${playlist.nombre}`}
                                            claseImagen="absolute inset-0 w-full h-full object-cover rounded"
                                            clasePlaceholder="absolute inset-0 w-full h-full rounded bg-gray-700 flex items-center justify-center"
                                            tipo="playlist"
                                            esStorage={true}
                                        />
                                    </div>
                                </Link>
                                <div className="w-full px-4 pb-4 flex flex-col items-center">
                                    <Link href={route('playlists.show', playlist.id)} className="block w-full truncate group">
                                        <span className="text-sm font-semibold text-gray-100 group-hover:underline">{playlist.nombre}</span>
                                    </Link>
                                    <ListaUsuariosPlaylist
                                        usuarios={playlist.usuarios}
                                        usuarioLogueadoId={usuarioLogueadoId}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">No tienes ninguna playlist todavía.</p>
                )}

                <h3 className="mt-6 text-2xl font-semibold mb-6 text-gray-100">
                    LoopZs
                </h3>
                {playlistsLoopZs && playlistsLoopZs.length > 0 ? (
                    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {playlistsLoopZs.map(playlist => (
                            <li key={playlist.id} className="bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col items-center text-center transition duration-200 ease-in-out hover:bg-gray-700">
                                <Link href={route('playlists.show', playlist.id)} className="block w-full p-4 pb-0">
                                    <div className="relative w-full aspect-square mb-3">
                                        <ImagenConPlaceholder
                                            src={playlist.imagen}
                                            alt={`Portada de ${playlist.nombre}`}
                                            claseImagen="absolute inset-0 w-full h-full object-cover rounded"
                                            clasePlaceholder="absolute inset-0 w-full h-full rounded bg-gray-700 flex items-center justify-center"
                                            tipo="playlist"
                                            esStorage={true}
                                        />
                                    </div>
                                </Link>
                                <div className="w-full px-4 pb-4 flex flex-col items-center">
                                    <Link href={route('playlists.show', playlist.id)} className="block w-full truncate group">
                                        <span className="text-sm font-semibold text-gray-100 group-hover:underline">{playlist.nombre}</span>
                                    </Link>
                                    <ListaUsuariosPlaylist
                                        usuarios={playlist.usuarios}
                                        usuarioLogueadoId={usuarioLogueadoId}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400">No tienes ninguna playlist todavía.</p>
                )}

            </main>

        </AuthenticatedLayout>
    );
}
