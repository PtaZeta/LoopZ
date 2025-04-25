import React from 'react';
import { Link } from '@inertiajs/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Cancion({ cancion, onDelete, processing }) {
    return (
        <li className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-700 transition-all duration-200 p-6">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                <div className="flex-shrink-0 mb-4 md:mb-0">
                    <Link href={route('canciones.show', cancion.id)} title="Ver Detalles">
                        {cancion.foto_url ? (
                            <img src={cancion.foto_url} alt={`Portada de ${cancion.titulo}`} className="w-24 h-24 md:w-32 md:h-32 rounded-md object-cover border border-gray-600 shadow-md"/>
                        ) : (
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-md bg-gray-700 flex items-center justify-center text-gray-500 border border-gray-600 italic text-sm">
                                Sin foto
                            </div>
                        )}
                    </Link>
                </div>

                <div className="flex-grow min-w-0">
                    <h3 className="text-xl font-bold text-gray-100 truncate mb-1">{cancion.titulo}</h3>
                    <p className="text-sm text-gray-400 mb-1">
                        <span className="font-medium text-gray-300">Género:</span> {cancion.genero || 'No especificado'}
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                        <span className="font-medium text-gray-300">Duración:</span> {formatDuration(cancion.duracion)}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">
                        <span className="font-medium text-gray-300">Visualizaciones:</span> {cancion.visualizaciones?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">
                        <span className="font-medium text-gray-300">Artista(s):</span>
                        {' '}
                        {cancion.usuarios && cancion.usuarios.length > 0
                            ? cancion.usuarios.map(user => user.name).join(', ')
                            : ' No asignado'}
                    </p>
                    {cancion.archivo_url && (
                        <div className="mt-3 max-w-md">
                            <audio controls controlsList="nodownload" className="w-full h-10 rounded-md bg-gray-700">
                                <source src={cancion.archivo_url} type="audio/mpeg" />
                                Tu navegador no soporta la reproducción de audio.
                            </audio>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0 self-start md:self-center">
                    {cancion.can?.edit && (
                        <Link
                            href={route('canciones.edit', cancion.id)}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-yellow-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150 shadow"
                            title="Editar"
                        >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                        </Link>
                    )}
                    {cancion.can?.delete && (
                        <button
                            onClick={() => onDelete(cancion.id)}
                            disabled={processing}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150 shadow"
                            title="Eliminar"
                        >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
}
