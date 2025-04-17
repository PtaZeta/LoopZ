import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

const obtenerUrlImagen = (item) => {
    // Prioriza foto_url si viene directamente en el objeto (canción)
    if (item?.foto_url) { return item.foto_url; }
    // Luego image_url (podría venir de la playlist)
    if (item?.image_url) { return item.image_url; }
    // Luego imagen (path relativo almacenado en DB, para playlist o canción si no hay foto_url)
    if (item && item.imagen) { return `/storage/${item.imagen}`; }
    return null; // Devuelve null si no hay ninguna imagen
};

const ImagenCancion = ({ url, titulo, className = "w-10 h-10" }) => {
    const [src, setSrc] = useState(url);
    const [error, setError] = useState(false);

    // Actualizar src si la url prop cambia y resetear error
    useEffect(() => {
        setSrc(url);
        setError(false);
    }, [url]);

    const manejarErrorImagen = () => {
        setError(true); // Marcar como error para mostrar placeholder
    };

    const placeholder = (
        <div className={`${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
        </div>
    );

    // Si hay error o no hay src inicial, muestra placeholder
    if (error || !src) {
        return placeholder;
    }

    // Intenta mostrar la imagen
    return (
        <img
            src={src}
            alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy"
            onError={manejarErrorImagen} // Llama a manejarErrorImagen si falla la carga
        />
    );
};

ImagenCancion.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export default function PlaylistShow({ auth, playlist: listaReproduccionInicial }) {

    const { flash: mensajeFlash } = usePage().props;
    const pagina = usePage(); // Para obtener props actualizadas por Inertia

    // Estado para la playlist, inicializado con los datos de la prop
    const [listaReproduccion, setListaReproduccion] = useState(listaReproduccionInicial);
    // Estados para la búsqueda
    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    // Estado para feedback visual al añadir canción
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const minQueryLength = 2; // Longitud mínima para búsqueda por título

    // Obtener URL de imagen para la playlist
    const urlImagenPlaylist = obtenerUrlImagen(listaReproduccion);

    // Función para llamar a la API de búsqueda de canciones
    const buscarCancionesApi = useCallback(async (consulta) => {
        // Evitar búsqueda si no hay playlist cargada
        if (!listaReproduccion?.id) return;
        setEstaBuscando(true);
        try {
            const urlBusqueda = route('songs.search', { playlist: listaReproduccion.id, query: consulta });
            const respuesta = await fetch(urlBusqueda);
            if (!respuesta.ok) {
                // Intentar obtener más detalles del error si es posible
                let errorMsg = `La respuesta de red no fue correcta (${respuesta.status})`;
                try {
                     const errorBody = await respuesta.text();
                     errorMsg += ` - ${errorBody}`;
                } catch(e) { /* No hacer nada si no se puede leer el cuerpo */ }
                throw new Error(errorMsg);
            }
            const datos = await respuesta.json();
            setResultadosBusqueda(Array.isArray(datos) ? datos : []);
        } catch (error) {
            console.error("Error al obtener canciones:", error);
            setResultadosBusqueda([]); // Limpiar resultados en caso de error
        } finally {
            setEstaBuscando(false);
        }
    }, [listaReproduccion?.id]); // Depende del ID de la playlist

    // Versión debounced de la búsqueda para input
    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 300), [buscarCancionesApi]);

    // Función para eliminar una instancia específica de canción por su ID de PIVOT
    const manejarEliminarCancion = (pivotId) => {
        if (!pivotId) {
            console.error("Error: No se proporcionó ID de pivot para eliminar.");
            alert("Error al intentar eliminar la canción (sin ID específico). Refresca la página.");
            return;
        }
        router.delete(route('playlists.songs.remove', {
            playlist: listaReproduccion.id,
            pivotId: pivotId // Pasar el ID del pivot
        }), {
            preserveScroll: true,
            preserveState: false, // Forzar recarga parcial para obtener datos actualizados
            onSuccess: (page) => {
                 // Actualizar estado con datos frescos de la página si vienen
                 if (page.props.playlist) {
                     setListaReproduccion(page.props.playlist);
                 }
                 // Refrescar búsqueda por si acaso (aunque ya no depende directamente de la exclusión)
                 buscarCancionesApi(consultaBusqueda);
            },
            onError: (errores) => {
                console.error("Error al eliminar canción:", errores);
                // Mostrar mensaje de error específico si viene en 'errores'
                const errorMsg = errores?.message || errores?.error || 'Error desconocido al eliminar la canción. Revisa la consola.';
                alert(errorMsg);
            },
        });
    };

    // Manejador para el input de búsqueda
    const manejarCambioInputBusqueda = (e) => {
        const consulta = e.target.value;
        setConsultaBusqueda(consulta);
        busquedaDebounced(consulta); // Llama a la búsqueda con debounce
    };

    // Función para añadir canción (permite duplicados)
    const manejarAnadirCancion = (idCancion) => {
        setAnadiendoCancionId(idCancion); // Marcar como "añadiendo"
        router.post(route('playlists.songs.add', listaReproduccion.id), {
            cancion_id: idCancion,
        }, {
            preserveScroll: true,
            preserveState: false, // Forzar recarga parcial
            onSuccess: (page) => {
                // Actualizar estado con datos frescos de la página
                if (page.props.playlist) {
                   setListaReproduccion(page.props.playlist);
                }
                // Ya NO se filtra 'resultadosBusqueda'
           },
            onFinish: () => setAnadiendoCancionId(null), // Quitar estado "añadiendo" al finalizar
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
                setAnadiendoCancionId(null); // Asegurarse de quitar estado "añadiendo"
                const errorMsg = errores?.message || errores?.error || 'Error desconocido al añadir la canción. Revisa la consola.';
                alert(errorMsg);
            },
        });
    };

    // Efecto para la búsqueda inicial cuando el componente monta o cambia la playlist
    useEffect(() => {
        if (listaReproduccion?.id) {
           buscarCancionesApi(''); // Carga inicial de canciones disponibles
        }
    }, [buscarCancionesApi, listaReproduccion?.id]); // Dependencias correctas

    // Efecto para actualizar el estado local de la playlist si cambia en las props de Inertia
    useEffect(() => {
        const playlistActualizada = pagina.props.playlist;
        // Solo actualizar si la prop existe y es diferente a la inicial o al estado actual
        // para evitar bucles innecesarios si la prop no cambia.
        if (playlistActualizada && playlistActualizada.id === (listaReproduccionInicial?.id || listaReproduccion?.id) ) {
             // Asegurarse que 'canciones' sea un array
             if (!Array.isArray(playlistActualizada.canciones)) {
                 playlistActualizada.canciones = [];
             }
             setListaReproduccion(playlistActualizada);
        } else if (listaReproduccionInicial && !listaReproduccion) {
             // Caso inicial si la prop de Inertia aún no ha llegado pero la inicial sí
              if (!Array.isArray(listaReproduccionInicial.canciones)) {
                  listaReproduccionInicial.canciones = [];
              }
              setListaReproduccion(listaReproduccionInicial);
        }
    }, [pagina.props.playlist, listaReproduccionInicial, listaReproduccion]); // Añadida listaReproduccion para comparar


    // Renderizado del componente
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Detalles de: {listaReproduccion?.nombre || 'Cargando Playlist...'}
                </h2>
            }
        >
            <Head title={`Playlist: ${listaReproduccion?.nombre || ''}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                     {/* Mensajes Flash */}
                     {mensajeFlash && mensajeFlash.success && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeFlash.success}
                        </div>
                     )}
                     {mensajeFlash && mensajeFlash.error && (
                         <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md shadow-sm" role="alert">
                             {mensajeFlash.error}
                         </div>
                      )}


                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">

                             {/* Link Volver */}
                             <div className="mb-6">
                                 <Link href={route('playlists.index')} className="text-blue-600 dark:text-blue-400 hover:underline">
                                     &larr; Volver a Mis Playlists
                                 </Link>
                             </div>

                             {/* Imagen, Título, Descripción, Fechas */}
                             {urlImagenPlaylist ? (
                                <div className="mb-6 flex justify-center">
                                    <img src={urlImagenPlaylist} alt={`Portada de ${listaReproduccion.nombre}`} className="max-w-sm w-full h-auto rounded-lg shadow-md object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                    <div className="hidden mb-6 text-center text-gray-500 dark:text-gray-400">(Error al cargar imagen)</div>
                                </div>
                             ) : ( <div className="mb-6 text-center text-gray-500 dark:text-gray-400">(Sin imagen)</div> )}

                             <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">{listaReproduccion?.nombre}</h1>
                             <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-6 text-center"><p>{listaReproduccion?.descripcion}</p></div>
                             {(listaReproduccion?.created_at || listaReproduccion?.updated_at) && (
                                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-t dark:border-gray-700 pt-4 text-center">
                                     {listaReproduccion.created_at && <p>Creada el: {new Date(listaReproduccion.created_at).toLocaleString()}</p>}
                                     {listaReproduccion.updated_at && listaReproduccion.updated_at !== listaReproduccion.created_at && <p>Última actualización: {new Date(listaReproduccion.updated_at).toLocaleString()}</p>}
                                 </div>
                             )}

                             {/* Sección Canciones en la Playlist */}
                            <div className="mb-10">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Canciones en esta Playlist ({listaReproduccion?.canciones?.length || 0})</h3>
                                {listaReproduccion?.canciones && Array.isArray(listaReproduccion.canciones) && listaReproduccion.canciones.length > 0 ? (
                                    <ul className="space-y-2">
                                        {listaReproduccion.canciones.map((cancion) => (
                                            // Usar ID de pivot como key para unicidad en duplicados
                                            <li key={cancion.pivot?.id ?? `fallback-${cancion.id}-${Math.random()}`} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center space-x-3">
                                                <ImagenCancion url={obtenerUrlImagen(cancion)} titulo={cancion.titulo} className="w-10 h-10" />
                                                <span className="text-gray-800 dark:text-gray-200 flex-grow truncate" title={cancion.titulo}>{cancion.titulo}</span>
                                                <button
                                                    onClick={() => manejarEliminarCancion(cancion.pivot?.id)} // Pasar ID de pivot
                                                    disabled={!cancion.pivot?.id} // Deshabilitar si no hay pivot ID (error)
                                                    className="ml-2 px-3 py-1 text-xs font-semibold rounded-md bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={!cancion.pivot?.id ? "Error: No se pudo identificar esta entrada específica" : "Quitar de la playlist"}
                                                >
                                                    Quitar
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">Esta playlist aún no tiene canciones.</p>
                                )}
                            </div>

                            {/* Sección Añadir Canciones */}
                            <div className="mt-10 border-t dark:border-gray-700 pt-6">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Añadir Canciones</h3>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Buscar canciones por título..."
                                        value={consultaBusqueda}
                                        onChange={manejarCambioInputBusqueda}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                                        disabled={!listaReproduccion?.id} // Deshabilitar si no hay playlist cargada
                                    />
                                </div>

                                {estaBuscando && <p className="text-gray-500 dark:text-gray-400 italic text-center">Buscando...</p>}

                                {!estaBuscando && resultadosBusqueda.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2 bg-gray-50 dark:bg-gray-700/50">
                                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                            {consultaBusqueda.length >= minQueryLength ? 'Resultados:' : 'Canciones Disponibles:'}
                                        </h4>
                                        <ul>
                                            {resultadosBusqueda.map((cancionEncontrada) => (
                                                <li key={cancionEncontrada.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded space-x-3">
                                                    <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                                                        <ImagenCancion url={obtenerUrlImagen(cancionEncontrada)} titulo={cancionEncontrada.titulo} className="w-10 h-10" />
                                                        <span className="text-gray-800 dark:text-gray-200 truncate" title={cancionEncontrada.titulo}>{cancionEncontrada.titulo}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => manejarAnadirCancion(cancionEncontrada.id)}
                                                        disabled={anadiendoCancionId === cancionEncontrada.id}
                                                        className={`ml-2 px-3 py-1 text-xs font-semibold rounded-md transition ease-in-out duration-150 flex-shrink-0 ${
                                                            anadiendoCancionId === cancionEncontrada.id
                                                                ? 'bg-indigo-300 text-white cursor-wait dark:bg-indigo-700'
                                                                : 'bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                                                        }`}
                                                    >
                                                        {anadiendoCancionId === cancionEncontrada.id ? 'Añadiendo...' : 'Añadir'}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {/* Mensajes "No se encontraron" / "No hay disponibles" */}
                                {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length === 0 && (
                                     <p className="text-gray-500 dark:text-gray-400 italic text-center">No se encontraron canciones que coincidan.</p>
                                )}
                                {!estaBuscando && consultaBusqueda.length < minQueryLength && resultadosBusqueda.length === 0 && !estaBuscando && (
                                     <p className="text-gray-500 dark:text-gray-400 italic text-center">No hay canciones disponibles para añadir.</p>
                                )}
                            </div>

                             {/* Link Editar Playlist */}
                             <div className="mt-8 flex justify-center space-x-3">
                                {listaReproduccion?.id && auth.user && pagina.props.auth.user.id === (listaReproduccion.user_id || listaReproduccion.usuarios?.[0]?.id) && ( // Verifica si el usuario actual puede editar (ejemplo simple)
                                    <Link href={route('playlists.edit', listaReproduccion.id)} className="inline-flex items-center px-4 py-2 bg-yellow-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:border-yellow-700 focus:ring ring-yellow-300 disabled:opacity-25 transition ease-in-out duration-150">
                                        Editar Playlist
                                    </Link>
                                 )}
                             </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// PropTypes actualizados
PlaylistShow.propTypes = {
    auth: PropTypes.object.isRequired,
    playlist: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string,
        imagen: PropTypes.string,
        image_url: PropTypes.string, // Del accesor
        created_at: PropTypes.string,
        updated_at: PropTypes.string,
        // Añadir user_id si se usa para autorización
        user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        // Añadir usuarios si se usa la relación polimórfica para autorización
        usuarios: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) })),
        // Canciones ahora debe incluir pivot
        canciones: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            titulo: PropTypes.string.isRequired,
            foto_url: PropTypes.string,
            pivot: PropTypes.shape({
                 id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // ID de la tabla pivot
                 // Otros campos pivot que hayas cargado con withPivot()
                 perteneceable_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                 perteneceable_type: PropTypes.string,
                 cancion_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                 created_at: PropTypes.string,
                 updated_at: PropTypes.string,
             })
        })),
    }),
};
