import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

const obtenerUrlImagen = (item) => {
    if (!item) return null;

    // Intenta obtener la ruta de cualquiera de estos campos
    const imagePath = item.foto_url || item.imagen || item.image_url;

    if (!imagePath) {
        return null; // No hay ruta
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/storage/')) {
        return imagePath;
    } else {
        return `/storage/${imagePath}`;
    }
};

const ImagenCancion = ({ url, titulo, className = "w-10 h-10" }) => {
    const [src, setSrc] = useState(url);
    const [error, setError] = useState(false);

    useEffect(() => {
        setSrc(url);
        setError(false);
    }, [url]);

    const manejarErrorImagen = () => {
        setError(true);
    };

    const placeholder = (
        <div className={`${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
        </div>
    );

    if (error || !src) {
        return placeholder;
    }

    return (
        <img
            src={src}
            alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy"
            onError={manejarErrorImagen}
        />
    );
};

ImagenCancion.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
};


export default function AlbumesShow({ auth, album: albumInicial }) {

    const { flash: mensajeFlash } = usePage().props;
    const pagina = usePage();

    const [album, setAlbum] = useState(albumInicial);
    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const minQueryLength = 2;

    const urlImagenPrincipal = obtenerUrlImagen(album);

    const idsCancionesEnAlbum = useMemo(() =>
        new Set((album?.canciones || []).map(c => c.id)),
        [album?.canciones]
    );

    const buscarCancionesApi = useCallback(async (consulta) => {
        if (!album?.id) return;
        setEstaBuscando(true);
        try {
            const urlBusqueda = route('albumes.songs.search', { album: album.id, query: consulta });
            const respuesta = await fetch(urlBusqueda);
            if (!respuesta.ok) {
                let errorMsg = `La respuesta de red no fue correcta (${respuesta.status})`;
                 try {
                     const errorBody = await respuesta.text();
                     errorMsg += ` - ${errorBody}`;
                 } catch(e) { /* Ignorar */ }
                throw new Error(errorMsg);
            }
            const datos = await respuesta.json();
            setResultadosBusqueda(Array.isArray(datos) ? datos : []);
        } catch (error) {
            console.error("Error al obtener canciones:", error);
            setResultadosBusqueda([]);
        } finally {
            setEstaBuscando(false);
        }
    }, [album?.id]);

    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 300), [buscarCancionesApi]);

    const manejarEliminarCancion = (pivotId) => {
        if (!pivotId || !album?.id) {
            console.error("Error: Faltan datos para eliminar (pivotId, albumId).");
            alert("Error al intentar eliminar la canción. Refresca la página.");
            return;
        }
        router.delete(route('albumes.songs.remove', { album: album.id, pivotId: pivotId }), {
            preserveScroll: true,
            preserveState: false,
            onSuccess: (page) => {
                 if (page.props.album) {
                      setAlbum(page.props.album);
                 }
                 buscarCancionesApi(consultaBusqueda);
            },
            onError: (errores) => {
                console.error("Error al eliminar canción:", errores);
                const errorMsg = errores?.message || errores?.error || 'Error desconocido al eliminar la canción.';
                alert(errorMsg);
            },
        });
    };

    const manejarCambioInputBusqueda = (e) => {
        const consulta = e.target.value;
        setConsultaBusqueda(consulta);
        busquedaDebounced(consulta);
    };

    const manejarAnadirCancion = (idCancion) => {
        if (!album?.id || idsCancionesEnAlbum.has(idCancion)) return;
        setAnadiendoCancionId(idCancion);
        router.post(route('albumes.songs.add', { album: album.id }), {
            cancion_id: idCancion,
        }, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: (page) => {
                 if (page.props.album) {
                    setAlbum(page.props.album);
                 }
                 setResultadosBusqueda(prev => prev.filter(c => c.id !== idCancion));
            },
            onFinish: () => setAnadiendoCancionId(null),
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
                setAnadiendoCancionId(null);
                const errorMsg = errores?.message || errores?.error || 'Error desconocido al añadir la canción.';
                alert(errorMsg);
            },
        });
    };

    useEffect(() => {
        if (album?.id) {
           buscarCancionesApi('');
        }
    }, [buscarCancionesApi, album?.id]);

     useEffect(() => {
         const albumActualizado = pagina.props.album;
         if (albumActualizado && albumActualizado.id === (album?.id || albumInicial?.id) ) {
              if (!Array.isArray(albumActualizado.canciones)) {
                   albumActualizado.canciones = [];
              }
              if (JSON.stringify(albumActualizado) !== JSON.stringify(album)) {
                   setAlbum(albumActualizado);
              }
         } else if (albumInicial && !album) {
              if (!Array.isArray(albumInicial.canciones)) {
                   albumInicial.canciones = [];
              }
              setAlbum(albumInicial);
         }
     }, [pagina.props.album, albumInicial, album]);

      const cancionesFiltradasParaAnadir = useMemo(() => {
           return resultadosBusqueda.filter(cancion => !idsCancionesEnAlbum.has(cancion.id));
       }, [resultadosBusqueda, idsCancionesEnAlbum]);


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Detalles del Álbum: {album?.nombre || 'Cargando...'}
                </h2>
            }
        >
            <Head title={`Álbum: ${album?.nombre || ''}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

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

                            <div className="mb-6">
                                <Link href={route('albumes.index')} className="text-blue-600 dark:text-blue-400 hover:underline">
                                    &larr; Volver a Mis Álbumes
                                </Link>
                            </div>

                            {urlImagenPrincipal ? (
                                <div className="mb-6 flex justify-center">
                                    <img src={urlImagenPrincipal} alt={`Portada de ${album?.nombre}`} className="max-w-sm w-full h-auto rounded-lg shadow-md object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                            ) : ( <div className="mb-6 text-center text-gray-500 dark:text-gray-400">(Sin imagen)</div> )}

                            <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">{album?.nombre}</h1>
                            {(album?.created_at || album?.updated_at) && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-t dark:border-gray-700 pt-4 text-center">
                                    {album.created_at && <p>Creada el: {new Date(album.created_at).toLocaleString()}</p>}
                                    {album.updated_at && album.updated_at !== album.created_at && <p>Última actualización: {new Date(album.updated_at).toLocaleString()}</p>}
                                </div>
                            )}

                            <div className="mb-10">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Canciones en este Álbum ({album?.canciones?.length || 0})</h3>
                                {album?.canciones && Array.isArray(album.canciones) && album.canciones.length > 0 ? (
                                    <ul className="space-y-2">
                                        {album.canciones.map((cancion) => (
                                            <li key={cancion.pivot?.id ?? `fallback-${cancion.id}-${Math.random()}`} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center space-x-3">
                                                <ImagenCancion url={obtenerUrlImagen(cancion)} titulo={cancion.titulo} className="w-10 h-10" />
                                                <span className="text-gray-800 dark:text-gray-200 flex-grow truncate" title={cancion.titulo}>{cancion.titulo}</span>
                                                {album.can?.edit && (
                                                <button
                                                    onClick={() => manejarEliminarCancion(cancion.pivot?.id)}
                                                    disabled={!cancion.pivot?.id}
                                                    className="ml-2 px-3 py-1 text-xs font-semibold rounded-md bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={!cancion.pivot?.id ? "Error" : "Quitar del Álbum"}
                                                >
                                                    Quitar
                                                </button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">Este álbum aún no tiene canciones.</p>
                                )}
                            </div>

                            {album?.can?.edit && (
                                <div className="mt-10 border-t dark:border-gray-700 pt-6">
                                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Añadir Canciones al Álbum</h3>
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Buscar canciones por título..."
                                            value={consultaBusqueda}
                                            onChange={manejarCambioInputBusqueda}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                                            disabled={!album?.id}
                                        />
                                    </div>

                                    {estaBuscando && <p className="text-gray-500 dark:text-gray-400 italic text-center">Buscando...</p>}

                                    {!estaBuscando && (consultaBusqueda.length >= minQueryLength || resultadosBusqueda.length > 0) && cancionesFiltradasParaAnadir.length > 0 && (
                                        <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2 bg-gray-50 dark:bg-gray-700/50">
                                            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                                {consultaBusqueda.length >= minQueryLength ? 'Resultados para añadir:' : 'Canciones Disponibles para añadir:'}
                                            </h4>
                                            <ul>
                                                {cancionesFiltradasParaAnadir.map((cancionEncontrada) => (
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
                                    {!estaBuscando && consultaBusqueda.length >= minQueryLength && cancionesFiltradasParaAnadir.length === 0 && (
                                        <p className="text-gray-500 dark:text-gray-400 italic text-center">No se encontraron canciones nuevas que coincidan.</p>
                                    )}
                                    {!estaBuscando && consultaBusqueda.length < minQueryLength && cancionesFiltradasParaAnadir.length === 0 && resultadosBusqueda.length === 0 && (
                                         <p className="text-gray-500 dark:text-gray-400 italic text-center">No hay canciones disponibles o escribe más para buscar.</p>
                                     )}
                                     {!estaBuscando && consultaBusqueda.length === 0 && resultadosBusqueda.length > 0 && cancionesFiltradasParaAnadir.length === 0 && (
                                          <p className="text-gray-500 dark:text-gray-400 italic text-center">Todas las canciones disponibles ya están en el álbum.</p>
                                      )}
                                </div>
                            )}

                            <div className="mt-8 flex justify-center space-x-3">
                                {album?.can?.edit && (
                                    <Link href={route('albumes.edit', album.id)} className="inline-flex items-center px-4 py-2 bg-yellow-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:border-yellow-700 focus:ring ring-yellow-300 disabled:opacity-25 transition ease-in-out duration-150">
                                        Editar Álbum
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
