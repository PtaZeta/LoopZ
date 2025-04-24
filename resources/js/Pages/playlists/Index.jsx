import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PencilIcon, TrashIcon, MusicalNoteIcon, PlayIcon } from '@heroicons/react/24/solid';

const obtenerUrlImagen = (contenedor) => {
    if (!contenedor) return null;
    if (contenedor.imagen) {
        return contenedor.imagen.startsWith('http') ? contenedor.imagen : `/storage/${contenedor.imagen}`;
    }
    return null;
};

export default function PlaylistIndex() {
    const { props } = usePage();
    const { auth, contenedores, flash } = props;

    const mensajeExitoFlash = flash?.success;

    const [eliminandoId, setEliminandoId] = useState(null);

    const manejarEliminar = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este contenedor? Esta acción no se puede deshacer.')) {
            setEliminandoId(id);
            // *** Usando ruta playlists.destroy ***
            router.delete(route('playlists.destroy', id), {
                preserveScroll: true,
                onFinish: () => setEliminandoId(null),
                onError: (errors) => {
                    console.error('Error deleting contenedor:', errors);
                    alert('Hubo un error al eliminar el contenedor.');
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
                    Playlists
                </h2>
            }
        >
            <Head title="Playlists" />

            <div className="py-12 bg-gray-100 dark:bg-slate-900 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {mensajeExitoFlash && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeExitoFlash}
                        </div>
                    )}

                    <div className="flex justify-end mb-6">
                        <Link
                            // *** Usando ruta playlists.create ***
                            href={route('playlists.create')}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:from-blue-600 hover:to-pink-600 active:from-blue-700 active:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 transition ease-in-out duration-150 shadow-md"
                        >
                            Crear Playlist
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-xl sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {!contenedores || contenedores.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                    No hay playlists para mostrar. ¡Crea una nueva!
                                </p>
                            ) : (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {contenedores.map((contenedor) => {
                                        const urlImagen = obtenerUrlImagen(contenedor);
                                        return (
                                            <li
                                                key={contenedor.id}
                                                className="rounded-lg bg-white dark:bg-slate-800/50 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden border border-slate-700/50 group"
                                            >
                                                <Link
                                                    // *** Usando ruta playlists.show ***
                                                    href={route('playlists.show', contenedor.id)}
                                                    className="block p-4 flex-grow hover:bg-slate-700/30 transition duration-150 ease-in-out"
                                                    title={`Ver detalles de ${contenedor.nombre}`}
                                                >
                                                    <div className="w-full h-40 mb-4 rounded-md bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden relative">
                                                        {urlImagen ? (
                                                            <img
                                                                src={urlImagen}
                                                                alt={`Portada de ${contenedor.nombre}`}
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                loading="lazy"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                    const parent = e.target.parentElement;
                                                                    if (parent && !parent.querySelector('.placeholder-icon')) {
                                                                        const placeholder = document.createElement('div');
                                                                        placeholder.className = 'placeholder-icon absolute inset-0 flex items-center justify-center text-slate-500';
                                                                        placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12"><path d="M7.5 3.75a.75.75 0 00-1.5 0v10.44a3 3 0 00-1.5-.44C3.12 13.75 2 14.87 2 16.25s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5v-8.39l9-3v7.53a3 3 0 00-1.5-.44C13.12 11.75 12 12.87 12 14.25s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5V6.34l-.78.26a.75.75 0 00-.52 1.02l.78.26V3.75a.75.75 0 00-1.5 0v1.61l-7.5-2.5a.75.75 0 00-.78.26z" /></svg>`;
                                                                        parent.appendChild(placeholder);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                             <div className="absolute inset-0 flex items-center justify-center text-slate-500 placeholder-icon">
                                                                <MusicalNoteIcon className="w-12 h-12" />
                                                            </div>
                                                        )}
                                                         <div className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:scale-110">
                                                            <PlayIcon className="w-5 h-5 text-white" />
                                                         </div>
                                                    </div>

                                                    <h2
                                                        className="text-md font-semibold mt-2 mb-1 text-gray-800 dark:text-gray-100 truncate"
                                                        title={contenedor.nombre}
                                                    >
                                                        {contenedor.nombre}
                                                    </h2>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                                        {contenedor.descripcion || 'Sin descripción'}
                                                    </p>
                                                </Link>

                                                <div className="border-t border-gray-200 dark:border-slate-700 p-3 bg-gray-50 dark:bg-slate-800 flex justify-center items-center space-x-2 mt-auto">
                                                    {contenedor.can?.edit && (
                                                        <Link
                                                            // *** Usando ruta playlists.edit ***
                                                            href={route('playlists.edit', contenedor.id)}
                                                            className="p-1.5 text-yellow-500 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md transition-colors duration-150"
                                                            title="Editar Playlist"
                                                        >
                                                           <PencilIcon className="w-4 h-4"/>
                                                        </Link>
                                                    )}
                                                    {contenedor.can?.delete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => manejarEliminar(contenedor.id)}
                                                            disabled={eliminandoId === contenedor.id}
                                                            className="p-1.5 text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:hover:text-red-500"
                                                            title="Eliminar Playlist"
                                                        >
                                                           {eliminandoId === contenedor.id ? (
                                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <TrashIcon className="w-4 h-4"/>
                                                            )}
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
