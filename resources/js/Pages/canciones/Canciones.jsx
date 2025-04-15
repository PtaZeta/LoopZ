import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Canciones({ auth, canciones, success: mensajeExitoSesion }) {
    const { delete: eliminarCancion, processing } = useForm();

    const manejarEliminar = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
            eliminarCancion(route('canciones.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Canciones
                </h2>
            }
        >
            <Head title="Canciones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {/* Mensaje de éxito */}
                    {mensajeExitoSesion && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md shadow-sm">
                            {mensajeExitoSesion}
                        </div>
                    )}

                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route('canciones.create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-900 focus:ring ring-blue-300 disabled:opacity-25 transition ease-in-out duration-150"
                        >
                            Crear Nueva Canción
                        </Link>
                    </div>

                    {/* Contenedor Principal */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {canciones.length === 0 ? (
                                <p className="text-center text-gray-500">No hay canciones para mostrar.</p>
                            ) : (
                                <ul className="space-y-6">
                                    {canciones.map(cancion => (
                                        <li key={cancion.id} className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
                                            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
                                                {/* Columna Izquierda: Imagen */}
                                                {cancion.foto_url ? (
                                                    <div className="flex-shrink-0 mb-4 md:mb-0">
                                                        <img
                                                            src={cancion.foto_url}
                                                            alt={`Portada de ${cancion.titulo}`}
                                                            className="w-24 h-24 md:w-32 md:h-32 rounded-md object-cover border border-gray-100"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex-shrink-0 mb-4 md:mb-0 w-24 h-24 md:w-32 md:h-32 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                                                        Sin foto
                                                    </div>
                                                )}

                                                {/* Columna Central: Detalles y Audio */}
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="text-xl font-bold text-gray-800 truncate mb-1">{cancion.titulo}</h3>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <span className="font-medium">Género:</span> {cancion.genero || 'No especificado'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        <span className="font-medium">Duración:</span> {cancion.duracion ? `${cancion.duracion} seg.` : 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        <span className="font-medium">Visualizaciones:</span> {cancion.visualizaciones || 0}
                                                    </p>
                                                    {/* --- INICIO: Mostrar Artistas --- */}
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        <span className="font-medium">Artista(s):</span>
                                                        {' '}
                                                        {/* Verifica si hay usuarios y si el array no está vacío */}
                                                        {cancion.usuarios && cancion.usuarios.length > 0
                                                            ? cancion.usuarios.map(user => user.name).join(', ') // Mapea los nombres y los une con coma
                                                            : ' No asignado'} {/* Muestra texto alternativo si no hay artistas */}
                                                    </p>
                                                    {/* --- FIN: Mostrar Artistas --- */}

                                                    {cancion.archivo_url && (
                                                        <div className="mt-2 max-w-md">
                                                            <audio controls controlsList="nodownload" className="w-full h-10">
                                                                <source src={cancion.archivo_url} type="audio/mpeg" />
                                                                Tu navegador no soporta la reproducción de audio.
                                                            </audio>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Columna Derecha: Acciones */}
                                                <div className="flex-shrink-0 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0 self-start md:self-center">
                                                    <Link
                                                        href={route('canciones.show', cancion.id)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-indigo-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-600 active:bg-indigo-700 focus:outline-none focus:border-indigo-700 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                                                        title="Ver Detalles"
                                                    >
                                                        Detalles
                                                    </Link>
                                                    <Link
                                                        href={route('canciones.edit', cancion.id)}
                                                          className="inline-flex items-center px-3 py-1.5 bg-yellow-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:border-yellow-700 focus:ring ring-yellow-300 disabled:opacity-25 transition ease-in-out duration-150"
                                                          title="Editar"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        onClick={() => manejarEliminar(cancion.id)}
                                                        disabled={processing}
                                                        className="inline-flex items-center px-3 py-1.5 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 active:bg-red-800 focus:outline-none focus:border-red-900 focus:ring ring-red-300 disabled:opacity-50 transition ease-in-out duration-150"
                                                        title="Eliminar"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
