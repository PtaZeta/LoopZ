import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { MusicalNoteIcon, TrashIcon, PlayIcon, PencilIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/solid';

const obtenerUrlImagen = (item) => {
    if (!item) return null;
    if (item.imagen) {
        return item.imagen.startsWith('http') ? item.imagen : `/storage/${item.imagen}`;
    }
    if (item?.foto_url) return item.foto_url;
    if (item?.image_url) return item.image_url;
    return null;
};

const ImagenItem = ({ url, titulo, className = "w-10 h-10", iconoFallback }) => {
    const [src, setSrc] = useState(url);
    const [error, setError] = useState(false);

    useEffect(() => {
        setSrc(url);
        setError(false);
    }, [url]);

    const manejarErrorImagen = () => setError(true);

    if (error || !src) {
        return (
            <div className={`${className} bg-slate-700 flex items-center justify-center text-slate-500 rounded`}>
                {iconoFallback || (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    </svg>
                )}
            </div>
        );
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

ImagenItem.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
    iconoFallback: PropTypes.node,
};

export default function ContenedorShow({ auth, contenedor: contenedorInicial }) {

    const { flash: mensajeFlash } = usePage().props;
    const pagina = usePage();

    const [contenedor, setContenedor] = useState(contenedorInicial);
    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const minQueryLength = 2;

    const urlImagenContenedor = obtenerUrlImagen(contenedor);

    const buscarCancionesApi = useCallback(async (consulta) => {
        if (!contenedor?.id) return;
        setEstaBuscando(true);
        try {
            const urlBusqueda = route('eps.songs.search', { contenedor: contenedor.id, query: consulta });
            const respuesta = await fetch(urlBusqueda);
            if (!respuesta.ok) {
                let errorMsg = `La respuesta de red no fue correcta (${respuesta.status})`;
                try {
                    const errorBody = await respuesta.text();
                    errorMsg += ` - ${errorBody}`;
                } catch(e) { }
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
    }, [contenedor?.id]);

    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 300), [buscarCancionesApi]);

    const manejarEliminarCancion = (pivotId) => {
        if (!pivotId) {
            console.error("Error: No se proporcionó ID de pivot para eliminar.");
            alert("Error al intentar eliminar la canción (sin ID específico). Refresca la página.");
            return;
        }
        router.delete(route('eps.songs.remove', {
            contenedor: contenedor.id,
            pivotId: pivotId
        }), {
            preserveScroll: true,
            preserveState: false,
            onSuccess: (page) => {
                 if (page.props.contenedor) {
                     setContenedor(page.props.contenedor);
                 }
            },
            onError: (errores) => {
                console.error("Error al eliminar canción:", errores);
                const errorMsg = errores?.message || errores?.error || 'Error desconocido al eliminar la canción. Revisa la consola.';
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
        setAnadiendoCancionId(idCancion);
        router.post(route('eps.songs.add', contenedor.id), {
            cancion_id: idCancion,
        }, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: (page) => {
                if (page.props.contenedor) {
                   setContenedor(page.props.contenedor);
                }
           },
            onFinish: () => setAnadiendoCancionId(null),
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
                setAnadiendoCancionId(null);
                const errorMsg = errores?.message || errores?.error || 'Error desconocido al añadir la canción. Revisa la consola.';
                alert(errorMsg);
            },
        });
    };

    useEffect(() => {
        if (contenedor?.id) {
           buscarCancionesApi('');
        }
    }, [buscarCancionesApi, contenedor?.id]);

     useEffect(() => {
        const contenedorActualizado = pagina.props.contenedor;
        if (contenedorActualizado && contenedorActualizado.id === (contenedorInicial?.id || contenedor?.id) ) {
             if (!Array.isArray(contenedorActualizado.canciones)) {
                 contenedorActualizado.canciones = [];
             }
             setContenedor(contenedorActualizado);
        } else if (contenedorInicial && !contenedor) {
            if (!Array.isArray(contenedorInicial.canciones)) {
                contenedorInicial.canciones = [];
            }
            setContenedor(contenedorInicial);
        }
    }, [pagina.props.contenedor, contenedorInicial, contenedor]);

    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(segundos % 60).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const artistas = contenedor?.usuarios && contenedor.usuarios.length > 0
        ? contenedor.usuarios.map(user => user.name).join(', ')
        : 'Desconocido';

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-200">
                        {contenedor?.nombre || 'Detalles de EP'}
                    </h2>
                    {contenedor?.can?.edit && (
                        <Link
                            href={route('eps.edit', contenedor.id)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:from-blue-600 hover:to-pink-600 active:from-blue-700 active:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition ease-in-out duration-150 shadow-md"
                            title="Editar"
                        >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={contenedor?.nombre || 'Detalles de EP'} />

            <div className={`py-12 min-h-screen`}>
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="md:flex md:items-end md:space-x-8 p-6 md:p-10 bg-transparent">
                        <div className="flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64 mb-6 md:mb-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700/50">
                            {urlImagenContenedor ? (
                                <img
                                    src={urlImagenContenedor}
                                    alt={`Cover de ${contenedor?.nombre}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                    <MusicalNoteIcon className="h-24 w-24" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-medium uppercase tracking-wider text-blue-400 mb-1">EP</p>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-4 text-white break-words shadow-sm">
                                {contenedor?.nombre}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center space-x-3 text-sm text-gray-300 mb-8">
                                <span className="font-semibold">{contenedor?.usuario?.name ?? 'Usuario'}</span>
                                {artistas !== 'Desconocido' && <span className="text-pink-400 font-semibold">• {artistas}</span>}
                                <span className="hidden sm:inline">• {contenedor?.canciones_count ?? contenedor?.canciones?.length ?? 0} canciones</span>
                                <span className="hidden md:inline">• {formatearDuracion(contenedor?.canciones?.reduce((sum, song) => sum + (song.duracion || 0), 0))}</span>
                            </div>

                            {contenedor?.canciones?.length > 0 ? (
                                <div className='mb-8'>

                                </div>
                            ) : null}

                             <div className="flex items-center justify-center md:justify-start space-x-4">
                                 <button
                                     onClick={() => alert('Funcionalidad de reproducción no implementada')}
                                     className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full font-semibold text-white shadow-lg hover:scale-105 transform transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                                     title="Reproducir"
                                     disabled={!contenedor?.canciones || contenedor.canciones.length === 0}
                                 >
                                      <PlayIcon className="h-7 w-7" />
                                 </button>
                                 <Link
                                     href={route('eps.index')}
                                     className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-widest shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                 >
                                      <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                                     Volver
                                 </Link>
                             </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm shadow-inner rounded-lg">
                         <h3 className="text-xl font-semibold mb-4 text-gray-100">Canciones en esta EP ({contenedor?.canciones?.length || 0})</h3>
                         {contenedor?.canciones && Array.isArray(contenedor.canciones) && contenedor.canciones.length > 0 ? (
                             <ul className="space-y-2">
                                  {contenedor.canciones.map((cancion) => (
                                      <li key={cancion.pivot?.id ?? `fallback-${cancion.id}-${Math.random()}`} className="p-2 bg-slate-700/60 rounded-md flex items-center space-x-3 hover:bg-slate-600/80 transition-colors duration-150">
                                          <ImagenItem url={obtenerUrlImagen(cancion)} titulo={cancion.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                          <span className="text-gray-200 flex-grow truncate" title={cancion.titulo}>{cancion.titulo}</span>
                                          {contenedor.can?.edit && (
                                          <button
                                              onClick={() => manejarEliminarCancion(cancion.pivot?.id)}
                                              disabled={!cancion.pivot?.id}
                                              className="ml-2 p-1.5 text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:hover:text-red-500"
                                              title={!cancion.pivot?.id ? "Error: No se pudo identificar esta entrada específica" : "Quitar de la ep"}
                                          >
                                              <TrashIcon className="w-4 h-4"/>
                                          </button>
                                          )}
                                      </li>
                                  ))}
                             </ul>
                          ) : (
                               <p className="text-gray-400 italic">Esta ep aún no tiene canciones.</p>
                          )}
                     </div>

                    {contenedor?.can?.edit && (
                         <div className="mt-10 p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm shadow-inner rounded-lg">
                              <h3 className="text-xl font-semibold mb-4 text-gray-100">Añadir Canciones</h3>
                              <div className="mb-4">
                                  <input
                                      type="text"
                                      placeholder="Buscar canciones por título..."
                                      value={consultaBusqueda}
                                      onChange={manejarCambioInputBusqueda}
                                      className="w-full px-4 py-2 border border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-transparent bg-slate-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-slate-800"
                                      disabled={!contenedor?.id}
                                  />
                              </div>

                              {estaBuscando && <p className="text-gray-400 italic text-center">Buscando...</p>}

                              {!estaBuscando && resultadosBusqueda.length > 0 && (
                                  <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-md p-2 space-y-2 bg-slate-700/50">
                                       <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                           {consultaBusqueda.length >= minQueryLength ? 'Resultados:' : 'Canciones Disponibles:'}
                                       </h4>
                                       <ul>
                                           {resultadosBusqueda.map((cancionEncontrada) => (
                                               <li key={cancionEncontrada.id} className="flex items-center justify-between p-2 hover:bg-slate-600 rounded space-x-3">
                                                   <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                                                        <ImagenItem url={obtenerUrlImagen(cancionEncontrada)} titulo={cancionEncontrada.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                                        <span className="text-gray-200 truncate" title={cancionEncontrada.titulo}>{cancionEncontrada.titulo}</span>
                                                   </div>
                                                   <button
                                                        onClick={() => manejarAnadirCancion(cancionEncontrada.id)}
                                                        disabled={anadiendoCancionId === cancionEncontrada.id}
                                                        className={`ml-2 px-3 py-1 text-xs font-semibold rounded-md transition ease-in-out duration-150 flex-shrink-0 ${
                                                             anadiendoCancionId === cancionEncontrada.id
                                                                 ? 'bg-indigo-700 text-white cursor-wait'
                                                                 : 'bg-gradient-to-r from-blue-500 to-pink-500 text-white hover:from-blue-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800'
                                                        }`}
                                                   >
                                                        {anadiendoCancionId === cancionEncontrada.id ? 'Añadiendo...' : 'Añadir'}
                                                   </button>
                                               </li>
                                           ))}
                                       </ul>
                                  </div>
                               )}
                              {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length === 0 && (
                                  <p className="text-gray-400 italic text-center">No se encontraron canciones que coincidan.</p>
                               )}
                              {!estaBuscando && consultaBusqueda.length < minQueryLength && resultadosBusqueda.length === 0 && !estaBuscando && (
                                  <p className="text-gray-400 italic text-center">No hay canciones disponibles para añadir.</p>
                               )}
                         </div>
                     )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
