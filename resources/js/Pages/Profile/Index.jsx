import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { PlayerContext } from '@/contexts/PlayerContext';
import {
    PlayIcon as PlayIconSolid,
    PauseIcon as PauseIconSolid,
    ArrowsRightLeftIcon as ShuffleIcon,
    UserCircleIcon,
    PhotoIcon,
    MusicalNoteIcon as MusicalNoteIconSolid,
} from '@heroicons/react/24/solid';
import { ArrowPathIcon as LoadingIcon } from '@heroicons/react/20/solid';

const ProfileImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder, tipo = 'perfil', nombre = '', esStorage = false }) => {
    const [loading, setLoading] = useState(true);
    const [errorCarga, setErrorCarga] = useState(false);
    const cacheBuster = '';
    const baseUrl = esStorage ? '/storage/' : '';
    const urlImagenCompleta = src ? `${baseUrl}${src}${cacheBuster}` : null;

    const handleImageError = useCallback(() => {
        setErrorCarga(true);
        setLoading(false);
    }, []);

    const handleImageLoad = useCallback(() => {
        setLoading(false);
        setErrorCarga(false);
    }, []);

    useEffect(() => {
        if (src) {
            setLoading(true);
            setErrorCarga(false);
        } else {
            setLoading(false);
            setErrorCarga(false);
        }
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
                return <MusicalNoteIconSolid className="w-1/2 h-1/2 text-gray-500" />;
            default: return <PhotoIcon className="w-1/3 h-1/3 text-gray-500" />;
        }
    }, [tipo]);

    const PlaceholderContenido = useCallback(() => {
        if (tipo === 'perfil' && !src && !esStorage && nombre) {
            return <span className="text-white text-4xl font-semibold pointer-events-none">{obtenerIniciales(nombre)}</span>;
        }
        return <PlaceholderIcono />;
    }, [tipo, src, esStorage, nombre, obtenerIniciales, PlaceholderIcono]);

    const claveParaImagen = urlImagenCompleta ? `img-${urlImagenCompleta}` : null;
    const claveParaPlaceholderWrapper = `ph-wrapper-${tipo}-${alt.replace(/\s+/g, '-')}-${nombre || 'no-nombre'}`;

    return (
        <div className={`${clasePlaceholder} flex items-center justify-center overflow-hidden relative`}>
            {loading && urlImagenCompleta && !errorCarga && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 animate-pulse">
                    <LoadingIcon className="w-8 h-8 text-gray-400" />
                </div>
            )}
            {urlImagenCompleta && !errorCarga ? (
                <img
                    key={claveParaImagen}
                    src={urlImagenCompleta}
                    alt={alt}
                    className={`${claseImagen} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading="lazy"
                />
            ) : (
                <div key={claveParaPlaceholderWrapper} className="w-full h-full flex items-center justify-center">
                    <PlaceholderContenido />
                </div>
            )}
            {errorCarga && src && (
                <div key={`${claveParaPlaceholderWrapper}-error`} className="absolute inset-0 flex items-center justify-center">
                    <PlaceholderIcono />
                </div>
            )}
        </div>
    );
};

const CardImagenConPlaceholder = React.memo(({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const baseUrl = esStorage ? '/storage/' : '';
    const urlImagenCompleta = src ? `${baseUrl}${src}` : null;

    const handleImageError = useCallback(() => { setErrorCarga(true); }, []);

    const PlaceholderContenido = useCallback(() => (
        <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
    ), []);

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
            loading="lazy"
        />
    ) : (
        <div key={claveUnicaParaElemento} className={`${clasePlaceholder} flex items-center justify-center overflow-hidden`}>
            <PlaceholderContenido />
        </div>
    );
});

const CardListaUsuarios = React.memo(({ tipo, usuarios: usuariosProp, usuarioLogueadoId }) => {
    const usuarios = Array.isArray(usuariosProp) ? usuariosProp : [];
    if (usuarios.length === 0) {
        const textoDefault = tipo === 'playlist' ? 'Sin colaboradores' : 'Artista desconocido';
        return <span className="text-xs text-gray-500 mt-1 truncate w-full">{textoDefault}</span>;
    }

    const MAX_SHOWN = 1;
    let displayOrder = [], owner = null, authUser = null;

    for (const u of usuarios) {
        if (u.pivot?.propietario === true) owner = u;
        if (u.id === usuarioLogueadoId) authUser = u;
        if (owner && authUser) break;
    }

    const addedIds = new Set();
    if (authUser) { displayOrder.push(authUser); addedIds.add(authUser.id); }
    if (owner && !addedIds.has(owner.id)) {
        if (!authUser) displayOrder.unshift(owner); else displayOrder.push(owner);
        addedIds.add(owner.id);
    }
    usuarios.forEach(u => { if (!addedIds.has(u.id)) { displayOrder.push(u); addedIds.add(u.id); } });
    if (displayOrder.length === 0 && usuarios.length > 0) displayOrder = [...usuarios];

    const usuariosMostrados = displayOrder.slice(0, MAX_SHOWN);
    const usuariosTooltip = displayOrder.slice(MAX_SHOWN);
    const textoMostrado = usuariosMostrados.map(u => u.name).join(', ');
    const numOcultos = usuariosTooltip.length;
    const tipoCapitalizado = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Item';
    const tituloCompleto = `${tipoCapitalizado} · ${displayOrder.map(u => u.name).join(', ')}`;

    return (
        <div className="relative group mt-1 w-full">
            <p className="text-xs text-gray-400 truncate w-full cursor-default" title={tituloCompleto}>
                {tipoCapitalizado} · {textoMostrado}
                {numOcultos > 0 && <span className="font-semibold"> +{numOcultos} más</span>}
            </p>
            {numOcultos > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-700 border border-gray-600 text-white text-xs rounded py-1 px-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                    <ul className="list-none p-0 m-0">{usuariosTooltip.map(u => <li key={u.id} className="py-0.5">{u.name}</li>)}</ul>
                    <svg className="absolute text-gray-700 h-2 w-full left-0 top-full" viewBox="0 0 255 255" xmlSpace="preserve">
                        <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                    </svg>
                </div>
            )}
        </div>
    );
});

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

    return (
        <li className={`bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl w-48 sm:w-56 flex-shrink-0`}>
            {rutaExiste ? (
                <Link href={route(nombreRuta, item.id)} className="block w-full p-4 pb-0 group">
                    <div className="relative w-full aspect-square mb-3">
                        <CardImagenConPlaceholder src={item.imagen_url || item.imagen} alt={`Portada de ${item.nombre}`} claseImagen="absolute inset-0 w-full h-full object-cover rounded transition-transform duration-300 ease-in-out group-hover:scale-105" clasePlaceholder="absolute inset-0 w-full h-full rounded bg-gray-750 flex items-center justify-center" tipo={tipoItem} esStorage={true} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                            <PlayIconSolid className="w-10 h-10 sm:w-12 sm:h-12 text-white transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                        </div>
                    </div>
                    <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>{item.nombre}</span>
                        <CardListaUsuarios tipo={tipoItem} usuarios={item.usuarios || (item.artista ? [{ name: item.artista, id: `art-${item.id}` }] : [])} usuarioLogueadoId={usuarioLogueadoId} />
                    </div>
                </Link>
            ) : (
                <div className="block w-full p-4 pb-0 group cursor-default">
                    <div className="relative w-full aspect-square mb-3">
                        <CardImagenConPlaceholder src={item.imagen_url || item.imagen} alt={`Portada de ${item.nombre}`} claseImagen="absolute inset-0 w-full h-full object-cover rounded transition-transform duration-300 ease-in-out group-hover:scale-105" clasePlaceholder="absolute inset-0 w-full h-full rounded bg-gray-750 flex items-center justify-center" tipo={tipoItem} esStorage={true} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                            <PlayIconSolid className="w-10 h-10 sm:w-12 sm:h-12 text-white transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                        </div>
                    </div>
                    <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>{item.nombre}</span>
                        <CardListaUsuarios tipo={tipoItem} usuarios={item.usuarios || (item.artista ? [{ name: item.artista, id: `art-${item.id}` }] : [])} usuarioLogueadoId={usuarioLogueadoId} />
                    </div>
                </div>
            )}
        </li>
    );
});

const ProfileDisplayList = ({ items, usuarioLogueadoId, tipoPredeterminado = 'playlist' }) => {
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
            <button onClick={() => handleScroll('left')} disabled={!canScrollLeft} aria-label="Scroll Left" className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${isHovering && canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={scrollContainerRef} className="overflow-x-auto px-4 sm:px-6 pb-1 -mb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
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
            <button onClick={() => handleScroll('right')} disabled={!canScrollRight} aria-label="Scroll Right" className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${isHovering && canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
};

const CancionListItem = React.memo(({
    item,
    index,
    tipoItem,
    nombreRuta,
    onPlayPauseClick,
    isCurrentTrack,
    isPlayingCurrentTrack,
    isLoadingTrack
}) => {
    const routeExists = useCallback((name) => {
        if (typeof route === 'function' && typeof route().has === 'function') return route().has(name);
        return false;
    }, []);
    const rutaItemExiste = routeExists(nombreRuta);

    const [isHovered, setIsHovered] = useState(false);

    const handlePlayButtonClick = (e) => {
        e.stopPropagation();
        onPlayPauseClick();
    };

    return (
        <li
            className="flex items-center space-x-3 p-2 hover:bg-gray-700/60 transition duration-150 ease-in-out group rounded-md cursor-default"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {isLoadingTrack ? (
                    <LoadingIcon className="w-5 h-5 text-white animate-spin" />
                ) : isPlayingCurrentTrack ? (
                    <button onClick={handlePlayButtonClick} className="focus:outline-none" aria-label="Pausar">
                        <PauseIconSolid className="w-5 h-5 text-indigo-400" />
                    </button>
                ) : (isHovered || (isCurrentTrack && !isPlayingCurrentTrack)) ? (
                    <button onClick={handlePlayButtonClick} className="focus:outline-none" aria-label={isCurrentTrack ? "Continuar reproducción" : "Reproducir"}>
                        <PlayIconSolid className="w-5 h-5 text-white" />
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
                    esStorage={!(item.foto_url?.startsWith('http') || item.foto_url?.startsWith('/storage/'))}
                />
            </div>

            <div className="flex-grow min-w-0">
                {rutaItemExiste ? (
                    <Link
                        href={route(nombreRuta, item.id)}
                        className={`text-sm font-medium ${isCurrentTrack ? 'text-indigo-400' : 'text-gray-100 group-hover:text-white'} hover:underline truncate block`}
                        title={item.titulo}
                    >
                        {item.titulo}
                    </Link>
                ) : (
                    <span
                        className={`text-sm font-medium ${isCurrentTrack ? 'text-indigo-400' : 'text-gray-200'} truncate block`}
                        title={item.titulo}
                    >
                        {item.titulo}
                    </span>
                )}
                {item.artista && (
                    <p className="text-xs text-gray-400 truncate">
                        {typeof item.artista === 'string' ? item.artista : item.artista?.name}
                    </p>
                )}
            </div>
        </li>
    );
});

const ProfileCancionesList = ({
    items,
    tipoItem,
    nombreRuta,
    onPlayPauseSong,
    currentTrackId,
    isPlaying,
    isPlayerLoading,
    currentSourceId,
    mainSourceId
}) => {
    if (!items || items.length === 0) {
        return <p className="text-sm text-gray-400 italic px-4 sm:px-6">Aún no has agregado {tipoItem}s a tu perfil.</p>;
    }

    return (
        <ul className="space-y-1 px-4 sm:px-6">
            {items.map((item, index) => {
                const isThisCurrentTrack = item.id === currentTrackId && currentSourceId === mainSourceId;
                const isLoadingThisTrack = isPlayerLoading && isThisCurrentTrack && !isPlaying;

                return (
                    <CancionListItem
                        key={item.id}
                        item={item}
                        index={index}
                        tipoItem={tipoItem}
                        nombreRuta={nombreRuta}
                        onPlayPauseClick={() => onPlayPauseSong(item, index)}
                        isCurrentTrack={isThisCurrentTrack}
                        isPlayingCurrentTrack={isThisCurrentTrack && isPlaying}
                        isLoadingTrack={isLoadingThisTrack}
                    />
                );
            })}
        </ul>
    );
};

export default function Index() {
    const { auth, cancionesUsuario = [], playlistsUsuario = [], albumesUsuario = [], epsUsuario = [], singlesUsuario = [] } = usePage().props;
    const usuario = auth.user;
    const usuarioLogueadoId = auth.user.id;
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

    const userSongsSourceId = `user-${usuario.id}-all-songs`;
    const isCurrentSourcePlayingUserSongs = sourceId === userSongsSourceId && isPlaying;
    const isPlayerLoadingThisSource = isPlayerLoading && sourceId === userSongsSourceId && !isPlaying && (!currentTrack || cancionesUsuario.some(s => s.id === currentTrack.id));

    const handlePlayPauseUserSongs = useCallback(() => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        if (isCurrentSourcePlayingUserSongs) {
            pause();
        } else {
            if (sourceId === userSongsSourceId && !isPlaying && currentTrack) {
                play();
            } else {
                const formattedSongs = cancionesUsuario.map(song => ({ ...song, }));
                loadQueueAndPlay(formattedSongs, { id: userSongsSourceId, name: `Canciones de ${usuario.name}`, type: 'userCollection', startIndex: 0 });
            }
        }
    }, [cancionesUsuario, isCurrentSourcePlayingUserSongs, pause, sourceId, userSongsSourceId, isPlaying, currentTrack, play, loadQueueAndPlay, usuario.name]);

    const handleToggleShuffleUserSongs = useCallback(() => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        toggleShuffle();
    }, [cancionesUsuario, toggleShuffle]);

    const handlePlayPauseSingleSong = useCallback((songToPlay, songIndexInList) => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;

        if (currentTrack && currentTrack.id === songToPlay.id && sourceId === userSongsSourceId) {
            if (isPlaying) {
                pause();
            } else {
                play();
            }
        } else {
            const formattedSongs = cancionesUsuario.map(song => ({ ...song }));
            loadQueueAndPlay(formattedSongs, {
                id: userSongsSourceId,
                name: `Canciones de ${usuario.name}`,
                type: 'userCollection',
                startIndex: songIndexInList,
                isDirectClick: true
            });
        }
    }, [cancionesUsuario, currentTrack, sourceId, userSongsSourceId, isPlaying, pause, play, loadQueueAndPlay, usuario.name]);

    return (
        <AuthenticatedLayout user={auth.user} header={<div className="flex justify-between items-center"><h2 className="text-2xl font-bold leading-tight text-gray-100">Mi Perfil</h2></div>}>
            <Head title="Perfil" />
            <div className="py-12 min-h-screen">
                <div className="mx-auto max-w-7xl space-y-10 sm:px-6 lg:px-8">
                    <div className="relative px-4 sm:px-0">
                        <div className="bg-gray-800 shadow-xl sm:rounded-lg overflow-hidden">
                            <ProfileImagenConPlaceholder src={usuario.banner_perfil} alt="Banner del perfil" claseImagen="w-full h-52 sm:h-72 object-cover" clasePlaceholder="w-full h-52 sm:h-72 bg-gray-700" tipo="banner" esStorage={true} />
                        </div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 sm:translate-y-1/2">
                            <ProfileImagenConPlaceholder src={usuario.foto_perfil} alt={`Foto de perfil de ${usuario.name}`} claseImagen="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-slate-900 shadow-2xl" clasePlaceholder="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-slate-900 bg-gray-700 flex items-center justify-center text-white text-4xl sm:text-5xl shadow-2xl" tipo="perfil" nombre={usuario.name} esStorage={true} />
                        </div>
                    </div>

                    <div className="pt-20 sm:pt-24">
                        <div className="p-6 sm:p-8 bg-gray-800 shadow-xl sm:rounded-lg text-center mx-4 sm:mx-0">
                            <h3 className="text-3xl font-bold text-gray-100 mb-1">{usuario.name}</h3>
                            <p className="text-md text-gray-400 mb-6">{usuario.email}</p>
                            {cancionesUsuario && cancionesUsuario.length > 0 && (
                                <div className="flex items-center justify-center space-x-4 mb-6">
                                    <button
                                        onClick={handlePlayPauseUserSongs}
                                        disabled={isPlayerLoadingThisSource || !cancionesUsuario || cancionesUsuario.length === 0}
                                        aria-label={isCurrentSourcePlayingUserSongs ? 'Pausar canciones del usuario' : (sourceId === userSongsSourceId && currentTrack ? 'Continuar reproducción de canciones del usuario' : 'Reproducir todas las canciones del usuario')}
                                        className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-md hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isPlayerLoadingThisSource ? <LoadingIcon className="w-6 h-6 animate-spin" /> : isCurrentSourcePlayingUserSongs ? <PauseIconSolid className="w-6 h-6" /> : <PlayIconSolid className="w-6 h-6" />}
                                    </button>
                                    <button
                                        onClick={handleToggleShuffleUserSongs}
                                        disabled={!cancionesUsuario || cancionesUsuario.length === 0}
                                        aria-label={isShuffled ? "Desactivar modo aleatorio para canciones del usuario" : "Activar modo aleatorio para canciones del usuario"}
                                        className={`flex items-center justify-center p-3 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed ${
                                            isShuffled
                                                ? 'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500'
                                                : 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white focus:ring-gray-500'
                                        }`}
                                    >
                                        <ShuffleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                            <div className="mt-4">
                                <Link
                                    href={route('profile.edit')}
                                    className="inline-flex items-center px-6 py-2 bg-gray-700 border border-gray-600 rounded-full font-semibold text-xs text-gray-200 uppercase tracking-widest hover:bg-gray-600 focus:bg-gray-600 active:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                >
                                    Ajustes del Perfil
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Canciones</h3>
                        <ProfileCancionesList
                            items={cancionesUsuario}
                            tipoItem="cancion"
                            onPlayPauseSong={handlePlayPauseSingleSong}
                            currentTrackId={currentTrack?.id}
                            isPlaying={isPlaying}
                            isPlayerLoading={isPlayerLoading}
                            currentSourceId={sourceId}
                            mainSourceId={userSongsSourceId}
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
        </AuthenticatedLayout>
    );
}
