import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import PropTypes from 'prop-types';

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', nombre = '', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const baseUrl = esStorage ? '/storage/' : '';
    const urlImagenCompleta = src ? `${baseUrl}${src}` : null;

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
    esStorage: PropTypes.bool,
};

const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>;
const PauseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>;

export default function PlaylistComunidad({ auth, genero, playlists, usuariosDelGenero }) {
    const [urlCancionActual, setUrlCancionActual] = useState(null);
    const [idCancionSonando, setIdCancionSonando] = useState(null);
    const referenciaAudio = useRef(null);

    useEffect(() => {
        const elementoAudio = referenciaAudio.current;
        if (urlCancionActual && elementoAudio) {
            elementoAudio.src = urlCancionActual;
            elementoAudio.play().catch(error => {
                console.error("Error al intentar reproducir:", error);
                setIdCancionSonando(null);
                setUrlCancionActual(null);
            });
            elementoAudio.onended = () => {
                setIdCancionSonando(null);
                setUrlCancionActual(null);
            }
        } else if (elementoAudio) {
            elementoAudio.pause();
            elementoAudio.onended = null;
        }
        return () => {
            if (elementoAudio) {
                elementoAudio.onended = null;
            }
        }
    }, [urlCancionActual]);

    const manejarReproducirPausa = (cancion) => {
        if (idCancionSonando === cancion.id) {
            referenciaAudio.current?.pause();
            setIdCancionSonando(null);
            setUrlCancionActual(null);
        } else {
            if (cancion.archivo_url) {
                setUrlCancionActual(cancion.archivo_url);
                setIdCancionSonando(cancion.id);
            } else {
                console.warn('La canción no tiene URL de archivo:', cancion.titulo);
            }
        }
    };

    const Layout = auth.user ? AuthenticatedLayout : GuestLayout;

    return (
        <Layout>
            <Head title={`Comunidad de ${genero.nombre}`} />

            <main className="pt-0">
                <section className="container mx-auto px-6 py-10 md:py-16 text-center flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 opacity-10">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-900 rounded-full filter blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-900 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-white relative z-10">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">Comunidad de {genero.nombre}</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">Descubre playlists y creadores apasionados por el género {genero.nombre}.</p>
                </section>

                <section id="playlists" className="container mx-auto px-6 py-10">
                    <h2 className="text-2xl font-semibold text-white mb-6">Playlists</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {playlists && playlists.length > 0 ? (
                            playlists.map((playlist) => {
                                return (
                                    <div key={playlist.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl">
                                        <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                                            <ImagenConPlaceholder
                                                src={playlist.imagen}
                                                alt={`Portada de ${playlist.nombre}`}
                                                claseImagen="w-full h-full object-cover"
                                                clasePlaceholder="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500"
                                                tipo="playlist"
                                                nombre={playlist.nombre}
                                                esStorage={true}
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{playlist.nombre}</h3>
                                            <p className="text-sm text-gray-400 mb-3">{playlist.canciones?.length || 0} canciones</p>
                                            <Link href={`/playlists/${playlist.id}`} className="text-sm text-blue-400 hover:text-blue-500">Ver Playlist</Link>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center col-span-full text-gray-500">No se encontraron playlists con este género.</p>
                        )}
                    </div>
                </section>

                {usuariosDelGenero && usuariosDelGenero.length > 0 && (
                    <section id="usuarios" className="container mx-auto px-6 py-10">
                        <h2 className="text-2xl font-semibold text-white mb-6">Artistas</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {usuariosDelGenero.map((usuario) => (
                                <div key={usuario.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl">
                                    <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                                        <ImagenConPlaceholder
                                            src={usuario.foto_perfil}
                                            alt={`Perfil de ${usuario.name}`}
                                            claseImagen="w-full h-full object-cover"
                                            clasePlaceholder="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500"
                                            tipo="user"
                                            nombre={usuario.name}
                                            esStorage={true}
                                        />
                                    </div>
                                    <div className="p-4 text-center">
                                        <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{usuario.name}</h3>
                                        <Link href={`/profile/${usuario.id}`} className="text-sm text-blue-400 hover:text-blue-500">Ver Perfil</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <audio ref={referenciaAudio} className="hidden" />
        </Layout>
    );
}

PlaylistComunidad.propTypes = {
    auth: PropTypes.object.isRequired,
    genero: PropTypes.object.isRequired,
    playlists: PropTypes.array,
    usuariosDelGenero: PropTypes.array,
};
