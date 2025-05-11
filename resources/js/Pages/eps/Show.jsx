import React, { useState, useEffect, useCallback, useMemo, memo, startTransition, useContext } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import { PlayerContext } from '@/contexts/PlayerContext';
import {
    MusicalNoteIcon,
    TrashIcon,
    PlayIcon,
    PauseIcon,
    PencilIcon,
    ArrowUturnLeftIcon,
    HeartIcon as HeartIconOutline,
    ArrowPathIcon,
    ArrowsRightLeftIcon as ShuffleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { ArrowPathIcon as LoadingIcon } from '@heroicons/react/20/solid';

const obtenerUrlImagen = (item) => {
    if (!item) return null;
    if (item.imagen) {
        return item.imagen.startsWith('http') ? item.imagen : `/storage/${item.imagen}`;
    }
    if (item?.foto_url) return item.foto_url;
    if (item?.image_url) return item.image_url;
    return null;
};

const getTipoNombreMayuscula = (tipo) => {
    if (!tipo) return 'Elemento';
    switch (tipo) {
        case 'album': return 'Álbum';
        case 'playlist': return 'Playlist';
        case 'ep': return 'EP';
        case 'single': return 'Single';
        default: return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }
};

const getResourceRouteBase = (tipo) => {
    switch (tipo) {
        case 'album': return 'albumes';
        case 'playlist': return 'playlists';
        case 'ep': return 'eps';
        case 'single': return 'singles';
        default: return `${tipo}s`;
    }
};

const ImagenItem = memo(({ url, titulo, className = "w-10 h-10", iconoFallback }) => {
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
});
ImagenItem.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
    iconoFallback: PropTypes.node,
};
ImagenItem.displayName = 'ImagenItem';

export default function ContenedorShow({ auth, contenedor: contenedorInicial }) {
    const pagina = usePage();
    const { flash: mensajeFlash } = pagina.props;

    const playerContextValue = useContext(PlayerContext);
    const {
        loadQueueAndPlay = () => {},
        play = () => {},
        pause = () => {},
        toggleShuffle = () => {},
        isPlaying = false,
        isShuffled = false,
        currentTrack = null,
        sourceId = null,
        isLoading: isPlayerLoading = false
    } = playerContextValue || {};

    const [contenedor, setContenedor] = useState(contenedorInicial);
    const [isLiked, setIsLiked] = useState(contenedorInicial?.is_liked_by_user || false);
    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const [eliminandoPivotId, setEliminandoPivotId] = useState(null);
    const [likeProcessing, setLikeProcessing] = useState(false);
    const minQueryLength = 2;

    const urlImagenContenedor = obtenerUrlImagen(contenedor);
    const tipoContenedor = contenedor?.tipo || 'album';
    const tipoNombreMayuscula = getTipoNombreMayuscula(tipoContenedor);
    const rutaBase = getResourceRouteBase(tipoContenedor);

    const buscarCancionesApi = useCallback(async (consulta) => {
        if (!contenedor?.id) return;
        setEstaBuscando(true);
        startTransition(() => { setResultadosBusqueda([]); });
        try {
            const nombreRutaBusqueda = `${rutaBase}.songs.search`;
            const urlBusqueda = route(nombreRutaBusqueda, { contenedor: contenedor.id, query: consulta });
            const respuesta = await fetch(urlBusqueda, { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } });
            if (!respuesta.ok) {
                let errorMsg = `API Error ${respuesta.status}`;
                try { const errorBody = await respuesta.text(); errorMsg += ` - ${errorBody}`; } catch (e) {}
                throw new Error(errorMsg);
            }
            const datos = await respuesta.json();
            startTransition(() => { setResultadosBusqueda(Array.isArray(datos) ? datos : []); });
        } catch (error) {
            console.error("API Error:", error);
            startTransition(() => { setResultadosBusqueda([]); });
        } finally {
            setEstaBuscando(false);
        }
    }, [contenedor?.id, rutaBase]);

    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 350), [buscarCancionesApi]);

    const manejarCambioInputBusqueda = (e) => {
        const nuevaConsulta = e.target.value;
        setConsultaBusqueda(nuevaConsulta);
        if (nuevaConsulta.length >= minQueryLength) {
            busquedaDebounced(nuevaConsulta);
        } else {
            busquedaDebounced.cancel();
            setEstaBuscando(false);
            if (nuevaConsulta.length === 0) {
                buscarCancionesApi('');
            } else {
                startTransition(() => { setResultadosBusqueda([]); });
            }
        }
    };

    useEffect(() => {
        if (contenedor?.id && consultaBusqueda.length === 0) { buscarCancionesApi(''); }
    }, [contenedor?.id, buscarCancionesApi, consultaBusqueda]);

    useEffect(() => {
        const contenedorActualizado = pagina.props.contenedor;
        if (contenedorActualizado && contenedorActualizado.id === (contenedorInicial?.id || contenedor?.id)) {
            if (JSON.stringify(contenedorActualizado) !== JSON.stringify(contenedor)) {
                 if (!Array.isArray(contenedorActualizado.canciones)) { contenedorActualizado.canciones = []; }
                 contenedorActualizado.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                 setContenedor(contenedorActualizado);
            }
            const likedStatusProps = contenedorActualizado?.is_liked_by_user || false;
            if (likedStatusProps !== isLiked) { setIsLiked(likedStatusProps); }
        } else if (contenedorInicial && !contenedor) {
             if (!Array.isArray(contenedorInicial.canciones)) { contenedorInicial.canciones = []; }
             contenedorInicial.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
             setContenedor(contenedorInicial);
             setIsLiked(contenedorInicial?.is_liked_by_user || false);
        }
    }, [pagina.props.contenedor, contenedorInicial, contenedor, isLiked]);

    const resultadosFiltrados = useMemo(() => {
        const idsEnContenedor = new Set(contenedor?.canciones?.map(c => c.id) || []);
        return resultadosBusqueda.filter(c => !idsEnContenedor.has(c.id));
    }, [resultadosBusqueda, contenedor?.canciones]);

    const manejarEliminarCancion = (pivotId) => {
        if (!pivotId || eliminandoPivotId === pivotId) { return; }
        const nombreRutaRemove = `${rutaBase}.songs.remove`;
        setEliminandoPivotId(pivotId);
        router.delete(route(nombreRutaRemove, { contenedor: contenedor.id, pivotId: pivotId }), {
            preserveScroll: true, preserveState: false,
            onSuccess: (page) => {
                if (page.props.contenedor) {
                     if (page.props.contenedor.canciones && Array.isArray(page.props.contenedor.canciones)) {
                         page.props.contenedor.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                     }
                    setContenedor(page.props.contenedor);
                    setIsLiked(page.props.contenedor?.is_liked_by_user || false);
                }
            },
            onError: (errores) => {
                console.error("Error al eliminar canción:", errores);
            },
            onFinish: () => { setEliminandoPivotId(null); },
        });
    };
    const manejarAnadirCancion = (idCancion) => {
        if (anadiendoCancionId === idCancion || !contenedor?.id) return;
        setAnadiendoCancionId(idCancion);
        const nombreRutaAdd = `${rutaBase}.songs.add`;
        router.post(route(nombreRutaAdd, contenedor.id), { cancion_id: idCancion, }, {
            preserveScroll: true, preserveState: false,
            onSuccess: (page) => {
                if (page.props.contenedor) {
                    if (page.props.contenedor.canciones && Array.isArray(page.props.contenedor.canciones)) {
                        page.props.contenedor.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                    }
                    setContenedor(page.props.contenedor);
                    setIsLiked(page.props.contenedor?.is_liked_by_user || false);
                }
                 startTransition(() => { setResultadosBusqueda(prev => prev.filter(song => song.id !== idCancion)); });
            },
            onFinish: () => setAnadiendoCancionId(null),
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
            },
        });
    };
    const toggleLoopz = () => {
        if (!contenedor?.id || likeProcessing) return;
        setLikeProcessing(true);
        router.post(route('contenedores.toggle-loopz', { contenedor: contenedor.id }), {}, {
            preserveScroll: true, preserveState: true,
            onSuccess: (page) => {
                setIsLiked(prev => !prev);
            },
            onError: (errors) => {
                 console.error("Error en la operación 'LoopZ':", errors);
                 setIsLiked(prev => !prev);
            },
            onFinish: () => setLikeProcessing(false),
        });
    };
    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(Math.floor(segundos % 60)).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const artistas = useMemo(() => {
        return contenedor?.usuarios?.length > 0
            ? contenedor.usuarios.map((u, index) => (
                <React.Fragment key={u.id}>
                    <Link
                        href={route('profile.show', u.id)}
                        className="text-blue-400 hover:underline"
                        title={`Ver perfil de ${u.name}`}
                    >
                        {u.name}
                    </Link>
                    {index < contenedor.usuarios.length - 1 && ', '}
                </React.Fragment>
              ))
            : 'Artista Desconocido';
    }, [contenedor?.usuarios]);

    const isCurrentSource = sourceId === contenedor?.id;
    const showPauseButton = isPlaying && isCurrentSource;

    const handleMainPlayPause = () => {
        if (showPauseButton) {
            pause();
        } else {
            if (isCurrentSource && !isPlaying && currentTrack) {
                 play();
            } else if (contenedor?.canciones && contenedor.canciones.length > 0) {
                loadQueueAndPlay(contenedor.canciones, { id: contenedor.id, startIndex: 0 });
            }
        }
    };

    const handleSongPlay = (index) => {
        if (isPlaying && currentTrack?.id === contenedor.canciones[index]?.id) {
            pause();
        } else if (contenedor?.canciones && contenedor.canciones.length > 0) {
            loadQueueAndPlay(contenedor.canciones, {
                startIndex: index,
                id: contenedor.id,
                isDirectClick: true
            });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={contenedor?.nombre || `Detalles de ${tipoNombreMayuscula}`} />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">

                    <div className="md:flex md:items-end md:space-x-8 p-6 md:p-10 bg-transparent">
                         <div className="flex-shrink-0 w-48 h-48 lg:w-64 lg:h-64 mb-6 md:mb-0 mx-auto md:mx-0 shadow-2xl rounded-lg overflow-hidden border-4 border-purple-800/50">
                            {urlImagenContenedor ? (
                                <img src={urlImagenContenedor} alt={`Cover de ${contenedor?.nombre}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-purple-500">
                                    <MusicalNoteIcon className="h-24 w-24" />
                                </div>
                            )}
                        </div>
                         <div className="flex-grow text-center md:text-left">
                            <p className="text-sm font-medium uppercase tracking-wider text-purple-400 mb-1">{tipoNombreMayuscula}</p>
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-4 text-white break-words shadow-sm">
                                {contenedor?.nombre}
                            </h1>
                            {contenedor?.descripcion && (
                                <p className="text-gray-300 mb-4 text-sm md:text-base leading-relaxed">{contenedor.descripcion}</p>
                            )}
                            <div className="flex flex-wrap justify-center md:justify-start items-center space-x-3 text-sm text-gray-300 mb-8">
                                {artistas !== 'Artista Desconocido' && <span className="font-semibold text-blue-400">{artistas}</span>}
                                <span className="hidden sm:inline">• {contenedor?.canciones_count ?? contenedor?.canciones?.length ?? 0} canciones</span>
                                <span className="hidden md:inline">
                                    • {formatearDuracion(contenedor?.canciones?.reduce((sum, s) => sum + (s.duracion || 0), 0))}
                                </span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start space-x-4">
                                <button
                                    onClick={handleMainPlayPause}
                                    className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full font-semibold text-white shadow-lg hover:scale-105 transform transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-wait"
                                    title={showPauseButton ? `Pausar ${tipoNombreMayuscula}` : `Reproducir ${tipoNombreMayuscula}`}
                                    disabled={!contenedor?.canciones || contenedor.canciones.length === 0 || (isPlayerLoading && !isPlaying)}
                                >
                                    {isPlayerLoading && !isPlaying && isCurrentSource ? <LoadingIcon className="h-7 w-7 animate-spin"/> : (showPauseButton ? <PauseIcon className="h-7 w-7" /> : <PlayIcon className="h-7 w-7" />)}
                                </button>
                                <button
                                    onClick={toggleShuffle}
                                    className={`inline-flex items-center justify-center p-3 border border-slate-600 rounded-full font-semibold text-xs uppercase tracking-widest shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition ease-in-out duration-150 ${isShuffled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-300 hover:bg-slate-700'}`}
                                    title={isShuffled ? "Desactivar aleatorio" : "Activar aleatorio"}
                                    disabled={!contenedor?.canciones || contenedor.canciones.length === 0}
                                >
                                    <ShuffleIcon className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={toggleLoopz}
                                    disabled={likeProcessing || !contenedor?.id}
                                    className={`p-2 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${likeProcessing ? 'text-gray-500 cursor-wait' : 'text-gray-400 hover:text-purple-400'}`}
                                    title={isLiked ? `Quitar ${tipoNombreMayuscula} de LoopZ` : `Añadir ${tipoNombreMayuscula} a LoopZ`}
                                >
                                    {likeProcessing ? <ArrowPathIcon className="h-7 w-7 animate-spin text-purple-400"/> : (isLiked ? <HeartIconSolid className="h-7 w-7 text-purple-500" /> : <HeartIconOutline className="h-7 w-7" />)}
                                </button>
                                <button
                                    onClick={() => window.history.back()}
                                    className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-widest shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                >
                                    <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />Volver
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm shadow-inner rounded-lg border border-slate-700">
                        <h3 className="text-xl font-semibold mb-4 text-gray-100">
                             Canciones en est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula} ({contenedor?.canciones?.length || 0})
                        </h3>
                        {contenedor?.canciones && contenedor.canciones.length > 0 ? (
                            <ul className="space-y-2">
                                {contenedor.canciones.map((cancion, index) => (
                                    <li key={cancion.pivot?.id ?? `fallback-${cancion.id}`} className="p-2 bg-slate-700/60 rounded-md flex items-center space-x-3 hover:bg-purple-900/30 transition-colors duration-150 group">
                                         <button
                                             onClick={() => handleSongPlay(index)}
                                             className="flex-shrink-0 text-gray-400 hover:text-blue-400 p-1 disabled:opacity-50 disabled:cursor-wait"
                                             title={`Reproducir ${cancion.titulo}`}
                                             disabled={isPlayerLoading && currentTrack?.id !== cancion.id}
                                         >
                                            { isPlayerLoading && currentTrack?.id === cancion.id ? <LoadingIcon className="h-5 w-5 animate-spin text-blue-500"/> :
                                             (isPlaying && currentTrack?.id === cancion.id) ? <PauseIcon className="h-5 w-5 text-blue-500"/> :
                                             <PlayIcon className="h-5 w-5"/>
                                            }
                                        </button>
                                        <ImagenItem url={obtenerUrlImagen(cancion)} titulo={cancion.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                        <span className="text-gray-200 flex-grow truncate" title={cancion.titulo}>{cancion.titulo}</span>
                                        <span className="text-gray-400 text-xs pr-2 hidden sm:inline">{formatearDuracion(cancion.duracion)}</span>
                                        <Link
                                            href={route('cancion.loopz', { cancion: cancion.id })}
                                            className="p-1 text-gray-400 hover:text-purple-400 focus:outline-none flex-shrink-0"
                                            title={cancion.is_in_user_loopz ? "Gestionar en LoopZ" : "Añadir a LoopZ"}
                                            preserveScroll preserveState={false}
                                        >
                                            {cancion.is_in_user_loopz ? ( <HeartIconSolid className="h-5 w-5 text-purple-500" /> ) : ( <HeartIconOutline className="h-5 w-5" /> )}
                                        </Link>
                                        {contenedor.can?.edit && (
                                            <button
                                                 onClick={() => { if (confirm(`¿Quitar "${cancion.titulo}" de este ${tipoNombreMayuscula}?`)) { manejarEliminarCancion(cancion.pivot?.id) } }}
                                                 disabled={!cancion.pivot?.id || eliminandoPivotId === cancion.pivot?.id}
                                                 className="ml-2 p-1.5 text-red-500 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-wait flex-shrink-0"
                                                 title={!cancion.pivot?.id ? "Error ID" : `Quitar de ${tipoNombreMayuscula}`}
                                             >
                                                 {eliminandoPivotId === cancion.pivot?.id ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <TrashIcon className="w-4 h-4"/>}
                                             </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic">Est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula} aún no tiene canciones.</p>
                        )}
                    </div>

                    {contenedor?.can?.edit && (
                        <div className="mt-10 p-6 md:p-8 bg-slate-800/80 backdrop-blur-sm shadow-inner rounded-lg border border-slate-700">
                            <h3 className="text-xl font-semibold mb-4 text-gray-100">Añadir Canciones</h3>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Buscar canciones por título..."
                                    value={consultaBusqueda}
                                    onChange={manejarCambioInputBusqueda}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-slate-800"
                                    disabled={!contenedor?.id}
                                />
                            </div>
                            {estaBuscando && <p className="text-gray-400 italic text-center">Buscando...</p>}
                            {!estaBuscando && resultadosFiltrados.length > 0 && (
                                <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-md p-2 space-y-2 bg-slate-700/50">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                         {consultaBusqueda.length >= minQueryLength ? 'Resultados:' : 'Canciones Disponibles:'}
                                    </h4>
                                    <ul>
                                        {resultadosFiltrados.map((c) => (
                                            <li key={c.id} className="flex items-center justify-between p-2 hover:bg-blue-900/30 rounded space-x-3 group">
                                                 <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                                                     <ImagenItem url={obtenerUrlImagen(c)} titulo={c.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                                     <span className="text-gray-200 truncate" title={c.titulo}>{c.titulo}</span>
                                                 </div>
                                                 <div className="flex items-center space-x-2 flex-shrink-0">
                                                     <Link
                                                         href={route('cancion.loopz', { cancion: c.id })}
                                                         className="p-1 text-gray-400 hover:text-purple-400 focus:outline-none"
                                                         title={c.is_in_user_loopz ? "Gestionar en LoopZ" : "Añadir a LoopZ"}
                                                         preserveScroll preserveState={false}
                                                     >
                                                         {c.is_in_user_loopz ? <HeartIconSolid className="h-5 w-5 text-purple-500" /> : <HeartIconOutline className="h-5 w-5" />}
                                                     </Link>
                                                    <button
                                                         onClick={() => manejarAnadirCancion(c.id)}
                                                         disabled={anadiendoCancionId === c.id}
                                                         className={`ml-2 px-3 py-1 text-xs font-semibold rounded-md transition ease-in-out duration-150 flex-shrink-0 ${anadiendoCancionId === c.id ? 'bg-indigo-700 text-white cursor-wait opacity-75' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800'}`}
                                                     >
                                                         {anadiendoCancionId === c.id ? '...' : 'Añadir'}
                                                     </button>
                                                 </div>
                                             </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length > 0 && resultadosFiltrados.length === 0 && ( <p className="text-gray-400 italic text-center pt-4">Todas las canciones encontradas ya están en est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula}.</p> )}
                            {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length === 0 && ( <p className="text-gray-400 italic text-center pt-4">No se encontraron canciones que coincidan.</p> )}
                            {!estaBuscando && consultaBusqueda.length > 0 && consultaBusqueda.length < minQueryLength && ( <p className="text-gray-400 italic text-center pt-4">Escribe al menos {minQueryLength} caracteres para buscar.</p> )}
                             {!estaBuscando && consultaBusqueda.length === 0 && resultadosFiltrados.length === 0 && contenedor?.canciones?.length > 0 && ( <p className="text-gray-400 italic text-center pt-4">No hay más canciones disponibles para añadir o no se encontraron coincidencias.</p> )}
                             {!estaBuscando && consultaBusqueda.length === 0 && resultadosFiltrados.length === 0 && (!contenedor?.canciones || contenedor.canciones.length === 0) && ( <p className="text-gray-400 italic text-center pt-4">No hay canciones disponibles para añadir.</p> )}
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
        descripcion: PropTypes.string,
        tipo: PropTypes.string,
        imagen: PropTypes.string,
        publico: PropTypes.bool,
        usuarios: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string, })),
        canciones: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number.isRequired,
            titulo: PropTypes.string.isRequired,
            archivo_url: PropTypes.string,
            foto_url: PropTypes.string,
            image_url: PropTypes.string,
            duracion: PropTypes.number,
            is_in_user_loopz: PropTypes.bool,
            pivot: PropTypes.shape({ id: PropTypes.number, created_at: PropTypes.string, }),
            usuarios: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
            artista: PropTypes.string,
        })),
        canciones_count: PropTypes.number,
        can: PropTypes.shape({ view: PropTypes.bool, edit: PropTypes.bool, delete: PropTypes.bool, }),
        is_liked_by_user: PropTypes.bool,
    }),
};
