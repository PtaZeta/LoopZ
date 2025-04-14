// resources/js/Pages/playlists/Create.jsx

import React from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
// Probablemente quieras un layout autenticado si esto requiere login
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function PlaylistCreate({ auth }) { // Recibe 'auth' si usas AuthenticatedLayout
    // Inicializa el estado del formulario con useForm de Inertia
    const { data, setData, post, processing, errors, progress, reset } = useForm({
        nombre: '',
        descripcion: '',
        imagen: null, // Inicializa la imagen como null
    });

    // Manejador para el envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault(); // Previene el envío HTML estándar
        // Envía el formulario al endpoint 'playlists.store' (asegúrate que exista en web.php)
        // Inertia manejará automáticamente el enctype y el envío como multipart/form-data
        // si 'data.imagen' contiene un objeto File.
        post(route('playlists.store'), {
             // Opciones de Inertia (opcional)
             preserveScroll: true, // Mantiene la posición de scroll si hay errores
             onSuccess: () => reset(), // Limpia el formulario si el envío es exitoso
             // onError: (errors) => { console.log(errors) } // Manejo de errores adicional
             // onProgress: progress => { console.log(progress) } // Manejo de progreso adicional
        });
    };

    return (
        // Usar un Layout (opcional pero recomendado)
        // Ajusta el Layout según tu estructura (AuthenticatedLayout, GuestLayout, etc.)
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Crear Nueva Playlist</h2>}
        >
            <Head title="Crear Playlist" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

                            {/* Formulario */}
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Campo Nombre */}
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre de la Playlist
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm"
                                        required
                                    />
                                    {/* Muestra error de validación si existe */}
                                    {errors.nombre && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
                                    )}
                                </div>

                                {/* Campo Descripción */}
                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        id="descripcion"
                                        rows="3"
                                        value={data.descripcion}
                                        onChange={(e) => setData('descripcion', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm"
                                        required
                                    ></textarea>
                                    {errors.descripcion && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion}</p>
                                    )}
                                </div>

                                {/* Campo Imagen */}
                                <div>
                                    <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Imagen de Portada (Opcional)
                                    </label>
                                    <input
                                        type="file"
                                        id="imagen"
                                        accept="image/*" // Acepta solo imágenes
                                        onChange={(e) => setData('imagen', e.target.files[0])} // Importante: Pasa el objeto File
                                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-indigo-50 dark:file:bg-indigo-900
                                            file:text-indigo-700 dark:file:text-indigo-300
                                            hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800
                                            dark:bg-gray-700 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    />
                                    {/* Indicador de progreso de subida (si hay archivo) */}
                                    {progress && data.imagen && (
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    )}
                                    {errors.imagen && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.imagen}</p>
                                    )}
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex items-center justify-end space-x-4 pt-4">
                                    <Link
                                        href={route('playlists.index')} // Asume ruta index existe
                                        className="inline-flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-gray-700 dark:text-gray-200 uppercase tracking-widest hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:border-gray-500 focus:ring focus:ring-gray-300 dark:focus:ring-gray-700 disabled:opacity-25 transition"
                                        as="button" // Renderiza como botón pero usa Link para navegación SPA
                                        disabled={processing} // Deshabilita mientras procesa
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring focus:ring-blue-300 disabled:opacity-25 transition"
                                        disabled={processing} // Deshabilita mientras procesa
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Playlist'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default PlaylistCreate;