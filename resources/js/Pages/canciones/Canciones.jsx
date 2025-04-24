import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import Cancion from '@/Components/Cancion'; // Asegúrate que la ruta y nombre son correctos

export default function Canciones({ auth, canciones, success: mensajeExitoSesion }) {
    const { delete: eliminarCancion, processing } = useForm();

    const manejarEliminar = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
            eliminarCancion(route('canciones.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    // formatDuration function can stay here or be moved to a shared utils file if preferred
    const formatDuration = (seconds) => {
        if (!seconds && seconds !== 0) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Canciones
                </h2>
            }
        >
            <Head title="Canciones" />

            <div className="py-12 bg-gray-100 dark:bg-gray-900 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {mensajeExitoSesion && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-100 rounded-md shadow-sm">
                            {mensajeExitoSesion}
                        </div>
                    )}

                    <div className="mb-6 flex justify-end">
                        <Link
                            href={route('canciones.create')}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:from-blue-600 hover:to-pink-600 active:from-blue-700 active:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition ease-in-out duration-150 shadow-md"
                        >
                            Crear Nueva Canción
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {canciones.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                                    No hay canciones para mostrar. ¡Crea una nueva!
                                </p>
                            ) : (
                                <ul className="space-y-6">
                                    {canciones.map(cancion => (
                                        <Cancion
                                            key={cancion.id}
                                            cancion={cancion}
                                            onDelete={manejarEliminar}
                                            processing={processing}
                                        />
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
