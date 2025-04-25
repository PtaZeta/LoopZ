import React from 'react';
import { usePage, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PencilIcon, ArrowUturnLeftIcon, MusicalNoteIcon, PlayIcon } from '@heroicons/react/24/solid';

export default function Mostrar() {
    const { cancion, auth } = usePage().props;

    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(segundos % 60).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const urlFotoCompleta = cancion.foto_url?.startsWith('http')
                                ? cancion.foto_url
                                : cancion.foto_url ? `/storage/${cancion.foto_url}` : null;

    const urlAudioCompleta = cancion.archivo_url?.startsWith('http')
                                ? cancion.archivo_url
                                : cancion.archivo_url ? `/storage/${cancion.archivo_url}` : null;

    const artistas = cancion.usuarios && cancion.usuarios.length > 0
        ? cancion.usuarios.map(user => user.name).join(', ')
        : 'Desconocido';

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-200">
                        {cancion.titulo || 'Detalles de Canción'}
                    </h2>
                    {cancion.can?.edit && (
                        <Link
                            href={route('canciones.edit', cancion.id)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:from-blue-600 hover:to-pink-600 active:from-blue-700 active:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition ease-in-out duration-150 shadow-md"
                            title="Editar"
                        >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={cancion.titulo || 'Detalles de Canción'} />

            {/* Se eliminó backgroundStyle para usar el del Layout */}
            <div className={`py-12 min-h-screen`}>
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="md:flex md:items-end md:space-x-8 p-6 md:p-10 bg-transparent">
                        <div className="flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64 mb-6 md:mb-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700/50">
                            {urlFotoCompleta ? (
                                <img
                                    src={urlFotoCompleta}
                                    alt={`Cover de ${cancion.titulo}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                    <MusicalNoteIcon className="h-24 w-24" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-medium uppercase tracking-wider text-blue-400 mb-1">Canción</p>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-4 text-white break-words shadow-sm">
                                {cancion.titulo}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center space-x-3 text-sm text-gray-300 mb-8">
                                <span className="font-semibold">{cancion.usuario?.name ?? 'Usuario'}</span>
                                {artistas !== 'Desconocido' && <span className="text-pink-400 font-semibold">• {artistas}</span>}
                                <span>• {formatearDuracion(cancion.duracion)}</span>
                                {cancion.genero && <span>• {cancion.genero}</span>}
                                <span className="hidden sm:inline">• {cancion.visualizaciones?.toLocaleString() || 0} views</span>
                            </div>

                            {urlAudioCompleta ? (
                                <div className='mb-8'>
                                    <audio controls controlsList="nodownload" className="w-full rounded-lg shadow-lg bg-slate-700/80 backdrop-blur-sm">
                                        <source src={urlAudioCompleta} type="audio/mpeg" />
                                        Tu navegador no soporta el elemento de audio.
                                    </audio>
                                 </div>
                            ) : (
                                <p className="text-sm text-gray-400 mb-8">No hay archivo de audio disponible.</p>
                            )}

                             <div className="flex items-center justify-center md:justify-start space-x-4">
                                 <button
                                     onClick={() => document.querySelector('audio')?.play()}
                                     className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full font-semibold text-white shadow-lg hover:scale-105 transform transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                                     title="Reproducir"
                                     disabled={!urlAudioCompleta}
                                 >
                                      <PlayIcon className="h-7 w-7" />
                                 </button>
                                 <Link
                                     href={route('canciones.index')}
                                     className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-widest shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                 >
                                      <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
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
