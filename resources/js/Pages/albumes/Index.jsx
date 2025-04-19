import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

const obtenerUrlImagen = (album) => {
    if (album.image_url) {
        return album.image_url;
    }
    if (album.imagen) {
        return `/storage/${album.imagen}`;
    }
    return null;
};

export default function AlbumIndex() {
    const { props } = usePage();
    const { auth, albumes: albumes, flash } = props;

    const mensajeExitoFlash = flash?.success;

    const [eliminandoId, setEliminandoId] = useState(null);

    const manejarEliminar = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta album? Esta acción no se puede deshacer.')) {
            setEliminandoId(id);
            router.delete(route('albumes.destroy', id), {
                preserveScroll: true,
                onFinish: () => setEliminandoId(null),
                onError: (errors) => {
                    console.error('Error deleting album:', errors);
                    alert('Hubo un error al eliminar la album.');
                    setEliminandoId(null);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Albums
                </h2>
            }
        >
            <Head title="Albums" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {mensajeExitoFlash && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeExitoFlash}
                        </div>
                    )}

                    <div className="flex justify-end mb-6">
                        <Link
                            href={route('albumes.create')}
                            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                        >
                            Crear Album
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {!albumes || albumes.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                    No hay albumes para mostrar. ¡Crea una nueva!
                                </p>
                            ) : (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {albumes.map((album) => {
                                        const urlImagen = obtenerUrlImagen(album);
                                        return (
                                            <li
                                                key={album.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col text-center overflow-hidden"
                                            >
                                                <Link
                                                    href={route('albumes.show', album.id)}
                                                    className="block p-4 flex-grow hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150 ease-in-out"
                                                    title={`Ver detalles de ${album.nombre}`}
                                                >
                                                    <div className="w-full h-36 mb-3 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                        {urlImagen ? (
                                                            <img
                                                                src={urlImagen}
                                                                alt={`Portada de ${album.nombre}`}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                    const parent = e.target.parentElement;
                                                                    if (parent && !parent.querySelector('.placeholder-text')) {
                                                                        const placeholder = document.createElement('span');
                                                                        placeholder.className = 'text-sm text-gray-500 dark:text-gray-400 placeholder-text';
                                                                        placeholder.textContent = 'Sin Imagen';
                                                                        parent.appendChild(placeholder);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">Sin Imagen</span>
                                                        )}
                                                    </div>

                                                    <h2
                                                        className="text-lg font-semibold mt-2 mb-1 text-gray-800 dark:text-gray-100 truncate"
                                                        title={album.nombre}
                                                    >
                                                        {album.nombre}
                                                    </h2>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                                        {album.descripcion || 'Sin descripción'}
                                                    </p>
                                                </Link>

                                                {(album.created_at || album.updated_at) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 px-4 pb-2 pt-1 mt-auto">
                                                        {album.created_at && <p>Creada: {new Date(album.created_at).toLocaleDateString()}</p>}
                                                        {album.updated_at && album.updated_at !== album.created_at && <p>Actualizada: {new Date(album.updated_at).toLocaleDateString()}</p>}
                                                    </div>
                                                )}

                                                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 flex justify-center items-center space-x-2">
                                                    {album.can?.edit && (
                                                    <Link
                                                        href={route('albumes.edit', album.id)}
                                                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white uppercase bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                                        title="Editar Album"
                                                    >
                                                        Editar
                                                    </Link>
                                                    )}
                                                    {album.can?.delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => manejarEliminar(album.id)}
                                                        disabled={eliminandoId === album.id}
                                                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white uppercase bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
                                                        title="Eliminar Album"
                                                    >
                                                        {eliminandoId === album.id ? 'Borrando...' : 'Eliminar'}
                                                    </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
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
