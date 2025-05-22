import React from 'react';
import { usePage, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PencilIcon, ArrowUturnLeftIcon, MusicalNoteIcon, PlayIcon, PauseIcon, SparklesIcon, EyeIcon, ClockIcon, UsersIcon, ScaleIcon } from '@heroicons/react/24/solid';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Mostrar() {
    const { cancion, auth } = usePage().props;
    const { cargarColaYIniciar, cancionActual, Reproduciendo, pause, play } = usePlayer();

    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(Math.floor(segundos % 60)).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const currentSongPhotoUrl = cancion.foto_url?.startsWith('http')
        ? cancion.foto_url
        : cancion.foto_url ? `/storage/${cancion.foto_url}` : null;

    const originalSongPhotoUrl = cancion.remix && cancion.cancion_original?.foto_url
        ? (cancion.cancion_original.foto_url.startsWith('http')
            ? cancion.cancion_original.foto_url
            : `/storage/${cancion.cancion_original.foto_url}`)
        : null;

    const displayPhotoUrl = originalSongPhotoUrl || currentSongPhotoUrl;

    const audioFileAvailable = !!cancion.archivo_url;

    const isThisSongCurrent = cancionActual && cancionActual.id === cancion.id;

    const artistas = cancion.usuarios_mapeados && cancion.usuarios_mapeados.length > 0
        ? cancion.usuarios_mapeados.map(user => (
            <Link
                key={user.id}
                href={route('profile.show', user.id)}
                className="text-pink-300 hover:text-pink-200 transition-colors duration-200 font-semibold"
            >
                {user.name}
            </Link>
        )).reduce((prev, curr) => [prev, ', ', curr])
        : 'Desconocido';

    const handlePlayPause = () => {
        if (!audioFileAvailable) {
            console.warn('No hay archivo de audio disponible para esta canción.');
            return;
        }

        if (isThisSongCurrent && Reproduciendo) {
            pause();
        } else if (isThisSongCurrent && !Reproduciendo) {
            play();
        } else {
            cargarColaYIniciar([cancion], { iniciar: 0, clickDirecto: true });
        }
    };

    const canEdit = auth.user && cancion.usuarios_mapeados.some(
        user => user.id === auth.user.id && user.es_propietario
    );

    return (
        <AuthenticatedLayout>
            <Head title={cancion.titulo || 'Detalles de Canción'} />

            <div className="pt-20 py-12 min-h-screen text-gray-100 bg-gradient-to-br from-slate-900 to-gray-950">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-start md:space-x-12 p-8 md:p-12 bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-4xl overflow-hidden border border-slate-700">
                        <div className="flex-shrink-0 w-60 h-60 lg:w-80 lg:h-80 mb-8 md:mb-0 mx-auto md:mx-0 shadow-2xl rounded-xl overflow-hidden border-4 border-purple-600 transform hover:scale-105 transition-transform duration-300 ease-in-out">
                            {displayPhotoUrl ? (
                                <img
                                    src={displayPhotoUrl}
                                    alt={`Cover de ${cancion.titulo}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400">
                                    <MusicalNoteIcon className="h-32 w-32" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-2">Canción</p>
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-5 text-white drop-shadow-lg leading-tight">
                                {cancion.titulo}
                            </h1>

                            {/* Song Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 text-sm text-gray-300">
                                <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-3 shadow-inner border border-slate-600">
                                    <UsersIcon className="h-6 w-6 text-pink-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-400">Artistas</p>
                                        <p className="text-pink-300">{artistas}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-3 shadow-inner border border-slate-600">
                                    <ClockIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-400">Duración</p>
                                        <p className="text-blue-300">{formatearDuracion(cancion.duracion)}</p>
                                    </div>
                                </div>
                                {cancion.generos_mapeados && (
                                    <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-3 shadow-inner border border-slate-600">
                                        <MusicalNoteIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400">Género</p>
                                            <p className="text-green-300">{cancion.generos_mapeados}</p>
                                        </div>
                                    </div>
                                )}
                                {cancion.licencia && (
                                    <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-3 shadow-inner border border-slate-600">
                                        <ScaleIcon className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400">Licencia</p>
                                            <p className="text-yellow-300">{cancion.licencia.nombre}</p>
                                        </div>
                                    </div>
                                )}
                                {cancion.visualizaciones !== undefined && cancion.visualizaciones !== null && (
                                    <div className="bg-slate-700/50 p-4 rounded-lg flex items-center space-x-3 shadow-inner border border-slate-600">
                                        <EyeIcon className="h-6 w-6 text-orange-400 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-gray-400">Visualizaciones</p>
                                            <p className="text-orange-300">{cancion.visualizaciones}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Remix Information */}
                            {cancion.remix && cancion.cancion_original && (
                                <p className="mb-8 text-base text-gray-300 flex items-center space-x-3 bg-purple-900/40 p-4 rounded-lg border border-purple-700 shadow-lg animate-pulse-fade">
                                    <SparklesIcon className="h-6 w-6 text-purple-300 flex-shrink-0" />
                                    <span>
                                        ¡Este es un **remix** de{' '}
                                        <Link href={route('canciones.show', cancion.cancion_original.id)} className="font-bold text-purple-200 hover:text-white underline transition-colors duration-200">
                                            {cancion.cancion_original.titulo}
                                        </Link>{' '}
                                        por{' '}
                                        <span className="font-bold text-purple-200">
                                            {cancion.cancion_original.usuarios_mapeados && cancion.cancion_original.usuarios_mapeados.length > 0
                                                ? cancion.cancion_original.usuarios_mapeados.map(u => u.name).join(', ')
                                                : 'Artista Desconocido'}
                                        </span>! Descubre la original.
                                    </span>
                                </p>
                            )}

                            {/* Audio Not Available Warning */}
                            {!audioFileAvailable && (
                                <p className="text-base text-red-300 mb-8 bg-red-900/30 p-4 rounded-lg border border-red-700 shadow-inner flex items-center space-x-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.332 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="font-bold">¡Atención!</span> No hay archivo de audio disponible para esta canción.
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start space-x-4 mt-8">
                                <button
                                    onClick={handlePlayPause}
                                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full font-bold text-white text-xl shadow-2xl hover:scale-110 transform transition duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={isThisSongCurrent && Reproduciendo ? "Pausar reproducción" : "Reproducir canción"}
                                    disabled={!audioFileAvailable}
                                >
                                    {isThisSongCurrent && Reproduciendo ? (
                                        <PauseIcon className="h-10 w-10" />
                                    ) : (
                                        <PlayIcon className="h-10 w-10" />
                                    )}
                                </button>
                                <Link
                                    href={route('canciones.index')}
                                    className="inline-flex items-center px-8 py-4 border border-slate-600 rounded-full font-semibold text-sm text-gray-300 uppercase tracking-wider shadow-lg bg-slate-700/40 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.history.length > 2) {
                                            window.history.back();
                                        } else {
                                            window.location.href = '/';
                                        }
                                    }}
                                >
                                    <ArrowUturnLeftIcon className="h-5 w-5 mr-3" />
                                    Volver
                                </Link>

                                {canEdit && (
                                    <Link
                                        href={route('canciones.edit', cancion.id)}
                                        className="inline-flex items-center px-8 py-4 border border-purple-600 rounded-full font-semibold text-sm text-purple-300 uppercase tracking-wider shadow-lg bg-purple-800/30 hover:bg-purple-800/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        <PencilIcon className="h-5 w-5 mr-3" />
                                        Editar
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
