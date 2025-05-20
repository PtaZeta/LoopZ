import React from 'react';
import { usePage, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PencilIcon, ArrowUturnLeftIcon, MusicalNoteIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Mostrar() {
    const { cancion, auth } = usePage().props;
    const { cargarColaYIniciar, cancionActual, Reproduciendo, pause } = usePlayer();

    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(segundos % 60).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const urlFotoCompleta = cancion.foto_url?.startsWith('http')
                                ? cancion.foto_url
                                : cancion.foto_url ? `/storage/${cancion.foto_url}` : null;

    const audioFileAvailable = !!cancion.archivo_url;

    const isThisSongCurrent = cancionActual && cancionActual.id === cancion.id;

    const artistas = cancion.usuarios_mapeados && cancion.usuarios_mapeados.length > 0
        ? cancion.usuarios_mapeados.map(user => (
            <Link
                key={user.id}
                href={route('profile.show', user.id)}
                className="text-purple-400 hover:text-purple-300"
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
            usePlayer().play();
        } else {
            cargarColaYIniciar([cancion], { iniciar: 0, clickDirecto: true });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={cancion.titulo || 'Detalles de Canción'} />

            <div className=" pt-20 py-12 min-h-screen text-gray-100">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="md:flex md:items-end md:space-x-8 p-6 md:p-10 bg-slate-800/50 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64 mb-6 md:mb-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700">
                            {urlFotoCompleta ? (
                                <img
                                    src={urlFotoCompleta}
                                    alt={`Cover de ${cancion.titulo}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400">
                                    <MusicalNoteIcon className="h-24 w-24" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-medium uppercase tracking-wider text-purple-400 mb-1">Canción</p>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-4 text-white break-words drop-shadow-lg">
                                {cancion.titulo}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center space-x-3 text-sm text-gray-300 mb-8">
                                <span className="font-semibold text-gray-200">{cancion.usuario?.name ?? 'Usuario'}</span>
                                {artistas !== 'Desconocido' && <span className="text-pink-400 font-semibold">• {artistas}</span>}
                                <span>• {formatearDuracion(cancion.duracion)}</span>
                                {cancion.genero && <span>• {cancion.genero}</span>}
                                <span className="hidden sm:inline">• {cancion.visualizaciones?.toLocaleString() || 0} views</span>
                            </div>

                            {!audioFileAvailable && (
                                <p className="text-sm text-gray-400 mb-8">No hay archivo de audio disponible para esta canción.</p>
                            )}

                            <div className="flex items-center justify-center md:justify-start space-x-4">
                                <button
                                    onClick={handlePlayPause}
                                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-white shadow-xl hover:scale-105 transform transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isThisSongCurrent && Reproduciendo ? "Pausar" : "Reproducir"}
                                    disabled={!audioFileAvailable}
                                >
                                    {isThisSongCurrent && Reproduciendo ? (
                                        <PauseIcon className="h-8 w-8" />
                                    ) : (
                                        <PlayIcon className="h-8 w-8" />
                                    )}
                                </button>
                                <Link
                                    href={route('canciones.index')}
                                    className="inline-flex items-center px-6 py-3 border border-slate-700 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-widest shadow-md hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.history.back();
                                    }}
                                >
                                    <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                                    Volver
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
