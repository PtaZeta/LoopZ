import React, { useState, useEffect, useCallback, useMemo, memo, startTransition, useContext, useRef } from 'react';
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
    ArrowsRightLeftIcon as ShuffleIcon,
    QueueListIcon,
    UserIcon,
    ChevronRightIcon
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

const ContextMenu = memo(({ x, y, show, onClose, options }) => {
    const menuRef = useRef(null);
    const [showSubMenu, setShowSubMenu] = useState(false);
    const [subMenuOptions, setSubMenuOptions] = useState([]);
    const [subMenuPosition, setSubMenuPosition] = useState({ x: 0, y: 0 });
    const closeTimer = useRef(null);

    const handleClose = useCallback(() => {
        setShowSubMenu(false);
        setSubMenuOptions([]);
        onClose();
    }, [onClose]);

    const startCloseTimer = useCallback(() => {
        closeTimer.current = setTimeout(handleClose, 100);
    }, [handleClose]);

    const cancelCloseTimer = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);


    useEffect(() => {
        if (!show) {
            setShowSubMenu(false);
            setSubMenuOptions([]);
            cancelCloseTimer();
        }
    }, [show, cancelCloseTimer]);


    if (!show) return null;

    const style = {
        top: y,
        left: x,
    };

    const menuWidth = 200;
    const menuHeight = options.length * 35;
    const subMenuWidth = 200;

    if (x + menuWidth > window.innerWidth) {
        style.left = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
        style.top = y - menuHeight;
        if (style.top < 0) style.top = 0;
    }

    const handleOptionInteraction = (option, event) => {
        cancelCloseTimer();
        if (option.submenu) {
            setSubMenuOptions(option.submenu);
            setShowSubMenu(true);

            const rect = event.currentTarget.getBoundingClientRect();
            let subMenuX = rect.right;
            let subMenuY = rect.top;

             if (subMenuX + subMenuWidth > window.innerWidth) {
                 subMenuX = rect.left - subMenuWidth;
             }
             if (subMenuY + option.submenu.length * 35 > window.innerHeight) {
                 subMenuY = window.innerHeight - option.submenu.length * 35 - 10;
                 if (subMenuY < 0) subMenuY = 0;
             }

            setSubMenuPosition({ x: subMenuX, y: subMenuY });

        } else {
            if (event.type === 'click' && option.action) {
                 option.action();
                 handleClose();
            }
        }
    };

    const handleSubMenuOptionClick = (option) => {
         option.action();
         handleClose();
    };


    return (
        <>
            <div
                ref={menuRef}
                className="absolute z-50 bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                style={style}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
                onMouseEnter={cancelCloseTimer}
                onMouseLeave={startCloseTimer}
            >
                <div className="py-1" role="none">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            onClick={option.submenu ? (e) => handleOptionInteraction(option, e) : option.action}
                            onMouseEnter={option.submenu ? (e) => handleOptionInteraction(option, e) : undefined}
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            role="menuitem"
                            disabled={option.disabled}
                        >
                             {option.icon && <span className="mr-3">{option.icon}</span>}
                            {option.label}
                            {option.submenu && <ChevronRightIcon className="ml-auto h-4 w-4 text-gray-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {showSubMenu && subMenuOptions.length > 0 && (
                 <div
                     className="absolute z-50 bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none"
                     style={{ top: subMenuPosition.y, left: subMenuPosition.x, minWidth: `${subMenuWidth}px` }}
                     role="menu"
                     aria-orientation="vertical"
                     onMouseEnter={cancelCloseTimer}
                     onMouseLeave={startCloseTimer}
                 >
                     <div className="py-1" role="none">
                         {subMenuOptions.map((option, index) => (
                             <button
                                 key={index}
                                 onClick={() => handleSubMenuOptionClick(option)}
                                 className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                 role="menuitem"
                                 disabled={option.disabled}
                             >
                                  {option.icon && <span className="mr-3">{option.icon}</span>}
                                 {option.label}
                             </button>
                         ))}
                     </div>
                 </div>
            )}
        </>
    );
});

ContextMenu.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        action: PropTypes.func,
        icon: PropTypes.node,
        disabled: PropTypes.bool,
        submenu: PropTypes.arrayOf(PropTypes.shape({
             label: PropTypes.string.isRequired,
             action: PropTypes.func.isRequired,
             icon: PropTypes.node,
             disabled: PropTypes.bool,
        })),
    })).isRequired,
};
ContextMenu.displayName = 'ContextMenu';


export default function ContenedorShow({ auth, contenedor: contenedorInicial }) {
    const pagina = usePage();
    const { flash: mensajeFlash } = pagina.props;

    const playerContextValue = useContext(PlayerContext);
    const {
        cargarColaYIniciar = () => {},
        play = () => {},
        pause = () => {},
        toggleAleatorio = () => {},
        Reproduciendo = false,
        aleatorio = false,
        cancionActual = null,
        sourceId = null,
        cargando: isPlayerLoading = false,
        añadirSiguiente = () => {},
        queue: playerQueue = [],
        cancionActualIndex
    } = playerContextValue || {};

    const [contenedor, setContenedor] = useState(contenedorInicial);
    const [isLiked, setIsLiked] = useState(contenedorInicial?.is_liked_by_user || false);
    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const [eliminandoPivotId, setEliminandoPivotId] = useState(null);
    const [likeProcessing, setLikeProcessing] = useState(null);
    const minQueryLength = 2;

    const [contextMenu, setContextMenu] = useState({
        show: false,
        x: 0,
        y: 0,
        song: null,
    });
    const contextMenuTimer = useRef(null);


    const urlImagenContenedor = obtenerUrlImagen(contenedor);
    const tipoContenedor = contenedor?.tipo || 'album';
    const tipoNombreMayuscula = getTipoNombreMayuscula(tipoContenedor);
    const rutaBase = getResourceRouteBase(tipoContenedor);

    const buscarCancionesApi = useCallback(async (consulta) => {
        if (!contenedor?.id) return;
        setEstaBuscando(true);
        startTransition(() => { setResultadosBusqueda([]); });
        try {
            const nombreRutaBusqueda = `${rutaBase}.canciones.search`;
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
                 if (contenedor?.id && (tipoContenedor === 'playlist' || contenedor.can?.edit)) {
                      buscarCancionesApi('');
                 } else {
                      startTransition(() => { setResultadosBusqueda([]); });
                 }
            } else {
                 startTransition(() => { setResultadosBusqueda([]); });
            }
        }
    };

    useEffect(() => {
        if (contenedor?.id && (tipoContenedor === 'playlist' || contenedor.can?.edit) && consultaBusqueda.length === 0) {
             buscarCancionesApi('');
        }
    }, [contenedor?.id, buscarCancionesApi, consultaBusqueda, tipoContenedor, contenedor?.can?.edit]);


    useEffect(() => {
        const currentContenedorProps = pagina.props.contenedor;
        if (currentContenedorProps && currentContenedorProps.id === (contenedorInicial?.id || contenedor?.id)) {
            if (JSON.stringify(currentContenedorProps) !== JSON.stringify(contenedor)) {
                 if (!Array.isArray(currentContenedorProps.canciones)) { currentContenedorProps.canciones = []; }
                 currentContenedorProps.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                 setContenedor(currentContenedorProps);
            }
            const likedStatusProps = currentContenedorProps?.is_liked_by_user || false;
            if (likedStatusProps !== isLiked) { setIsLiked(likedStatusProps); }
        } else if (contenedorInicial && !contenedor) {
             if (!Array.isArray(contenedorInicial.canciones)) { contenedorInicial.canciones = []; }
             contenedorInicial.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
             setContenedor(contenedorInicial);
             setIsLiked(contenedorInicial?.is_liked_by_user || false);
        }

        if (pagina.props.resultadosBusqueda && Array.isArray(pagina.props.resultadosBusqueda)) {
             if (Array.isArray(pagina.props.resultadosBusqueda)) {
                  pagina.props.resultadosBusqueda.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                 setResultadosBusqueda(pagina.props.resultadosBusqueda);
             }
        }

    }, [pagina.props.contenedor, pagina.props.resultadosBusqueda, contenedor, contenedorInicial, isLiked, consultaBusqueda]);


    const resultadosFiltrados = useMemo(() => {
        const idsEnContenedor = new Set(contenedor?.canciones?.map(c => c.id) || []);
        return resultadosBusqueda.filter(c => !idsEnContenedor.has(c.id));
    }, [resultadosBusqueda, contenedor?.canciones]);

    const manejarEliminarCancion = (pivotId) => {
        if (!pivotId || eliminandoPivotId === pivotId) { return; }
        const nombreRutaRemove = `${rutaBase}.canciones.remove`;
        setEliminandoPivotId(pivotId);
        router.delete(route(nombreRutaRemove, { contenedor: contenedor.id, pivotId: pivotId }), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (page.props.contenedor?.canciones && Array.isArray(page.props.contenedor.canciones)) {
                     page.props.contenedor.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                     setContenedor(prevContenedor => ({
                        ...prevContenedor,
                        canciones: page.props.contenedor.canciones,
                        canciones_count: page.props.contenedor.canciones.length
                    }));
                } else {
                     setContenedor(prevContenedor => ({
                        ...prevContenedor,
                         canciones: [],
                         canciones_count: 0
                    }));
                }
                setIsLiked(page.props.contenedor?.is_liked_by_user || false);
                buscarCancionesApi(consultaBusqueda);
                closeContextMenu(); // Cerrar el menú contextual al eliminar
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
        const nombreRutaAdd = `${rutaBase}.canciones.add`;
        router.post(route(nombreRutaAdd, contenedor.id), { cancion_id: idCancion, }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (page.props.contenedor?.canciones && Array.isArray(page.props.contenedor.canciones)) {
                     page.props.contenedor.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                     setContenedor(prevContenedor => ({
                        ...prevContenedor,
                        canciones: page.props.contenedor.canciones,
                         canciones_count: page.props.contenedor.canciones.length
                    }));
                } else {
                     setContenedor(prevContenedor => ({
                        ...prevContenedor,
                         canciones: prevContenedor?.canciones || [],
                         canciones_count: prevContenedor?.canciones?.length || 0
                    }));
                }
                setIsLiked(page.props.contenedor?.is_liked_by_user || false);
                 startTransition(() => { setResultadosBusqueda(prev => prev.filter(cancion => cancion.id !== idCancion)); });
                 closeContextMenu(); // Cerrar el menú contextual al añadir
            },
            onFinish: () => setAnadiendoCancionId(null),
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
            },
        });
    };

    const manejarCancionLoopzToggle = (songId, isInLoopz) => {
        if (!songId || likeProcessing === songId) return;

        setLikeProcessing(songId);

         setContenedor(prevContenedor => {
             if (!prevContenedor || !prevContenedor.canciones) return prevContenedor;
             const newCanciones = [...prevContenedor.canciones];
             const songIndex = newCanciones.findIndex(c => c.id === songId);

             if (songIndex !== -1) {
                 newCanciones[songIndex] = {
                     ...newCanciones[songIndex],
                     is_in_user_loopz: !isInLoopz
                 };
             }
             return {
                 ...prevContenedor,
                 canciones: newCanciones
             };
         });

         setResultadosBusqueda(prevResultados => {
             const newResultados = [...prevResultados];
             const songIndex = newResultados.findIndex(c => c.id === songId);

             if (songIndex !== -1) {
                  newResultados[songIndex] = {
                     ...newResultados[songIndex],
                     is_in_user_loopz: !isInLoopz
                  };
             }

             return newResultados;
         });


        router.post(route('cancion.loopz', { cancion: songId }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                 if (page.props.contenedor?.canciones && Array.isArray(page.props.contenedor.canciones)) {
                     page.props.contenedor.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                     setContenedor(page.props.contenedor);
                 }
                 setIsLiked(page.props.contenedor?.is_liked_by_user || false);

                 if (page.props.resultadosBusqueda && Array.isArray(page.props.resultadosBusqueda)) {
                      page.props.resultadosBusqueda.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                      setResultadosBusqueda(page.props.resultadosBusqueda);
                 }
                 // No cerrar el menú aquí, ya que el toggle de LoopZ no debería cerrarlo.
            },
            onError: (errors) => {
                console.error(`Error toggling LoopZ for song ${songId}:`, errors);
                 setContenedor(prevContenedor => {
                     if (!prevContenedor || !prevContenedor.canciones) return prevContenedor;
                     const newCanciones = [...prevContenedor.canciones];
                     const songIndex = newCanciones.findIndex(c => c.id === songId);
                      if (songIndex !== -1) {
                         newCanciones[songIndex] = { ...newCanciones[songIndex], is_in_user_loopz: isInLoopz };
                      }
                     return { ...prevContenedor, canciones: newCanciones };
                 });

                 setResultadosBusqueda(prevResultados => {
                     const newResultados = [...prevResultados];
                     const songIndex = newResultados.findIndex(c => c.id === songId);
                     if (songIndex !== -1) {
                         newResultados[songIndex] = { ...newResultados[songIndex], is_in_user_loopz: isInLoopz };
                     }
                     return newResultados;
                 });
            },
            onFinish: () => {
                setLikeProcessing(null);
            },
        });
    };


    const toggleLoopz = () => {
        if (!contenedor?.id || likeProcessing === 'container') return;
        setLikeProcessing('container');
        router.post(route('contenedores.toggle-loopz', { contenedor: contenedor.id }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                setIsLiked(page.props.contenedor?.is_liked_by_user || false);
                 if (page.props.contenedor && JSON.stringify(page.props.contenedor) !== JSON.stringify(contenedor)) {
                     if (!Array.isArray(page.props.contenedor.canciones)) { page.props.contenedor.canciones = []; }
                     page.props.contenedor.canciones.forEach(c => { if (typeof c.is_in_user_loopz === 'undefined') c.is_in_user_loopz = false; });
                     setContenedor(page.props.contenedor);
                 }
            },
            onError: (errors) => {
                     console.error("Error en la operación 'LoopZ' del contenedor:", errors);
            },
            onFinish: () => setLikeProcessing(null),
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
    const showPauseButton = Reproduciendo && isCurrentSource;

    const handleMainPlayPause = () => {
        if (showPauseButton) {
            pause();
        } else {
            if (isCurrentSource && !Reproduciendo && cancionActual) {
                play();
            } else if (contenedor?.canciones && contenedor.canciones.length > 0) {
                cargarColaYIniciar(contenedor.canciones, { id: contenedor.id, iniciar: 0 });
            }
        }
    };

    const handleSongPlay = useCallback((song, source) => {
         if (!song) return;

         const isClickedSongCurrent = cancionActual?.id === song.id;

         if (Reproduciendo && isClickedSongCurrent) {
             pause();
         } else {
             let queueToLoad = [];
             let startIndex = 0;
             let newSourceId = null;

             if (source === 'container' && contenedor?.canciones) {
                 queueToLoad = contenedor.canciones;
                 startIndex = queueToLoad.findIndex(s => s.id === song.id);
                 newSourceId = contenedor.id;
             } else if (source === 'search' && resultadosBusqueda) {
                 queueToLoad = resultadosBusqueda;
                 startIndex = queueToLoad.findIndex(s => s.id === song.id);
                 newSourceId = 'search-results'; // Or a unique ID for search results if needed
             } else {
                 console.warn("Clicked song source is unknown or queue is empty.");
                 return;
             }

             if (startIndex !== -1) {
                 cargarColaYIniciar(queueToLoad, { iniciar: startIndex, id: newSourceId, clickDirecto: true });
             } else {
                 console.warn("Clicked song not found in the specified source queue.");
             }
         }
    }, [Reproduciendo, cancionActual, cargarColaYIniciar, pause, contenedor?.canciones, resultadosBusqueda]);


    const openContextMenu = useCallback((event, song) => {
        event.preventDefault();
        setContextMenu({
            show: true,
            x: event.clientX,
            y: event.clientY,
            song: song,
        });
    }, []);

    const closeContextMenu = useCallback(() => {
         if (contextMenuTimer.current) {
             clearTimeout(contextMenuTimer.current);
             contextMenuTimer.current = null;
         }
        setContextMenu({ ...contextMenu, show: false, song: null });
    }, [contextMenu]);

     const startCloseTimer = useCallback(() => {
         contextMenuTimer.current = setTimeout(closeContextMenu, 100);
     }, [closeContextMenu]);

     const cancelCloseTimer = useCallback(() => {
         if (contextMenuTimer.current) {
             clearTimeout(contextMenuTimer.current);
             contextMenuTimer.current = null;
         }
     }, []);


    const handleAddToQueueNext = useCallback(() => {
        if (contextMenu.song && añadirSiguiente) {
            añadirSiguiente(contextMenu.song);
            closeContextMenu();
        }
    }, [contextMenu.song, añadirSiguiente, closeContextMenu]);

    const handleViewArtist = useCallback((artist) => {
         if (artist?.id) {
              router.visit(route('profile.show', artist.id));
              closeContextMenu();
         }
    }, [closeContextMenu]);


    const getContextMenuOptions = useCallback(() => {
        if (!contextMenu.song) return [];

        const options = [];

        options.push({
            label: contextMenu.song.is_in_user_loopz ? "Quitar de LoopZ" : "Añadir a LoopZ",
            action: () => manejarCancionLoopzToggle(contextMenu.song.id, contextMenu.song.is_in_user_loopz),
            icon: <HeartIconOutline className="h-5 w-5" />,
            disabled: likeProcessing === contextMenu.song.id,
        });
         if (contextMenu.song.is_in_user_loopz) {
             options[0].icon = <HeartIconSolid className="h-5 w-5 text-purple-500" />;
         }


        options.push({
            label: "Añadir a la cola (siguiente)",
            action: handleAddToQueueNext,
            icon: <QueueListIcon className="h-5 w-5" />,
            disabled: !añadirSiguiente,
        });

        if (contextMenu.song.usuarios && Array.isArray(contextMenu.song.usuarios) && contextMenu.song.usuarios.length > 0) {
             const artistSubmenuOptions = contextMenu.song.usuarios.map(artist => ({
                  label: artist.name,
                  action: () => handleViewArtist(artist),
                  icon: <UserIcon className="h-5 w-5" />,
                  disabled: !artist?.id || !artist?.name,
             }));

             options.push({
                  label: `Ver artista${contextMenu.song.usuarios.length > 1 ? 's' : ''}`,
                  icon: <UserIcon className="h-5 w-5" />,
                  submenu: artistSubmenuOptions,
                  disabled: artistSubmenuOptions.length === 0,
             });

         } else if (contextMenu.song.artista) {
               options.push({
                    label: `Artista: ${contextMenu.song.artista}`,
                    icon: <UserIcon className="h-5 w-5 text-gray-400" />,
                    disabled: true,
               });
         }


        if (contenedor?.can?.edit && contextMenu.song.pivot?.id) {
             options.push({
                 label: `Quitar de ${tipoNombreMayuscula}`,
                 action: () => manejarEliminarCancion(contextMenu.song.pivot.id),
                 icon: <TrashIcon className="h-5 w-5 text-red-500" />,
                 disabled: eliminandoPivotId === contextMenu.song.pivot.id,
             });
         }


        return options;
    }, [contextMenu.song, manejarCancionLoopzToggle, likeProcessing, handleAddToQueueNext, contenedor?.can?.edit, tipoNombreMayuscula, manejarEliminarCancion, eliminandoPivotId, añadirSiguiente, handleViewArtist]);


    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={contenedor?.nombre || `Detalles de ${tipoNombreMayuscula}`} />

            <div className="py-12">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">

                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        show={contextMenu.show}
                        onClose={closeContextMenu}
                        options={getContextMenuOptions()}
                    />

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
                                          disabled={!contenedor?.canciones || contenedor.canciones.length === 0 || (isPlayerLoading && !Reproduciendo && isCurrentSource)}
                                     >
                                          {isPlayerLoading && !Reproduciendo && isCurrentSource ? <LoadingIcon className="h-7 w-7 animate-spin"/> : (showPauseButton ? <PauseIcon className="h-7 w-7" /> : <PlayIcon className="h-7 w-7" />)}
                                     </button>
                                     <button
                                          onClick={toggleAleatorio}
                                          className={`inline-flex items-center justify-center p-3 border border-slate-600 rounded-full font-semibold text-xs uppercase tracking-widest shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition ease-in-out duration-150 ${aleatorio ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-300 hover:bg-slate-700'}`}
                                          title={aleatorio ? "Desactivar aleatorio" : "Activar aleatorio"}
                                          disabled={!contenedor?.canciones || contenedor.canciones.length === 0}
                                     >
                                          <ShuffleIcon className="h-6 w-6" />
                                     </button>
                                     <button
                                          onClick={toggleLoopz}
                                          disabled={likeProcessing === 'container' || !contenedor?.id}
                                          className={`p-2 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${(likeProcessing === 'container') ? 'text-gray-500 cursor-wait' : 'text-gray-400 hover:text-purple-400'}`}
                                          title={isLiked ? `Quitar ${tipoNombreMayuscula} de LoopZ` : `Añadir ${tipoNombreMayuscula} a LoopZ`}
                                     >
                                          {(likeProcessing === 'container') ? <LoadingIcon className="h-7 w-7 animate-spin text-purple-400"/> : (isLiked ? <HeartIconSolid className="h-7 w-7 text-purple-500" /> : <HeartIconOutline className="h-7 w-7" />)}
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
                                      <li
                                          key={cancion.pivot?.id ?? `fallback-${cancion.id}`}
                                          className={`p-2 bg-slate-700/60 rounded-md flex items-center space-x-3 hover:bg-purple-900/30 transition-colors duration-150 group cursor-pointer ${cancionActual?.id === cancion.id && (Reproduciendo || isPlayerLoading) ? 'bg-purple-800/50 border border-purple-500' : ''}`}
                                           onContextMenu={(e) => openContextMenu(e, cancion)}
                                           onDoubleClick={() => handleSongPlay(cancion, 'container')}
                                      >
                                          <button
                                               onClick={() => handleSongPlay(cancion, 'container')}
                                               className="flex-shrink-0 text-gray-400 hover:text-blue-400 p-1 disabled:opacity-50 disabled:cursor-wait"
                                               title={cancionActual?.id === cancion.id && Reproduciendo ? `Pausar ${cancion.titulo}` : `Reproducir ${cancion.titulo}`}
                                               disabled={isPlayerLoading && cancionActual?.id === cancion.id}
                                           >
                                               { isPlayerLoading && cancionActual?.id === cancion.id ? <LoadingIcon className="h-5 w-5 animate-spin text-blue-500"/> :
                                                (Reproduciendo && cancionActual?.id === cancion.id) ? <PauseIcon className="h-5 w-5 text-blue-500"/> :
                                                <PlayIcon className="h-5 w-5"/>
                                               }
                                           </button>
                                           <ImagenItem url={obtenerUrlImagen(cancion)} titulo={cancion.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                           <div className="flex-grow truncate">
                                                <span className="text-gray-200 block truncate" title={cancion.titulo}>{cancion.titulo}</span>
                                                <span className="text-gray-400 text-xs block truncate">
                                                     {cancion.usuarios && Array.isArray(cancion.usuarios) && cancion.usuarios.length > 0
                                                          ? cancion.usuarios.map((u, idx) => (
                                                               <React.Fragment key={u.id}>
                                                                    <Link href={route('profile.show', u.id)} className="hover:underline">{u.name}</Link>
                                                                    {idx < cancion.usuarios.length - 1 && ', '}
                                                               </React.Fragment>
                                                          ))
                                                          : cancion.artista || 'Artista Desconocido'
                                                     }
                                                </span>
                                           </div>
                                           <span className="text-gray-400 text-xs pr-2 hidden sm:inline">{formatearDuracion(cancion.duracion)}</span>
                                            <button
                                                onClick={() => manejarCancionLoopzToggle(cancion.id, cancion.is_in_user_loopz)}
                                                disabled={likeProcessing === cancion.id}
                                                className={`p-1 text-gray-400 hover:text-purple-400 focus:outline-none flex-shrink-0 ${likeProcessing === cancion.id ? 'cursor-wait' : ''}`}
                                                title={cancion.is_in_user_loopz ? "Quitar de LoopZ" : "Añadir a LoopZ"}
                                            >
                                                {likeProcessing === cancion.id ? <LoadingIcon className="h-5 w-5 animate-spin text-purple-400"/> :
                                                    (cancion.is_in_user_loopz ? ( <HeartIconSolid className="h-5 w-5 text-purple-500" /> ) : ( <HeartIconOutline className="h-5 w-5" /> ))
                                                }
                                            </button>
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
                                      disabled={!contenedor?.id || estaBuscando}
                                 />
                             </div>
                             {estaBuscando && <p className="text-gray-400 italic text-center">Buscando...</p>}
                             {!estaBuscando && consultaBusqueda && consultaBusqueda.length >= minQueryLength && resultadosFiltrados.length === 0 && ( <p className="text-gray-400 italic text-center pt-4">No se encontraron canciones que coincidan fuera de est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula}.</p> )}
                             {!estaBuscando && consultaBusqueda && consultaBusqueda.length < minQueryLength && ( <p className="text-gray-400 italic text-center pt-4">Escribe al menos {minQueryLength} caracteres para buscar.</p> )}
                             {!estaBuscando && !consultaBusqueda && resultadosFiltrados.length === 0 && contenedor?.canciones?.length > 0 && ( <p className="text-gray-400 italic text-center pt-4">Todas las canciones disponibles ya están en est{tipoContenedor === 'playlist' ? 'a' : 'e'} {tipoNombreMayuscula}.</p> )}
                             {!estaBuscando && !consultaBusqueda && resultadosFiltrados.length === 0 && (!contenedor?.canciones || contenedor.canciones.length === 0) && ( <p className="text-gray-400 italic text-center pt-4">No hay canciones disponibles para añadir.</p> )}

                             {!estaBuscando && resultadosFiltrados.length > 0 && (
                                 <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-md p-2 space-y-2 bg-slate-700/50">
                                      <h4 className="text-sm font-semibold text-gray-300 mb-2">resultados de la búsqueda:</h4>
                                      <ul>
                                          {resultadosFiltrados.map((c) => (
                                               <li
                                                   key={c.id}
                                                   className="flex items-center justify-between p-2 hover:bg-blue-900/30 rounded space-x-3 group cursor-pointer"
                                                    onContextMenu={(e) => openContextMenu(e, c)}
                                                    onDoubleClick={() => handleSongPlay(c, 'search')}
                                               >
                                                   <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                                                       <ImagenItem url={obtenerUrlImagen(c)} titulo={c.titulo} className="w-10 h-10" iconoFallback={<MusicalNoteIcon className="h-5 w-5"/>} />
                                                       <div className="flex-grow truncate">
                                                            <span className="text-gray-200 block truncate" title={c.titulo}>{c.titulo}</span>
                                                            <span className="text-gray-400 text-xs block truncate">
                                                                 {c.usuarios && Array.isArray(c.usuarios) && c.usuarios.length > 0
                                                                      ? c.usuarios.map((u, idx) => (
                                                                           <React.Fragment key={u.id}>
                                                                                <Link href={route('profile.show', u.id)} className="hover:underline">{u.name}</Link>
                                                                                {idx < c.usuarios.length - 1 && ', '}
                                                                           </React.Fragment>
                                                                      ))
                                                                      : c.artista || 'Artista Desconocido'
                                                                 }
                                                            </span>
                                                       </div>
                                                   </div>
                                                   <div className="flex items-center space-x-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => manejarCancionLoopzToggle(c.id, c.is_in_user_loopz)}
                                                            disabled={likeProcessing === c.id}
                                                            className={`p-1 text-gray-400 hover:text-purple-400 focus:outline-none flex-shrink-0 ${likeProcessing === c.id ? 'cursor-wait' : ''}`}
                                                            title={c.is_in_user_loopz ? "Quitar de LoopZ" : "Añadir a LoopZ"}
                                                        >
                                                            {likeProcessing === c.id ? <LoadingIcon className="h-5 w-5 animate-spin text-purple-400"/> :
                                                                (c.is_in_user_loopz ? ( <HeartIconSolid className="h-5 w-5 text-purple-500" /> ) : ( <HeartIconOutline className="h-5 w-5" /> ))
                                                            }
                                                        </button>
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
            usuarios: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })),
            artista: PropTypes.string,
        })),
        canciones_count: PropTypes.number,
        can: PropTypes.shape({ view: PropTypes.bool, edit: PropTypes.bool, delete: PropTypes.bool, }),
        is_liked_by_user: PropTypes.bool,
    }),
};
