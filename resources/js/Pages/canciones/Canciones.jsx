import React from 'react'; // Asegúrate que React esté importado
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PropTypes from 'prop-types'; // Importa PropTypes si no lo estaba

// --- INICIO: Componente ImagenCancion (copiado de PlaylistShow) ---
const ImagenCancion = ({ url, titulo, className = "w-10 h-10" }) => {
    const placeholder = (
        <div className={`${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
        </div>
    );

    const manejarErrorImagen = (e) => {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = `${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded`;
        placeholderDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>`;
        if(e.target.parentNode) {
            e.target.parentNode.replaceChild(placeholderDiv, e.target);
        }
    };

    return url ? (
        <img
            src={url}
            alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy"
            onError={manejarErrorImagen}
        />
    ) : (
        placeholder
    );
};

ImagenCancion.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
};
// --- FIN: Componente ImagenCancion ---


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
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Canciones
                </h2>
            }
        >
            <Head title="Canciones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">

                    {mensajeExitoSesion && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-100 rounded-md shadow-sm">
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

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {canciones.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400">No hay canciones para mostrar.</p>
                            ) : (
                                <ul className="space-y-6">
                                    {canciones.map(cancion => (
                                        <li key={cancion.id} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
                                            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">

                                                {/* Columna Izquierda: Imagen (Usando ImagenCancion) */}
                                                <div className="flex-shrink-0 mb-4 md:mb-0">
                                                    {/* Enlace opcional alrededor de la imagen si quieres que lleve a detalles */}
                                                    <Link href={route('canciones.show', cancion.id)} title="Ver Detalles">
                                                        <ImagenCancion
                                                            url={cancion.foto_url}
                                                            titulo={cancion.titulo}
                                                            className="w-24 h-24 md:w-32 md:h-32 rounded-md object-cover border border-gray-100 dark:border-gray-600" // Ajusta clases si es necesario
                                                        />
                                                    </Link>
                                                </div>


                                                {/* Columna Central: Detalles y Audio */}
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate mb-1">{cancion.titulo}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                        <span className="font-medium">Género:</span> {cancion.genero || 'No especificado'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                        <span className="font-medium">Duración:</span> {cancion.duracion ? `${cancion.duracion} seg.` : 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                        <span className="font-medium">Visualizaciones:</span> {cancion.visualizaciones || 0}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                        <span className="font-medium">Artista(s):</span>
                                                        {' '}
                                                        {cancion.usuarios && cancion.usuarios.length > 0
                                                            ? cancion.usuarios.map(user => user.name).join(', ')
                                                            : ' No asignado'}
                                                    </p>

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

// Añadir PropTypes si no estaban
Canciones.propTypes = {
    auth: PropTypes.object.isRequired,
    canciones: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        titulo: PropTypes.string.isRequired,
        genero: PropTypes.string,
        duracion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        visualizaciones: PropTypes.number,
        foto_url: PropTypes.string, // Espera la URL de la foto
        archivo_url: PropTypes.string, // Espera la URL del audio
        usuarios: PropTypes.arrayOf(PropTypes.shape({ // Asume que 'usuarios' es la relación para artistas
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
        })),
    })).isRequired,
    success: PropTypes.string, // Para el mensaje flash
};

