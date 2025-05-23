import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import PropTypes from 'prop-types';
import { usePlayer } from '@/contexts/PlayerContext';

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', nombre = '' }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const urlImagenCompleta = src;

    const handleImageError = () => {
        setErrorCarga(true);
    };

    const PlaceholderContenido = () => {
        if (tipo === 'user') {
            return (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path></svg>
        );
    };

    const claveUnica = urlImagenCompleta || `placeholder-${tipo}-${alt.replace(/\s+/g, '-')}-${nombre}`;

    useEffect(() => {
        setErrorCarga(false);
    }, [src]);

    return urlImagenCompleta && !errorCarga ? (
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
    );
};

ImagenConPlaceholder.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string.isRequired,
    claseImagen: PropTypes.string,
    clasePlaceholder: PropTypes.string,
    tipo: PropTypes.string,
    nombre: PropTypes.string,
};

const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>;
const PauseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1_0_00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>;

export default function PlaylistComunidad({ auth, genero, playlists, canciones, usuariosDelGenero }) {
    const {
        cancionActual,
        Reproduciendo,
        cargarColaYIniciar,
        pause,
        play,
    } = usePlayer();

    const [limitePlaylists, setLimitePlaylists] = useState(4);
    const [limiteCanciones, setLimiteCanciones] = useState(4);
    const [limiteUsuarios, setLimiteUsuarios] = useState(4);

    const mostrarMasPlaylists = () => setLimitePlaylists((prev) => prev + 4);
    const mostrarMasCanciones = () => setLimiteCanciones((prev) => prev + 4);
    const mostrarMasUsuarios = () => setLimiteUsuarios((prev) => prev + 4);

    const manejarReproducirPausa = (cancion) => {
        if (cancionActual && cancionActual.id === cancion.id) {
            if (Reproduciendo) {
                pause();
            } else {
                play();
            }
        } else {
            if (cancion.archivo_url) {
                const index = canciones.findIndex(s => s.id === cancion.id);
                if (index !== -1) {
                    cargarColaYIniciar(canciones, { iniciar: index, clickDirecto: true });
                }
            } else {
                console.warn('La canción no tiene URL de archivo:', cancion.titulo);
            }
        }
    };

    const isThisSongPlaying = (songId) => cancionActual && cancionActual.id === songId && Reproduciendo;

    const Layout = auth.user ? AuthenticatedLayout : GuestLayout;

    return (
        <Layout>
            <Head title={`${genero.nombre}`} />

            <main className="pt-20">
                <section className="container mx-auto px-4 py-10 md:py-16 text-center flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 opacity-10">
                        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-blue-900 rounded-full filter blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-pink-900 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-white relative z-10">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">Comunidad de {genero.nombre}</span>
                    </h1>
                    <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">Descubre playlists, canciones y creadores apasionados por el género {genero.nombre}.</p>
                </section>

                {canciones && canciones.length > 0 && (
                    <section id="canciones" className="container mx-auto px-4 py-10">
                        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">Canciones</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                            {canciones.slice(0, limiteCanciones).map((cancion) => (
                                <div key={cancion.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl">
                                    <div className="relative w-full h-32 sm:h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                                        <ImagenConPlaceholder
                                            src={cancion.foto_perfil}
                                            alt={`Portada de ${cancion.titulo}`}
                                            claseImagen="w-full h-full object-cover"
                                            clasePlaceholder="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500"
                                            tipo="song"
                                            nombre={cancion.titulo}
                                        />
                                        <button
                                            onClick={() => manejarReproducirPausa(cancion)}
                                            className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110"
                                            aria-label={isThisSongPlaying(cancion.id) ? 'Pausar canción' : 'Reproducir canción'}
                                        >
                                            {isThisSongPlaying(cancion.id) ? <PauseIcon /> : <PlayIcon />}
                                        </button>
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <h3 className="font-semibold text-base sm:text-lg text-white mb-1 truncate">{cancion.titulo}</h3>
                                        <p className="text-xs sm:text-sm text-gray-400 mb-2 truncate">
                                            {cancion.usuarios && cancion.usuarios.length > 0 ? (
                                                <Link href={`/profile/${cancion.usuarios[0].id}`} className="hover:underline">
                                                    {cancion.usuarios[0].name}
                                                </Link>
                                            ) : 'Artista Desconocido'}
                                        </p>
                                        <Link href={`/canciones/${cancion.id}`} className="text-xs sm:text-sm text-blue-400 hover:text-blue-500">Ver Canción</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {canciones.length > limiteCanciones && (
                            <div className="text-center mt-6">
                                <button onClick={mostrarMasCanciones} className="text-blue-400 hover:text-blue-500 text-sm sm:text-base">Mostrar Más</button>
                            </div>
                        )}
                    </section>
                )}

                <section id="playlists" className="container mx-auto px-4 py-10">
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">Playlists</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                        {playlists && playlists.length > 0 ? (
                            playlists.slice(0, limitePlaylists).map((playlist) => {
                                return (
                                    <div key={playlist.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl">
                                        <div className="w-full h-32 sm:h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                                            <ImagenConPlaceholder
                                                src={playlist.imagen}
                                                alt={`Portada de ${playlist.nombre}`}
                                                claseImagen="w-full h-full object-cover"
                                                clasePlaceholder="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500"
                                                tipo="playlist"
                                                nombre={playlist.nombre}
                                            />
                                        </div>
                                        <div className="p-3 sm:p-4">
                                            <h3 className="font-semibold text-base sm:text-lg text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{playlist.nombre}</h3>
                                            <p className="text-xs sm:text-sm text-gray-400 mb-3">{playlist.canciones?.length || 0} canciones</p>
                                            <Link href={`/playlists/${playlist.id}`} className="text-xs sm:text-sm text-blue-400 hover:text-blue-500">Ver Playlist</Link>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center col-span-full text-gray-500 text-sm sm:text-base">No se encontraron playlists con este género.</p>
                        )}
                    </div>
                    {playlists.length > limitePlaylists && (
                        <div className="text-center mt-6">
                            <button onClick={mostrarMasPlaylists} className="text-blue-400 hover:text-blue-500 text-sm sm:text-base">Mostrar Más</button>
                        </div>
                    )}
                </section>

                {usuariosDelGenero && usuariosDelGenero.length > 0 && (
                    <section id="usuarios" className="container mx-auto px-4 py-10">
                        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">Artistas</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
                            {usuariosDelGenero.slice(0, limiteUsuarios).map((usuario) => (
                                <div key={usuario.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl">
                                    <div className="w-full h-32 sm:h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                                        <ImagenConPlaceholder
                                            src={usuario.foto_perfil}
                                            alt={`Perfil de ${usuario.name}`}
                                            claseImagen="w-full h-full object-cover"
                                            clasePlaceholder="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500"
                                            tipo="user"
                                            nombre={usuario.name}
                                        />
                                    </div>
                                    <div className="p-3 sm:p-4 text-center">
                                        <h3 className="font-semibold text-base sm:text-lg text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{usuario.name}</h3>
                                        <Link href={`/profile/${usuario.id}`} className="text-xs sm:text-sm text-blue-400 hover:text-blue-500">Ver Perfil</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {usuariosDelGenero.length > limiteUsuarios && (
                            <div className="text-center mt-6">
                                <button onClick={mostrarMasUsuarios} className="text-blue-400 hover:text-blue-500 text-sm sm:text-base">Mostrar Más</button>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </Layout>
    );
}

PlaylistComunidad.propTypes = {
    auth: PropTypes.object.isRequired,
    genero: PropTypes.object.isRequired,
    playlists: PropTypes.array,
    canciones: PropTypes.array,
    usuariosDelGenero: PropTypes.array,
};
