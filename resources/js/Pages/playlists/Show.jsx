import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce'; // O import { debounce } from 'lodash';

const obtenerUrlImagen = (lista) => {
    if (lista.image_url) { return lista.image_url; }
    if (lista.imagen) { return `/storage/${lista.imagen}`; }
    return null;
};

export default function PlaylistShow({ auth, playlist: listaReproduccionInicial }) {

    const { flash: mensajeFlash } = usePage().props;

    const [listaReproduccion, setListaReproduccion] = useState(listaReproduccionInicial);
    const urlImagen = obtenerUrlImagen(listaReproduccion);

    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const minQueryLength = 2; // Para lógica de UI


    const buscarCancionesApi = async (consulta) => {
        // Ya no hay chequeo de longitud mínima aquí, el backend decide
        setEstaBuscando(true);
        try {
            const respuesta = await fetch(route('songs.search', { query: consulta }));
            if (!respuesta.ok) {
                throw new Error('La respuesta de red no fue correcta');
            }
            const datos = await respuesta.json();
            setResultadosBusqueda(datos);
        } catch (error) {
            console.error("Error al obtener canciones:", error);
            setResultadosBusqueda([]);
        } finally {
            setEstaBuscando(false);
        }
    };

    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 300), []);

    const manejarCambioInputBusqueda = (e) => {
        const consulta = e.target.value;
        setConsultaBusqueda(consulta);
        // Llama a la búsqueda (debounced) sin importar la longitud.
        // El backend devolverá todos los resultados si es corta.
        busquedaDebounced(consulta);
    };

    const manejarAnadirCancion = (idCancion) => {
        setAnadiendoCancionId(idCancion);
        router.post(route('playlists.songs.add', listaReproduccion.id), {
            cancion_id: idCancion,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setAnadiendoCancionId(null);
                 // Opcional: podrías querer recargar la lista inicial después de añadir
                 // buscarCancionesApi(''); // Descomenta si quieres refrescar la lista "disponible"
            },
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
                alert('Error al añadir la canción. Revisa la consola.');
            },
        });
    };

    // Efecto para cargar la lista inicial de canciones al montar el componente
    useEffect(() => {
        buscarCancionesApi(''); // Llama con consulta vacía para obtener la lista inicial
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    // Efecto para actualizar la lista local si la prop cambia (tras redirect)
    useEffect(() => {
        setListaReproduccion(listaReproduccionInicial);
    }, [listaReproduccionInicial]);


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Detalles de: {listaReproduccion.nombre}
                </h2>
            }
        >
            <Head title={`Playlist: ${listaReproduccion.nombre}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                     {mensajeFlash && mensajeFlash.success && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeFlash.success}
                        </div>
                     )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">

                            {/* ... (Link Volver, Imagen, Título, Descripción, Timestamps) ... */}
                             <div className="mb-6">
                                 <Link href={route('playlists.index')} className="text-blue-600 dark:text-blue-400 hover:underline">
                                     &larr; Volver a Mis Playlists
                                 </Link>
                             </div>
                             {urlImagen && ( <div className="mb-6 flex justify-center"> <img src={urlImagen} alt={`Portada de ${listaReproduccion.nombre}`} className="max-w-sm w-full h-auto rounded-lg shadow-md object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> </div> )}
                             {!urlImagen && ( <div className="mb-6 text-center text-gray-500 dark:text-gray-400">(Sin imagen)</div> )}
                             <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">{listaReproduccion.nombre}</h1>
                             <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-6 text-center"><p>{listaReproduccion.descripcion}</p></div>
                             {(listaReproduccion.created_at || listaReproduccion.updated_at) && (
                                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-t dark:border-gray-700 pt-4 text-center">
                                     {listaReproduccion.created_at && <p>Creada el: {new Date(listaReproduccion.created_at).toLocaleString()}</p>}
                                     {listaReproduccion.updated_at && listaReproduccion.updated_at !== listaReproduccion.created_at && <p>Última actualización: {new Date(listaReproduccion.updated_at).toLocaleString()}</p>}
                                 </div>
                             )}


                            {/* --- Canciones en la Playlist --- */}
                            <div className="mb-10">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Canciones en esta Playlist</h3>
                                {listaReproduccion.canciones && listaReproduccion.canciones.length > 0 ? (
                                    <ul className="space-y-2">
                                        {listaReproduccion.canciones.map((cancion) => (
                                            <li key={cancion.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                                                <span className="text-gray-800 dark:text-gray-200">{cancion.titulo}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">Esta playlist aún no tiene canciones.</p>
                                )}
                            </div>

                            {/* --- Buscador y Añadir Canciones --- */}
                            <div className="mt-10 border-t dark:border-gray-700 pt-6">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Añadir Canciones</h3>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Buscar canciones por título..."
                                        value={consultaBusqueda}
                                        onChange={manejarCambioInputBusqueda}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                                    />
                                </div>

                                {estaBuscando && <p className="text-gray-500 dark:text-gray-400 italic">Buscando...</p>}

                                {/* Lógica de visualización de resultados / canciones disponibles */}
                                {!estaBuscando && resultadosBusqueda.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2 bg-gray-50 dark:bg-gray-700/50">
                                        {/* Cambia el título según si hay búsqueda activa o no */}
                                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                            {consultaBusqueda.length >= minQueryLength ? 'Resultados:' : 'Canciones Disponibles:'}
                                        </h4>
                                        <ul>
                                            {resultadosBusqueda.map((cancionEncontrada) => (
                                                <li key={cancionEncontrada.id} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                                                    <span className="text-gray-800 dark:text-gray-200">{cancionEncontrada.titulo}</span>
                                                    <button
                                                        onClick={() => manejarAnadirCancion(cancionEncontrada.id)}
                                                        disabled={anadiendoCancionId === cancionEncontrada.id || listaReproduccion.canciones?.some(c => c.id === cancionEncontrada.id)}
                                                        className={`ml-4 px-3 py-1 text-xs font-semibold rounded-md transition ease-in-out duration-150 ${
                                                            listaReproduccion.canciones?.some(c => c.id === cancionEncontrada.id)
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                                                : anadiendoCancionId === cancionEncontrada.id
                                                                    ? 'bg-indigo-300 text-white cursor-wait dark:bg-indigo-700'
                                                                    : 'bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                                                        }`}
                                                    >
                                                        {listaReproduccion.canciones?.some(c => c.id === cancionEncontrada.id) ? 'Añadida' : (anadiendoCancionId === cancionEncontrada.id ? 'Añadiendo...' : 'Añadir')}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Mensaje "No se encontraron" solo si se buscó activamente */}
                                {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length === 0 && (
                                     <p className="text-gray-500 dark:text-gray-400 italic">No se encontraron canciones que coincidan.</p>
                                )}

                                 {/* Mensaje si la lista inicial está vacía */}
                                 {!estaBuscando && consultaBusqueda.length < minQueryLength && resultadosBusqueda.length === 0 && (
                                     <p className="text-gray-500 dark:text-gray-400 italic">No hay canciones disponibles para añadir.</p>
                                )}
                            </div>

                            {/* ... (Botón Editar) ... */}
                             <div className="mt-8 flex justify-center space-x-3">
                                 <Link href={route('playlists.edit', listaReproduccion.id)} className="inline-flex items-center px-4 py-2 bg-yellow-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:border-yellow-700 focus:ring ring-yellow-300 disabled:opacity-25 transition ease-in-out duration-150">
                                     Editar Playlist
                                 </Link>
                             </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

PlaylistShow.propTypes = {
    auth: PropTypes.object.isRequired,
    playlist: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string.isRequired,
        imagen: PropTypes.string,
        image_url: PropTypes.string,
        created_at: PropTypes.string,
        updated_at: PropTypes.string,
        canciones: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            titulo: PropTypes.string.isRequired,
        })),
    }).isRequired,
};
