// RUTA: resources/js/Pages/playlists/Index.jsx

import React, { useState } from 'react'; // Necesitamos useState para el estado de eliminación
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Importa tu layout
import { Head, Link, router } from '@inertiajs/react';     // Importa router para la acción de eliminar
import PropTypes from 'prop-types';                      // Sigue siendo bueno tener PropTypes

// Recibe 'auth', 'playlists' y el mensaje flash 'success' como props desde el controlador
export default function PlaylistIndex({ auth, playlists, success: flashSuccess }) {

    // Estado para saber qué botón de eliminar está procesando (opcional, para feedback visual)
    const [deletingId, setDeletingId] = useState(null);

    // Función para manejar la eliminación de una playlist
    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta playlist? Esta acción no se puede deshacer.')) {
            setDeletingId(id); // Marcar como procesando (opcional)
            router.delete(route('playlists.destroy', id), { // Llama a la ruta destroy
                preserveScroll: true, // Mantiene la posición de scroll después de la acción
                onFinish: () => setDeletingId(null), // Limpia el estado de procesamiento al terminar
                // Puedes añadir callbacks onError, onSuccess si necesitas lógica extra
                // onError: () => alert('Hubo un error al eliminar la playlist.'),
            });
        }
    };

    // Helper para obtener la URL de la imagen (considera la opción con accesor/transform)
    const getImageUrl = (playlist) => {
        // Prioriza 'image_url' si tu backend la genera (Opción A o B de la explicación anterior)
        if (playlist.image_url) {
            return playlist.image_url;
        }
        // Si no, construye desde la ruta relativa (Opción C)
        if (playlist.imagen) {
            // Asegúrate que la ruta base '/storage/' sea correcta para tu configuración
            return `/storage/${playlist.imagen}`;
        }
        // Si no hay imagen, devuelve null
        return null;
    };

    return (
        <AuthenticatedLayout
            user={auth.user} // Pasa el usuario autenticado al Layout
            header={
                // Define el encabezado de la página dentro del Layout
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Mis Playlists
                </h2>
            }
        >
            {/* Define el título de la pestaña del navegador */}
            <Head title="Playlists" />

            <div className="py-12"> {/* Padding vertical */}
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8"> {/* Contenedor principal centrado */}

                    {/* Muestra el mensaje Flash de éxito si existe */}
                    {flashSuccess && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {flashSuccess}
                        </div>
                    )}

                    {/* Botón para ir a la página de creación */}
                    <div className="flex justify-end mb-6">
                        <Link
                            href={route('playlists.create')}
                            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                        >
                            Crear Playlist
                        </Link>
                    </div>

                    {/* Contenedor de la lista/grid */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">

                            {/* Comprueba si hay playlists para mostrar */}
                            {!playlists || playlists.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                    No hay playlists para mostrar. ¡Crea una nueva!
                                </p>
                            ) : (
                                /* Grid para las playlists */
                                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                    {/* Itera sobre cada playlist */}
                                    {playlists.map((playlist) => {
                                        const imageUrl = getImageUrl(playlist); // Obtiene la URL correcta
                                        return (
                                            <li
                                                key={playlist.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col text-center overflow-hidden"
                                            >
                                                {/* Contenido principal de la tarjeta (imagen, título, desc) */}
                                                <div className="p-4 flex-grow">
                                                    {/* Muestra la imagen o un placeholder */}
                                                    <div className="w-full h-36 mb-3 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={`Portada de ${playlist.nombre}`}
                                                                className="w-full h-full object-cover" // Usa h-full para llenar el contenedor
                                                                loading="lazy"
                                                                onError={(e) => { e.target.style.display = 'none'; /* Oculta si falla */ }}
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">Sin Imagen</span>
                                                        )}
                                                    </div>

                                                    <h2
                                                        className="text-lg font-semibold mt-2 mb-1 text-gray-800 dark:text-gray-100 truncate"
                                                        title={playlist.nombre}
                                                    >
                                                        {playlist.nombre}
                                                    </h2>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                                        {playlist.descripcion}
                                                    </p>
                                                </div>

                                                {/* Timestamps (opcional, si los pasas desde el controlador) */}
                                                {(playlist.created_at || playlist.updated_at) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 px-4 pb-2">
                                                        {playlist.created_at && <p>Creada: {new Date(playlist.created_at).toLocaleDateString()}</p>}
                                                        {playlist.updated_at && playlist.updated_at !== playlist.created_at && <p>Actualizada: {new Date(playlist.updated_at).toLocaleDateString()}</p>}
                                                    </div>
                                                )}

                                                {/* Pie de la tarjeta con acciones */}
                                                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 flex justify-center items-center space-x-2">
                                                    <Link
                                                        href={route('playlists.edit', playlist.id)} // Enlace a la ruta de edición
                                                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white uppercase bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                                        title="Editar Playlist"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(playlist.id)} // Llama a la función de eliminar
                                                        disabled={deletingId === playlist.id} // Deshabilita mientras elimina esta playlist específica
                                                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white uppercase bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50"
                                                        title="Eliminar Playlist"
                                                    >
                                                        {/* Cambia el texto del botón si está procesando */}
                                                        {deletingId === playlist.id ? 'Borrando...' : 'Eliminar'}
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

// Define los PropTypes para validar las props que recibe el componente
PlaylistIndex.propTypes = {
    auth: PropTypes.object.isRequired,
    playlists: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string.isRequired,
        imagen: PropTypes.string,      // Ruta relativa de la imagen (o null)
        image_url: PropTypes.string,   // URL completa (si se genera en backend, opcional)
        created_at: PropTypes.string,  // Fecha como string (si se pasa)
        updated_at: PropTypes.string,  // Fecha como string (si se pasa)
    })).isRequired,
    success: PropTypes.string, // Mensaje flash opcional de éxito
};