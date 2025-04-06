import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Canciones({ canciones }) {
    const { delete: deleteCancion } = useForm();

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
            deleteCancion(route('canciones.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Canciones
                </h2>
            }
        >
            <Head title="Canciones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    <div className="mb-4 flex justify-end">
                    <a
                        href={route('canciones.create')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Crear Canción
                    </a>
                    </div>
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <ul>
                                {canciones.map(cancion => (
                                    <li key={cancion.id} className="border-b py-4">
                                        <div className="flex items-center space-x-4">
                                            {cancion.foto_url && (
                                                <img
                                                    src={cancion.foto_url}
                                                    alt={cancion.titulo}
                                                    className="w-16 h-16 rounded-md object-cover"
                                                />
                                            )}
                                            <div>
                                                <h3 className="text-lg font-semibold">{cancion.titulo}</h3>
                                                <p className="text-sm text-gray-500">Género: {cancion.genero || 'No especificado'}</p>
                                                <p className="text-sm text-gray-500">Duración: {cancion.duracion} segundos</p>
                                                <p className="text-sm text-gray-500">Visualizaciones: {cancion.visualizaciones || 0}</p>
                                                {cancion.archivo_url && (
                                                    <audio controls className="mt-2 w-full">
                                                        <source src={cancion.archivo_url} type="audio/mpeg" />
                                                        Tu navegador no soporta la reproducción de audio.
                                                    </audio>
                                                )}
                                            </div>

                                            {/* Botones de Editar y Eliminar */}
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={route('canciones.edit', cancion.id)}
                                                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                                >
                                                    Editar
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(cancion.id)}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
