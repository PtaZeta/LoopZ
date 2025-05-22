import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { PlayerContext } from '@/contexts/PlayerContext';
import {
    PlayIcon,
    PauseIcon,
    ArrowsRightLeftIcon as ShuffleIcon,
    UserCircleIcon,
    PhotoIcon,
    MusicalNoteIcon,
    QueueListIcon,
    UserIcon,
    HeartIcon as HeartIconOutline,
    ChevronRightIcon,
    ArrowUpOnSquareIcon,
    ShareIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import ContextMenu from '@/Components/ContextMenu';

const isFullUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

const ProfileImagenConPlaceholder = React.memo(({ src, alt, claseImagen, clasePlaceholder, tipo = 'perfil', nombre = '', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const cacheBuster = '';
    const urlImagenCompleta = src ? (isFullUrl(src) ? src : (esStorage ? `/storage/${src}${cacheBuster}` : `${src}${cacheBuster}`)) : null;
    const handleImageError = useCallback(() => {
        setErrorCarga(true);
    }, []);
    useEffect(() => {
        setErrorCarga(false);
    }, [src]);
    const obtenerIniciales = useCallback((nombreCompleto) => {
        if (!nombreCompleto) return '';
        const nombres = nombreCompleto.split(' ');
        const iniciales = nombres.map(n => n.charAt(0)).join('');
        return iniciales.toUpperCase().slice(0, 2);
    }, []);
    const PlaceholderIcono = useCallback(() => {
        switch (tipo) {
            case 'perfil': return <UserCircleIcon className="w-1/2 h-1/2 text-gray-500" />;
            case 'banner': return <PhotoIcon className="w-1/3 h-1/3 text-gray-500" />;
            case 'cancion': case 'playlist': case 'album': case 'ep': case 'single':
                return <MusicalNoteIcon className="w-1/2 h-1/2 text-gray-500" />;
            default: return <PhotoIcon className="w-1/3 h-1/3 text-gray-500" />;
        }
    }, [tipo]);
    const PlaceholderContenido = useCallback(() => {
        if (tipo === 'perfil' && !src && nombre) {
            return <span className="text-white text-4xl font-semibold pointer-events-none">{obtenerIniciales(nombre)}</span>;
        }
        return <PlaceholderIcono />;
    }, [tipo, src, nombre, obtenerIniciales, PlaceholderIcono]);
    const claveParaImagen = urlImagenCompleta ? `img-${urlImagenCompleta}` : null;
    const claveParaPlaceholderWrapper = `ph-wrapper-${tipo}-${alt.replace(/\s+/g, '-')}-${nombre || 'no-nombre'}`;
    return (
        <div className={`${clasePlaceholder} flex items-center justify-center overflow-hidden relative`}>
            {urlImagenCompleta && !errorCarga ? (
                <img
                    key={claveParaImagen}
                    src={urlImagenCompleta}
                    alt={alt}
                    className={claseImagen}
                    onError={handleImageError}
                />
            ) : (
                <div key={claveParaPlaceholderWrapper} className="w-full h-full flex items-center justify-center">
                    <PlaceholderContenido />
                </div>
            )}
        </div>
    );
});
ProfileImagenConPlaceholder.displayName = 'ProfileImagenConPlaceholder';

const CardImagenConPlaceholder = React.memo(({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const urlImagenCompleta = src ? (isFullUrl(src) ? src : (esStorage ? `/storage/${src}` : src)) : null;
    const handleImageError = useCallback(() => setErrorCarga(true), []);
    const PlaceholderContenido = useCallback(() => <MusicalNoteIcon className="w-1/2 h-1/2 text-gray-500" />, []);
    const claveUnicaParaElemento = urlImagenCompleta
        ? `img-card-${urlImagenCompleta}`
        : `placeholder-card-${tipo}-${alt.replace(/\s+/g, '-')}`;
    useEffect(() => {
        setErrorCarga(false);
    }, [src]);
    return urlImagenCompleta && !errorCarga ? (
        <img
            key={claveUnicaParaElemento}
            src={urlImagenCompleta}
            alt={alt}
            className={claseImagen}
            onError={handleImageError}
        />
    ) : (
        <div key={claveUnicaParaElemento} className={`${clasePlaceholder} flex items-center justify-center overflow-hidden`}>
            <PlaceholderContenido />
        </div>
    );
});
CardImagenConPlaceholder.displayName = 'CardImagenConPlaceholder';

const CardListaUsuarios = React.memo(({ tipo, usuarios: usuariosProp, usuarioLogueadoId }) => {
    const usuarios = Array.isArray(usuariosProp) ? usuariosProp : [];
    if (usuarios.length === 0) {
        const textoDefault = tipo === 'playlist' ? 'Sin colaboradores' : 'Artista desconocido';
        return <span className="text-xs text-gray-500 mt-1 truncate w-full">{textoDefault}</span>;
    }
    const MAX_SHOWN = 1;
    let displayOrder = [];
    const processedUserIds = new Set();
    let finalOwner = null;
    let finalAuthUser = null;
    for (const u of usuarios) {
        if (u.id === usuarioLogueadoId) finalAuthUser = u;
        if (u.pivot?.propietario === true) finalOwner = u;
    }
    if (finalAuthUser) {
        displayOrder.push(finalAuthUser);
        processedUserIds.add(finalAuthUser.id);
    }
    if (finalOwner && !processedUserIds.has(finalOwner.id)) {
        if (finalAuthUser) {
            const authIndex = displayOrder.findIndex(u => u.id === finalAuthUser.id);
            if (authIndex !== -1) {
                displayOrder.splice(authIndex + 1, 0, finalOwner);
            } else {
                displayOrder.push(finalOwner);
            }
        } else {
            displayOrder.unshift(finalOwner);
        }
        processedUserIds.add(finalOwner.id);
    }
    usuarios.forEach(u => {
        if (!processedUserIds.has(u.id)) {
            displayOrder.push(u);
        }
    });
    if (displayOrder.length === 0 && usuarios.length > 0) {
        displayOrder = [...usuarios];
    }
    const usuariosMostrados = displayOrder.slice(0, MAX_SHOWN);
    const usuariosTooltip = displayOrder.slice(MAX_SHOWN);
    const textoMostrado = usuariosMostrados.map(u => u.name).join(', ');
    const numOcultos = usuariosTooltip.length;
    const tipoCapitalizado = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Item';
    return (
        <div className="relative group mt-1 w-full">
            <p className="text-xs text-gray-400 truncate w-full cursor-default">
                {tipoCapitalizado} · {textoMostrado}
                {numOcultos > 0 && <span className="font-semibold"> +{numOcultos} más</span>}
            </p>
            {numOcultos > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-700 border border-gray-600 text-white text-xs rounded py-1 px-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                    <ul className="list-none p-0 m-0">{usuariosTooltip.map(u => <li key={u.id} className="py-0.5">{u.name}</li>)}</ul>
                    <svg className="absolute text-gray-700 h-2 w-full left-0 top-full" viewBox="0 0 255 255">
                        <polygon points="0,0 127.5,127.5 255,0" />
                    </svg>
                </div>
            )}
        </div>
    );
});
CardListaUsuarios.displayName = 'CardListaUsuarios';

const getResourceRouteBase = (tipo) => {
    switch (tipo) {
        case 'album': return 'albumes';
        case 'playlist': return 'playlists';
        case 'ep': return 'eps';
        case 'single': return 'singles';
        default: return tipo ? `${tipo}s` : 'items';
    }
};

const ItemCard = React.memo(({ item, tipoPredeterminado, usuarioLogueadoId }) => {
    const tipoItem = item.tipo || tipoPredeterminado;
    const rutaBase = getResourceRouteBase(tipoItem);
    const nombreRuta = `${rutaBase}.show`;
    const rutaExiste = typeof route === 'function' && route().has(nombreRuta);
    const cardWidthClass = 'w-56';
    const cardMinWidth = '14rem';
    const imageSection = (
        <div className="relative w-full aspect-square mb-3">
            <CardImagenConPlaceholder
                src={item.imagen_url || item.imagen}
                alt={`Portada de ${item.nombre}`}
                claseImagen="absolute inset-0 w-full h-full object-cover rounded transition-transform duration-300 ease-in-out group-hover:scale-105"
                clasePlaceholder="absolute inset-0 w-full h-full rounded bg-gray-750 flex items-center justify-center"
                tipo={tipoItem}
                esStorage={true}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded group-hover:scale-105">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white transform transition-transform duration-300 ease-in-out group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                </svg>
            </div>
        </div>
    );
    const textSection = (
        <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
            <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                {item.nombre}
            </span>
            <CardListaUsuarios tipo={tipoItem} usuarios={item.usuarios || [{ name: item.artista, id: `art-${item.id}` }]} usuarioLogueadoId={usuarioLogueadoId} />
        </div>
    );
    const textSectionLinked = (
        <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
            <Link href={route(nombreRuta, item.id)} className="block w-full group">
                <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                    {item.nombre}
                </span>
            </Link>
            <CardListaUsuarios tipo={tipoItem} usuarios={item.usuarios || [{ name: item.artista, id: `art-${item.id}` }]} usuarioLogueadoId={usuarioLogueadoId} />
        </div>
    );
    return (
        <li className="bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl w-56 flex-shrink-0"
            style={{ minWidth: '14rem' }}>
            {rutaExiste ? (
                <>
                    <Link href={route(nombreRuta, item.id)} className="block w-full p-4 pb-0 group">
                        {imageSection}
                    </Link>
                    {textSectionLinked}
                </>
            ) : (
                <div className="block w-full p-4 pb-0 group cursor-default">
                    {imageSection}
                    {textSection}
                </div>
            )}
        </li>
    );
});
ItemCard.displayName = 'ItemCard';

const ProfileDisplayList = React.memo(({ items, usuarioLogueadoId, tipoPredeterminado = 'playlist' }) => {
    const scrollContainerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollAmount = 400;
    const itemsArray = Array.isArray(items) ? items : [];
    const updateScrollability = useCallback(() => {
        const element = scrollContainerRef.current;
        if (element) {
            setCanScrollLeft(element.scrollLeft > 1);
            const maxScrollLeft = element.scrollWidth - element.clientWidth;
            setCanScrollRight(element.scrollLeft < (maxScrollLeft - 1));
        }
    }, []);
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el || itemsArray.length === 0) {
            setCanScrollLeft(false);
            setCanScrollRight(false);
            return;
        }
        updateScrollability();
        el.addEventListener('scroll', updateScrollability, { passive: true });
        window.addEventListener('resize', updateScrollability);
        return () => {
            el.removeEventListener('scroll', updateScrollability);
            window.removeEventListener('resize', updateScrollability);
        };
    }, [updateScrollability, itemsArray.length]);
    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const amount = direction === 'left' ? -scrollAmount : scrollAmount;
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };
    if (!itemsArray || itemsArray.length === 0) {
        return <p className="text-sm text-gray-400 italic px-4 sm:px-6">Aún no has agregado {tipoPredeterminado}s a tu perfil.</p>;
    }
    return (
        <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <button onClick={() => handleScroll('left')} disabled={!canScrollLeft} aria-label="Scroll Left" className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isHovering && canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-auto`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={scrollContainerRef} className="overflow-x-auto px-4 sm:px-6 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <ul className="flex flex-nowrap gap-4 sm:gap-6 py-1">
                    {itemsArray.map(item => (
                        <ItemCard
                            key={`${item.tipo || tipoPredeterminado}-${item.id}`}
                            item={item}
                            tipoPredeterminado={tipoPredeterminado}
                            usuarioLogueadoId={usuarioLogueadoId}
                        />
                    ))}
                </ul>
            </div>
            <button onClick={() => handleScroll('right')} disabled={!canScrollRight} aria-label="Scroll Right" className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isHovering && canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-auto`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
});
ProfileDisplayList.displayName = 'ProfileDisplayList';

const CancionListItem = React.memo(({ item, index, tipoItem, nombreRuta, onPlayPauseClick, isCurrentTrack, isPlayingCurrentTrack, isLoadingTrack, isLiked, onToggleLoopz, isLikeProcessing, onContextMenu }) => {
    const routeExists = useCallback((name) => {
        if (typeof route === 'function' && typeof route().has === 'function') return route().has(name);
        return false;
    }, []);
    const rutaItemExiste = nombreRuta ? routeExists(nombreRuta) : false;
    const [isHovered, setIsHovered] = useState(false);
    const handlePlayButtonClick = useCallback((e) => {
        e.stopPropagation();
        onPlayPauseClick(item, index);
    }, [item, index, onPlayPauseClick]);
    const handleLoopzButtonClick = useCallback((e) => {
        e.stopPropagation();
        onToggleLoopz(item.id, isLiked);
    }, [item, isLiked, onToggleLoopz]);
    const handleContextMenuLocal = useCallback((e) => {
        if (onContextMenu) onContextMenu(e, item);
    }, [onContextMenu, item]);
    return (
        <li className={`flex items-center space-x-3 p-2 transition duration-150 group rounded-md ${isCurrentTrack ? 'bg-indigo-900/30' : 'hover:bg-gray-700/60'} ${onContextMenu ? 'cursor-context-menu' : 'cursor-default'}`}>
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {isLoadingTrack ? (
                    <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2.0A10.006 10 0 002 12h2z"></path>
                    </svg>
                ) : isPlayingCurrentTrack ? (
                    <button onClick={handlePlayButtonClick} className="focus:outline-none">
                        <PauseIcon className="w-5 h-5 text-indigo-400" />
                    </button>
                ) : (isHovered || (isCurrentTrack && !isPlayingCurrentTrack)) ? (
                    <button onClick={handlePlayButtonClick} className="focus:outline-none">
                        <PlayIcon className="w-5 h-5 text-white" />
                    </button>
                ) : (
                    <span className="text-sm text-gray-400 w-full text-center select-none">{index + 1}</span>
                )}
            </div>
            <div className="flex-shrink-0">
                <ProfileImagenConPlaceholder
                    src={item.foto_url}
                    alt={`Portada de ${item.titulo}`}
                    claseImagen="w-10 h-10 rounded object-cover"
                    clasePlaceholder="w-10 h-10 rounded bg-gray-700 text-gray-400 flex items-center justify-center"
                    tipo={tipoItem}
                    esStorage={item.foto_url && !(item.foto_url.startsWith('http://') || item.foto_url.startsWith('https://'))}
                />
            </div>
            <div className="flex-grow min-w-0">
                {rutaItemExiste ? (
                    <Link href={route(nombreRuta, item.id)} className="text-sm font-medium text-gray-100 group-hover:text-white hover:underline truncate block" title={item.titulo}>
                        {item.titulo}
                    </Link>
                ) : (
                    <span className="text-sm font-medium text-gray-200 truncate block" title={item.titulo}>
                        {item.titulo}
                    </span>
                )}
                {item.artista && (
                    <p className="text-xs text-gray-400 truncate">
                        {item.usuarios && Array.isArray(item.usuarios) && item.usuarios.length > 0 ? (
                            item.usuarios.map((u, idx) => (
                                <React.Fragment key={u.id}>
                                    <Link href={route('profile.show', u.id)} className="hover:underline">{u.name}</Link>
                                    {idx < item.usuarios.length - 1 && ', '}
                                </React.Fragment>
                            ))
                        ) : typeof item.artista === 'string' ? (
                            item.artista
                        ) : (
                            item.artista?.name
                        )}
                    </p>
                )}
            </div>
            <div className="flex-shrink-0">
                <button
                    onClick={handleLoopzButtonClick}
                    disabled={isLikeProcessing}
                    className={`p-1 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${isLikeProcessing ? 'text-gray-500 cursor-wait' : 'text-gray-400 hover:text-purple-400'}`}
                    title={isLiked ? "Quitar LoopZ" : "Añadir a LoopZ"}
                >
                    {isLikeProcessing ? (
                        <svg className="h-5 w-5 animate-spin text-purple-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        </svg>
                    ) : isLiked ? (
                        <HeartIconSolid className="h-5 w-5 text-purple-500" />
                    ) : (
                        <HeartIconOutline className="h-5 w-5" />
                    )}
                </button>
            </div>
        </li>
    );
});
CancionListItem.displayName = 'CancionListItem';

const ProfileCancionesList = ({ items, tipoItem, nombreRuta, onPlayPauseSong, currentTrackId, Reproduciendo, isPlayerLoading, currentSourceId, mainSourceId, onToggleLoopz, likeProcessingSongId, onContextMenu }) => {
    if (!items || items.length === 0) {
        return <p className="text-sm text-gray-400 italic px-4 sm:px-6">Aún no has agregado {tipoItem}s a tu perfil.</p>;
    }
    return (
        <ul className="space-y-1 px-4 sm:px-6">
            {items.map((item, index) => {
                const isThisCurrentTrack = item.id === currentTrackId && currentSourceId === mainSourceId;
                const isLoadingThisTrack = isPlayerLoading && isThisCurrentTrack && !Reproduciendo;
                const isLikeProcessing = likeProcessingSongId === item.id;
                return (
                    <CancionListItem
                        key={item.id}
                        item={item}
                        index={index}
                        tipoItem={tipoItem}
                        nombreRuta={nombreRuta}
                        onPlayPauseClick={onPlayPauseSong}
                        isCurrentTrack={isThisCurrentTrack}
                        isPlayingCurrentTrack={isThisCurrentTrack && Reproduciendo}
                        isLoadingTrack={isLoadingThisTrack}
                        isLiked={item.is_in_user_loopz}
                        onToggleLoopz={onToggleLoopz}
                        isLikeProcessing={isLikeProcessing}
                        onContextMenu={onContextMenu}
                    />
                );
            })}
        </ul>
    );
};
ProfileCancionesList.displayName = 'ProfileCancionesList';

const ModalSeguidores = ({ usuarios, titulo, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-75" onClick={onClose}></div>
            <div className="relative bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-96 overflow-y-auto p-5 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">{titulo}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <ul className="space-y-3">
                    {usuarios.map(usuario => (
                        <li key={usuario.id} className="flex items-center space-x-3">
                            <ProfileImagenConPlaceholder
                                src={usuario.foto_perfil}
                                alt={`Perfil de ${usuario.name}`}
                                claseImagen="w-10 h-10 rounded-full"
                                clasePlaceholder="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
                                tipo="perfil"
                                esStorage={true}
                            />
                            <Link href={route('profile.show', usuario.id)} className="text-sm font-medium text-gray-200 hover:text-white">
                                {usuario.name}
                            </Link>
                        </li>
                    ))}
                    {usuarios.length === 0 && <p className="text-sm text-gray-400 italic">No hay usuarios</p>}
                </ul>
            </div>
        </div>
    );
};

export default function Index() {
    const { props, url } = usePage();
    const {
        usuario,
        cancionesUsuario = [],
        playlistsUsuario = [],
        albumesUsuario = [],
        epsUsuario = [],
        singlesUsuario = [],
        auth,
        seguidores_count,
        seguidos_count,
        is_following
    } = props;

    const usuarioLogueadoId = auth?.user?.id ?? null;
    const esCreador = auth?.user?.id === usuario.id;

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
        añadirSiguiente = () => {}
    } = playerContextValue || {};

    const userSongsSourceId = `user-${usuario.id}-all-canciones`;
    const isCurrentSourcePlayingUserSongs = sourceId === userSongsSourceId && Reproduciendo;
    const isPlayerLoadingThisSource = isPlayerLoading && sourceId === userSongsSourceId;

    const [cancionesUsuarioState, setCancionesUsuarioState] = useState(cancionesUsuario);
    const [likeProcessingSongId, setLikeProcessingSongId] = useState(null);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, song: null });
    const contextMenuTimer = useRef(null);
    const [mostrarModalSeguidores, setMostrarModalSeguidores] = useState(false);
    const [mostrarModalSeguidos, setMostrarModalSeguidos] = useState(false);

    const openContextMenu = useCallback((event, song) => {
        event.preventDefault();
        setContextMenu({
            show: true,
            x: event.pageX,
            y: event.pageY,
            song
        });
    }, []);

    const closeContextMenu = useCallback(() => {
        if (contextMenuTimer.current) clearTimeout(contextMenuTimer.current);
        setContextMenu(prev => ({ ...prev, show: false, song: null }));
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

    const manejarToggleCancion = useCallback((songId, playlistId) => {
        if (!songId || !playlistId) return;
        router.post(route('playlist.toggleCancion', { playlist: playlistId, cancion: songId }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (page.props.cancionesUsuario && Array.isArray(page.props.cancionesUsuario)) {
                    setCancionesUsuarioState(page.props.cancionesUsuario);
                }
            },
        });
    }, []);

    const handlePlayPauseUserSongs = useCallback(() => {
        if (!cancionesUsuarioState || cancionesUsuarioState.length === 0) return;
        if (sourceId === userSongsSourceId) {
            Reproduciendo ? pause() : play();
        } else {
            const formattedSongs = cancionesUsuarioState.map(cancion => ({ ...cancion }));
            cargarColaYIniciar(formattedSongs, { id: userSongsSourceId, name: `Canciones de ${usuario.name}`, type: 'userCollection', iniciar: 0 });
        }
    }, [cancionesUsuarioState, pause, play, sourceId, userSongsSourceId, Reproduciendo, cargarColaYIniciar, usuario.name]);

    const handlePlayPauseSingleSong = useCallback((songToPlay, songIndexInList) => {
        if (!cancionesUsuarioState || cancionesUsuarioState.length === 0) return;
        const isClickedSongCurrent = cancionActual && cancionActual.id === songToPlay.id && sourceId === userSongsSourceId;
        if (isClickedSongCurrent) {
            Reproduciendo ? pause() : play();
        } else {
            const formattedSongs = cancionesUsuarioState.map(song => ({ ...song }));
            cargarColaYIniciar(formattedSongs, {
                id: userSongsSourceId,
                name: `Canciones de ${usuario.name}`,
                type: 'userCollection',
                iniciar: songIndexInList,
                clickDirecto: true
            });
        }
    }, [cancionesUsuarioState, cancionActual, sourceId, userSongsSourceId, Reproduciendo, pause, play, cargarColaYIniciar, usuario.name]);

    const handleToggleLoopzSong = useCallback((songId, isInLoopz) => {
        if (!songId || likeProcessingSongId === songId) return;
        setLikeProcessingSongId(songId);
        setCancionesUsuarioState(prev =>
            prev.map(song => (song.id === songId ? { ...song, is_in_user_loopz: !isInLoopz } : song))
        );
        router.post(route('cancion.loopz', { cancion: songId }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (page.props.cancionesUsuario && Array.isArray(page.props.cancionesUsuario)) {
                    setCancionesUsuarioState(page.props.cancionesUsuario);
                }
            },
            onError: () => {
                setCancionesUsuarioState(prev =>
                    prev.map(song => (song.id === songId ? { ...song, is_in_user_loopz: isInLoopz } : song))
                );
            },
            onFinish: () => setLikeProcessingSongId(null),
        });
    }, [likeProcessingSongId]);

    const getContextMenuOptions = useCallback(() => {
        if (!contextMenu.song) return [];
        const options = [
            {
                label: "Ver canción",
                icon: <MusicalNoteIcon className="h-5 w-5" />,
                action: () => {
                    router.visit(route('canciones.show', contextMenu.song.id));
                    closeContextMenu();
                },
            },
            {
                label: contextMenu.song.is_in_user_loopz ? "Quitar LoopZ" : "Añadir a LoopZ",
                icon: contextMenu.song.is_in_user_loopz ? <HeartIconSolid className="h-5 w-5 text-purple-500" /> : <HeartIconOutline className="h-5 w-5" />,
                action: () => handleToggleLoopzSong(contextMenu.song.id, contextMenu.song.is_in_user_loopz),
                disabled: likeProcessingSongId === contextMenu.song.id,
            }
        ];
        if (añadirSiguiente) {
            options.push({
                label: "Añadir a la cola",
                icon: <QueueListIcon className="h-5 w-5" />,
                action: handleAddToQueueNext,
            });
        }
        if (contextMenu.song.usuarios && Array.isArray(contextMenu.song.usuarios) && contextMenu.song.usuarios.length > 0) {
            const artistSubmenuOptions = contextMenu.song.usuarios.map(artist => ({
                label: artist.name,
                icon: <UserIcon className="h-5 w-5" />,
                action: () => handleViewArtist(artist),
                disabled: !artist?.id || !artist?.name,
            }));
            options.push({
                label: `Ver artista${contextMenu.song.usuarios.length > 1 ? 's' : ''}`,
                icon: <UserIcon className="h-5 w-5" />,
                submenu: artistSubmenuOptions,
                disabled: artistSubmenuOptions.length === 0,
            });
        }
        return options;
    }, [contextMenu.song, handleToggleLoopzSong, likeProcessingSongId, añadirSiguiente, handleAddToQueueNext, manejarToggleCancion, auth.user?.playlists, handleViewArtist]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Perfil" />
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                show={contextMenu.show}
                onClose={closeContextMenu}
                options={getContextMenuOptions()}
                userPlaylists={(auth.user?.playlists || []).map(p => ({
                    id: p.id,
                    name: p.nombre,
                    canciones: p.canciones || [],
                    imagen: p.imagen,
                    action: () => manejarToggleCancion(contextMenu.song?.id, p.id)
                }))}
                currentSong={contextMenu.song}
            />
            <div key={url} className="pt-16 pb-12 min-h-screen">
                <div className="mx-auto max-w-7xl space-y-10 sm:px-6 lg:px-8">
                    <div className="relative">
                        <div className="bg-gray-800 shadow-xl sm:rounded-lg overflow-hidden">
                            <div className="w-full h-52 sm:h-72 bg-gray-700 flex items-center justify-center">
                                {usuario.banner_perfil && (
                                    <img
                                        src={usuario.banner_perfil}
                                        alt="Banner del perfil"
                                        className="object-cover w-full h-full"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 z-10">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-800 shadow-md">
                                {usuario.foto_perfil ? (
                                    <img
                                        src={usuario.foto_perfil}
                                        alt={`Foto de ${usuario.name}`}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white text-4xl font-semibold">{usuario.name[0]}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-64 sm:mt-96 px-4 sm:px-6">
                        <div className="flex justify-end mb-4">
                            <Link
                                href={route('profile.edit')}
                                className="inline-flex items-center px-4 py-2 bg-transparent border border-gray-600 rounded-full font-semibold text-xs text-gray-200 uppercase tracking-widest hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ease-in-out duration-150"
                            >
                                Editar perfil
                            </Link>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
                            <div className="flex flex-col items-start">
                                <h3 className="text-3xl font-bold text-white">{usuario.name}</h3>
                                <div className="flex items-center mt-2 text-sm text-gray-400">
                                    <button
                                        className="hover:text-white transition-colors"
                                        onClick={() => setMostrarModalSeguidores(true)}
                                    >
                                        <span className="font-medium text-gray-200">{seguidores_count}</span> seguidores
                                    </button>
                                    <span className="mx-2">·</span>
                                    <button
                                        className="hover:text-white transition-colors"
                                        onClick={() => setMostrarModalSeguidos(true)}
                                    >
                                        <span className="font-medium text-gray-200">{seguidos_count}</span> seguidos
                                    </button>
                                </div>
                            </div>
                            {!esCreador && (
                                <button
                                    onClick={() => {
                                        router.post(route('profile.seguirUsuario', usuario.id), {}, {
                                            preserveScroll: true,
                                            onSuccess: (page) => {
                                                props.is_following = page.props.is_following;
                                                props.seguidores_count = page.props.seguidores_count;
                                            }
                                        });
                                    }}
                                    className={`mt-4 sm:mt-0 px-6 py-2 rounded-full text-sm font-medium ${
                                        is_following ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500`}
                                >
                                    {is_following ? 'Dejar de seguir' : 'Seguir'}
                                </button>
                            )}
                            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                                {cancionesUsuarioState.length > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handlePlayPauseUserSongs}
                                            disabled={isPlayerLoadingThisSource || !cancionesUsuarioState.length}
                                            aria-label={isCurrentSourcePlayingUserSongs ? 'Pausar canciones del usuario' : 'Reproducir todas las canciones del usuario'}
                                            className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-md hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <PlayIcon className="h-6 w-6" />
                                        </button>
                                        <button
                                            onClick={() => toggleAleatorio()}
                                            disabled={!cancionesUsuarioState.length}
                                            aria-label={aleatorio ? 'Desactivar modo aleatorio' : 'Activar modo aleatorio'}
                                            className={`flex items-center justify-center p-3 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed ${
                                                aleatorio ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            <ShuffleIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Canciones</h3>
                            <ProfileCancionesList
                                items={cancionesUsuarioState}
                                tipoItem="cancion"
                                nombreRuta={null}
                                onPlayPauseSong={handlePlayPauseSingleSong}
                                currentTrackId={cancionActual?.id}
                                Reproduciendo={Reproduciendo}
                                isPlayerLoading={isPlayerLoading}
                                currentSourceId={sourceId}
                                mainSourceId={userSongsSourceId}
                                onToggleLoopz={handleToggleLoopzSong}
                                likeProcessingSongId={likeProcessingSongId}
                                onContextMenu={openContextMenu}
                            />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Playlists</h3>
                            <ProfileDisplayList items={playlistsUsuario} usuarioLogueadoId={usuarioLogueadoId} tipoPredeterminado="playlist" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Álbumes</h3>
                            <ProfileDisplayList items={albumesUsuario} usuarioLogueadoId={usuarioLogueadoId} tipoPredeterminado="album" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">EPs</h3>
                            <ProfileDisplayList items={epsUsuario} usuarioLogueadoId={usuarioLogueadoId} tipoPredeterminado="ep" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Singles</h3>
                            <ProfileDisplayList items={singlesUsuario} usuarioLogueadoId={usuarioLogueadoId} tipoPredeterminado="single" />
                        </div>
                    </div>
                </div>
            </div>
            <ModalSeguidores
                usuarios={props.seguidores || []}
                titulo="Seguidores"
                isOpen={mostrarModalSeguidores}
                onClose={() => setMostrarModalSeguidores(false)}
            />
            <ModalSeguidores
                usuarios={props.seguidos || []}
                titulo="Siguiendo"
                isOpen={mostrarModalSeguidos}
                onClose={() => setMostrarModalSeguidos(false)}
            />
        </AuthenticatedLayout>
    );
}