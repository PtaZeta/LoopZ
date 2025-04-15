import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import PropTypes from 'prop-types';

const obtenerUrlImagen = (lista) => {
    if (lista.image_url) {
        return lista.image_url;
    }
    if (lista.imagen) {
        return `/storage/${lista.imagen}`;
    }
    return null;
};

export default function PlaylistIndex({ auth, playlists: listasReproduccion, success: mensajeExitoFlash }) {
    const [eliminandoId, setEliminandoId] = useState(null);

    const manejarEliminar = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta playlist? Esta acción no se puede deshacer.')) {
            setEliminandoId(id);
            router.delete(route('playlists.destroy', id), {
                preserveScroll: true,
                onFinish: () => setEliminandoId(null),
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Mis Playlists
                </h2>
            }
        >
            <Head title="Playlists" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {mensajeExitoFlash && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeExitoFlash}
                        </div>
                    )}

                    <div className="flex justify-end mb-6">
                        <Link
                            href={route('playlists.create')}
                            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                        >
                            Crear Playlist
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {!listasReproduccion || listasReproduccion.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                    No hay playlists para mostrar. ¡Crea una nueva!
                                </p>
                            ) : (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {listasReproduccion.map((lista) => {
                                        const urlImagen = obtenerUrlImagen(lista);
                                        return (
                                            <li
                                                key={lista.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col text-center overflow-hidden"
                                            >
                                                <Link
                                                    href={route('playlists.show', lista.id)}
                                                    className="block p-4 flex-grow hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150 ease-in-out"
                                                    title={`Ver detalles de ${lista.nombre}`}
                                                >
                                                    <div className="w-full h-36 mb-3 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                        {urlImagen ? (
                                                            <img
                                                                src={urlImagen}
                                                                alt={`Portada de ${lista.nombre}`}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">Sin Imagen</span>
                                                        )}
                                                    </div>

                                                    <h2
                                                        className="text-lg font-semibold mt-2 mb-1 text-gray-800 dark:text-gray-100 truncate"
                                                        title={lista.nombre}
                                                    >
                                                        {lista.nombre}
                                                    </h2>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                                        {lista.descripcion}
                                                    </p>
                                                </Link>

                                                {(lista.created_at || lista.updated_at) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 px-4 pb-2 pt-1">
                                                        {lista.created_at && <p>Creada: {new Date(lista.created_at).toLocaleDateString()}</p>}
                                                        {lista.updated_at && lista.updated_at !== lista.created_at && <p>Actualizada: {new Date(lista.updated_at).toLocaleDateString()}</p>}
                                                    </div>
                                                )}

                                                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 flex justify-center items-center space-x-2">
                                                    <Link
                                                        href={route('playlists.edit', lista.id)}
                                                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white uppercase bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                                        title="Editar Playlist"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => manejarEliminar(lista.id)}
                                                        disabled={eliminandoId === lista.id}
                                                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white uppercase bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
                                                        title="Eliminar Playlist"
                                                    >
                                                        {eliminandoId === lista.id ? 'Borrando...' : 'Eliminar'}
                                                    </button>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

PlaylistIndex.propTypes = {
    auth: PropTypes.object.isRequired,
    playlists: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string.isRequired,
        imagen: PropTypes.string,
        image_url: PropTypes.string,
        created_at: PropTypes.string,
        updated_at: PropTypes.string,
    })).isRequired,
    success: PropTypes.string,
};
