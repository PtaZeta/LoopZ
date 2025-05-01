import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import {
    MusicalNoteIcon,
    PlayIcon,
    PencilIcon,
    ArrowUturnLeftIcon,
    HeartIcon as HeartIconOutline
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

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
            src={src} alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy" onError={manejarErrorImagen}
        />
    );
};

ImagenItem.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
    iconoFallback: PropTypes.node,
};

const getTipoNombreMayuscula = (tipo) => {
    if (!tipo) return 'Elemento';
    switch (tipo) {
        case 'album': return 'Álbum';
        case 'playlist': return 'Playlist';
        case 'ep': return 'EP';
        case 'single': return 'Single';
        case 'loopz': return 'LoopZ';
        default: return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }
};

const getResourceRouteBase = (tipo) => {
    switch (tipo) {
        case 'album': return 'albumes';
        case 'playlist': return 'playlists';
        case 'ep': return 'eps';
        case 'single': return 'singles';
        case 'loopz': return 'loopzs';
        default: return `${tipo}s`;
    }
};


export default function ContenedorShow({ auth, contenedor: contenedorInicial }) {

    const pagina = usePage();
    const [contenedor, setContenedor] = useState(contenedorInicial);
    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const minQueryLength = 2;

    const urlImagenContenedor = obtenerUrlImagen(contenedor);
    const tipoContenedor = contenedor?.tipo || 'album';
    const tipoNombreMayuscula = getTipoNombreMayuscula(tipoContenedor);
    const rutaBase = getResourceRouteBase(tipoContenedor);

    const buscarCancionesApi = useCallback(async (consulta) => {
      if (!contenedor?.id) return;
      setEstaBuscando(true);
      try {
        const nombreRutaBusqueda = `${rutaBase}.songs.search`;
        const urlBusqueda = window.route(nombreRutaBusqueda, { contenedor: contenedor.id, query: consulta });
        const respuesta = await fetch(urlBusqueda, {
             headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        if (!respuesta.ok) {
          let errorMsg = `La respuesta de red no fue correcta (${respuesta.status})`;
          try { const errorBody = await respuesta.text(); errorMsg += ` - ${errorBody}`; } catch (e) {}
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
    }, [contenedor?.id, rutaBase]);

    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 300), [buscarCancionesApi]);

    const manejarCambioInputBusqueda = (e) => {
      const consulta = e.target.value;
      setConsultaBusqueda(consulta);
      busquedaDebounced(consulta);
    };

    const manejarAnadirCancion = (idCancion) => {
      setAnadiendoCancionId(idCancion);
      const nombreRutaAdd = `${rutaBase}.songs.add`;
      router.post(route(nombreRutaAdd, contenedor.id), {
        cancion_id: idCancion,
      }, {
        preserveScroll: true,
        preserveState: false,
        onSuccess: (page) => {
          if (page.props.contenedor) {
            setContenedor(page.props.contenedor);
          }
           setResultadosBusqueda(prev => prev.filter(song => song.id !== idCancion));
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
             buscarCancionesApi(consultaBusqueda);
        }
     }, [buscarCancionesApi, contenedor?.id]);


    useEffect(() => {
        const contenedorActualizado = pagina.props.contenedor;
        if (contenedorActualizado && contenedorActualizado.id === (contenedorInicial?.id || contenedor?.id)) {
            if (!Array.isArray(contenedorActualizado.canciones)) {
                 contenedorActualizado.canciones = [];
            }
             contenedorActualizado.canciones.forEach(c => {
                 if (typeof c.is_in_user_loopz === 'undefined') {
                    c.is_in_user_loopz = false;
                 }
             });
            setContenedor(contenedorActualizado);
        } else if (contenedorInicial && !contenedor) {
             if (!Array.isArray(contenedorInicial.canciones)) { contenedorInicial.canciones = []; }
              contenedorInicial.canciones.forEach(c => {
                  if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false;
              });
             setContenedor(contenedorInicial);
        }
    }, [pagina.props.contenedor, contenedorInicial]);


    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(Math.floor(segundos % 60)).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const artistas = contenedor?.usuarios && contenedor.usuarios.length > 0
        ? contenedor.usuarios.map(user => user.name).join(', ')
        : 'Desconocido';

    const nombreRutaEdit = `${rutaBase}.edit`;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-200 truncate pr-4">
                        {contenedor?.nombre || `Detalles de ${tipoNombreMayuscula}`}
                    </h2>
                    {contenedor?.can?.edit && (
                        <Link
                            href={route(nombreRutaEdit, contenedor.id)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:from-blue-600 hover:to-pink-600 active:from-blue-700 active:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition ease-in-out duration-150 shadow-md flex-shrink-0"
                            title={`Editar ${tipoNombreMayuscula}`}
                        >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Editar
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={contenedor?.nombre || `Detalles de ${tipoNombreMayuscula}`} />

            <div className={`py-12 min-h-screen`}>
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
                    <div className="md:flex md:items-end md:space-x-8 p-6 md:p-10 bg-transparent">
                        <div className="flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64 mb-6 md:mb-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-4 border-slate-700/50">
                            {urlImagenContenedor ? (
                                <img src={urlImagenContenedor} alt={`Cover de ${contenedor?.nombre}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                    <MusicalNoteIcon className="h-24 w-24" />
                                </div>
                            )}
                        </div>

                        <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-medium uppercase tracking-wider text-blue-400 mb-1">{tipoNombreMayuscula}</p>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-4 text-white break-words shadow-sm">
                                {contenedor?.nombre}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start items-center space-x-3 text-sm text-gray-300 mb-8">
                                {contenedor?.usuarios?.[0]?.name && <span className="font-semibold">{contenedor.usuarios[0].name}</span>}
                                {artistas !== 'Desconocido' && artistas !== contenedor?.usuarios?.[0]?.name && <span className="text-pink-400 font-semibold">• {artistas}</span>}
                                <span className="hidden sm:inline">• {contenedor?.canciones_count ?? contenedor?.canciones?.length ?? 0} canciones</span>
                                <span className="hidden md:inline">• {formatearDuracion(contenedor?.canciones?.reduce((sum, song) => sum + (song.duracion || 0), 0))}</span>
                            </div>

                            <div className="flex items-center justify-center md:justify-start space-x-4">
                                <button
                                    onClick={() => alert('Funcionalidad de reproducción no implementada')}
                                    className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full font-semibold text-white shadow-lg hover:scale-105 transform transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
                                    title="Reproducir"
                                    disabled={!contenedor?.canciones || contenedor.canciones.length === 0}
                                >
                                    <PlayIcon className="h-7 w-7" />
                                </button>
                                <button onClick={() => window.history.back()} className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-widest shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150">
                                    <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />Volver
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm shadow-inner rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 text-gray-100">Canciones en est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula} ({contenedor?.canciones?.length || 0})</h3>
                        {contenedor?.canciones && Array.isArray(contenedor.canciones) && contenedor.canciones.length > 0 ? (
                            <ul className="space-y-2">
                                {contenedor.canciones.map((cancion) => (
                                    <li key={cancion.pivot?.id ?? `fallback-${cancion.id}-${Math.random()}`} className="p-2 bg-slate-700/60 rounded-md flex items-center space-x-3 hover:bg-slate-600/80 transition-colors duration-150">
                                        <ImagenItem url={obtenerUrlImagen(cancion)} titulo={cancion.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                        <span className="text-gray-200 flex-grow truncate" title={cancion.titulo}>{cancion.titulo}</span>
                                        <span className="text-gray-400 text-xs pr-2 hidden sm:inline">{formatearDuracion(cancion.duracion)}</span>
                                        <Link
                                            href={route('cancion.loopz', { cancion: cancion.id })}
                                            className="p-1 text-gray-400 hover:text-pink-500 focus:outline-none flex-shrink-0"
                                            title={cancion.is_in_user_loopz ? "Gestionar en LoopZ" : "Añadir a LoopZ"}
                                            preserveScroll
                                            preserveState={false}
                                        >
                                            {cancion.is_in_user_loopz ? (
                                                <HeartIconSolid className="h-5 w-5 text-pink-500" />
                                            ) : (
                                                <HeartIconOutline className="h-5 w-5" />
                                            )}
                                        </Link>
                                        {tipoContenedor !== 'loopz' && contenedor?.can?.edit && (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`¿Quitar "${cancion.titulo}" de este ${tipoNombreMayuscula}?`)) {
                                                         const nombreRutaRemove = `${rutaBase}.songs.remove`;
                                                         if(cancion.pivot?.id) {
                                                             router.delete(route(nombreRutaRemove, { contenedor: contenedor.id, pivotId: cancion.pivot.id }), {
                                                                  preserveScroll: true,
                                                                  preserveState: false,
                                                             });
                                                         } else {
                                                            console.warn("No se encontró pivotId para eliminar la canción.");
                                                         }
                                                    }
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 focus:outline-none flex-shrink-0"
                                                title={`Quitar de este ${tipoNombreMayuscula}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic">Est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula} aún no tiene canciones.</p>
                        )}
                    </div>

                     {contenedor?.can?.edit && tipoContenedor !== 'loopz' && (
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
                                        {resultadosBusqueda.map((c) => (
                                            <li key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-600 rounded space-x-3">
                                                <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                                                    <ImagenItem url={obtenerUrlImagen(c)} titulo={c.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                                    <span className="text-gray-200 truncate" title={c.titulo}>{c.titulo}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                     <Link
                                                        href={route('cancion.loopz', { cancion: c.id })}
                                                        className="p-1 text-gray-400 hover:text-pink-500 focus:outline-none"
                                                        title={c.is_in_user_loopz ? "Gestionar en LoopZ" : "Añadir a LoopZ"}
                                                        preserveScroll
                                                        preserveState={false}
                                                    >
                                                        {c.is_in_user_loopz ? (
                                                            <HeartIconSolid className="h-5 w-5 text-pink-500" />
                                                        ) : (
                                                            <HeartIconOutline className="h-5 w-5" />
                                                        )}
                                                    </Link>
                                                     <button
                                                        onClick={() => manejarAnadirCancion(c.id)}
                                                        disabled={anadiendoCancionId === c.id || contenedor.canciones?.some(song => song.id === c.id)}
                                                        className={`px-3 py-1 rounded text-white text-xs ${anadiendoCancionId === c.id || contenedor.canciones?.some(song => song.id === c.id) ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    >
                                                       {anadiendoCancionId === c.id ? '...' : (contenedor.canciones?.some(song => song.id === c.id) ? 'Añadido' : 'Añadir')}
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length === 0 && (
                                <p className="text-gray-400 italic text-center">No se encontraron canciones que coincidan.</p>
                            )}
                            {!estaBuscando && consultaBusqueda.length < minQueryLength && resultadosBusqueda.length === 0 && !estaBuscando && (
                                 <p className="text-gray-400 italic text-center">Escribe al menos {minQueryLength} caracteres para buscar.</p>
                            )}
                             {!estaBuscando && !consultaBusqueda && resultadosBusqueda.length === 0 && (
                                 <p className="text-gray-400 italic text-center">No hay canciones disponibles para añadir o buscar.</p>
                             )}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

ContenedorShow.propTypes = {
    auth: PropTypes.object.isRequired,
    contenedor: PropTypes.shape({
        id: PropTypes.number,
        nombre: PropTypes.string,
        tipo: PropTypes.string,
        imagen: PropTypes.string,
        publico: PropTypes.bool,
        usuarios: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number,
            name: PropTypes.string,
        })),
        canciones: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number.isRequired,
            titulo: PropTypes.string.isRequired,
            archivo_url: PropTypes.string,
            foto_url: PropTypes.string,
            duracion: PropTypes.number,
            is_in_user_loopz: PropTypes.bool,
            pivot: PropTypes.shape({
                id: PropTypes.number,
                created_at: PropTypes.string,
            }),
        })),
        canciones_count: PropTypes.number,
        can: PropTypes.shape({
            view: PropTypes.bool,
            edit: PropTypes.bool,
            delete: PropTypes.bool,
        }),
        is_liked_by_user: PropTypes.bool,
    }),
};
