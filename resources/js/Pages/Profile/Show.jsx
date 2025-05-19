import React, { useState, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { PlayerContext } from '@/contexts/PlayerContext';
import {
    PlayIcon as PlayIconSolid,
    PauseIcon as PauseIconSolid,
    ArrowsRightLeftIcon as ShuffleIcon,
    UserCircleIcon,
    PhotoIcon,
    MusicalNoteIcon as MusicalNoteIconSolid,
    QueueListIcon,
    UserIcon,
    HeartIcon as HeartIconOutline,
    ChevronRightIcon
} from '@heroicons/react/24/solid';
import { ArrowPathIcon as LoadingIcon } from '@heroicons/react/20/solid';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import ContextMenu from '@/Components/ContextMenu';
import PropTypes from 'prop-types';

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
                return <MusicalNoteIconSolid className="w-1/2 h-1/2 text-gray-500" />;

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
                    className={`${claseImagen}`}
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
ProfileImagenConPlaceholder.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string.isRequired,
    claseImagen: PropTypes.string,
    clasePlaceholder: PropTypes.string,
    tipo: PropTypes.string,
    nombre: PropTypes.string,
    esStorage: PropTypes.bool,
};
ProfileImagenConPlaceholder.displayName = 'ProfileImagenConPlaceholder';

const CardImagenConPlaceholder = React.memo(({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const urlImagenCompleta = src ? (isFullUrl(src) ? src : (esStorage ? `/storage/${src}` : src)) : null;
    const handleImageError = useCallback(() => { setErrorCarga(true); }, []);
    const PlaceholderContenido = useCallback(() => (
             <MusicalNoteIconSolid className="w-1/2 h-1/2 text-gray-500" />
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
        />
    ) : (
        <div key={claveUnicaParaElemento} className={`${clasePlaceholder} flex items-center justify-center overflow-hidden`}>
            <PlaceholderContenido />
        </div>
    );
});
CardImagenConPlaceholder.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string.isRequired,
    claseImagen: PropTypes.string,
    clasePlaceholder: PropTypes.string,
    tipo: PropTypes.string,
    esStorage: PropTypes.bool,
};
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
    for(const u of usuarios) {
          if(u.id === usuarioLogueadoId) finalAuthUser = u;
          if(u.pivot?.propietario === true) finalOwner = u;
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
                    <svg className="absolute text-gray-700 h-2 w-full
 left-0 top-full" viewBox="0 0 255 255" xmlSpace="preserve">
                        <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                    </svg>
                </div>
            )}
        </div>
    );
});
CardListaUsuarios.propTypes = {
    tipo: PropTypes.string,
    usuarios: PropTypes.array,
    usuarioLogueadoId: PropTypes.number,
};
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
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white transform transition-transform duration-300 ease-in-out group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
            </div>
        </div>
    );
    const textSection = (
        <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
            <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                {item.nombre}
            </span>
            <CardListaUsuarios tipo={tipoItem} usuarios={item.usuarios || (item.artista ? [{ name: item.artista, id: `art-${item.id}` }] : [])} usuarioLogueadoId={usuarioLogueadoId} />
        </div>
    );
    const textSectionLinked = (
          <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
              <Link href={rutaExiste ? route(nombreRuta, item.id) : '#'} className="block w-full group">
                  <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                      {item.nombre}
                  </span>
              </Link>
              <CardListaUsuarios tipo={tipoItem} usuarios={item.usuarios || (item.artista ? [{ name: item.artista, id: `art-${item.id}` }] : [])} usuarioLogueadoId={usuarioLogueadoId} />
          </div>
    );
    return (
        <li className={`bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl ${cardWidthClass} flex-shrink-0`}
            style={{ minWidth: cardMinWidth }}>
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
ItemCard.propTypes = {
    item: PropTypes.object.isRequired,
    tipoPredeterminado: PropTypes.string,
    usuarioLogueadoId: PropTypes.number,
};
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
            const amount = direction === 'left' ?
-scrollAmount : scrollAmount;
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };
    if (!itemsArray || itemsArray.length === 0) {
        return <p className="text-sm text-gray-400 italic px-4 sm:px-6">Aún no has agregado {tipoPredeterminado}s a tu perfil.</p>;
    }
    return (
        <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            <button onClick={() => handleScroll('left')} disabled={!canScrollLeft} aria-label="Scroll Left" className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${isHovering && canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"
 /></svg>
            </button>
            <div ref={scrollContainerRef} className="overflow-x-auto px-4 sm:px-6 pb-1 -mb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <ul className="flex flex-nowrap gap-4 sm:gap-6 py-1">
                    {itemsArray.map(item => (
                        <ItemCard
                            key={`${item.tipo ||
tipoPredeterminado}-${item.id}`}
                            item={item}
                            tipoPredeterminado={tipoPredeterminado}
                            usuarioLogueadoId={usuarioLogueadoId}
                         />
                    ))}
                </ul>
            </div>
            <button onClick={() => handleScroll('right')} disabled={!canScrollRight} aria-label="Scroll Right" className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${isHovering && canScrollRight ?
'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
});
ProfileDisplayList.propTypes = {
    items: PropTypes.array,
    usuarioLogueadoId: PropTypes.number,
    tipoPredeterminado: PropTypes.string,
};
ProfileDisplayList.displayName = 'ProfileDisplayList';

const CancionListItem = React.memo(({
    item,
    index,
    tipoItem,
    nombreRuta,
    onPlayPauseClick,
    isCurrentTrack,
    isPlayingCurrentTrack,
    isLoadingTrack,
    isLiked,
    onToggleLoopz,
    isLikeProcessing,
    onContextMenu,
}) => {
    const routeExists = useCallback((name) => {
        if (typeof route === 'function' && typeof route().has === 'function') return route().has(name);
        return false;
    }, []);
    const rutaItemExiste = nombreRuta
? routeExists(nombreRuta) : false;
    const [isHovered, setIsHovered] = useState(false);
    const handlePlayButtonClick = useCallback((e) => {
        e.stopPropagation();
        onPlayPauseClick(item, index);
    }, [item, index, onPlayPauseClick]);
    const handleLoopzButtonClick = useCallback((e) => {
        e.stopPropagation();
        onToggleLoopz(item.id, isLiked);
    }, [item?.id, isLiked, onToggleLoopz]);

    const handleContextMenuLocal = useCallback((e) => {
        if (onContextMenu) {
            onContextMenu(e, item);
        }
    }, [onContextMenu, item]);

    return (
        <li
            className={`flex items-center space-x-3 p-2
 transition duration-150 ease-in-out group rounded-md ${isCurrentTrack ? 'bg-indigo-900/30' : 'hover:bg-gray-700/60'} ${onContextMenu ? 'cursor-context-menu' : 'cursor-default'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={handlePlayButtonClick}
            onContextMenu={handleContextMenuLocal}
        >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {isLoadingTrack ?
(
                    <LoadingIcon className="w-5 h-5 text-white animate-spin" />
                ) : isPlayingCurrentTrack ?
(
                    <button onClick={handlePlayButtonClick} className="focus:outline-none" aria-label="Pausar">
                        <PauseIconSolid className="w-5 h-5 text-indigo-400" />
                    </button>
                ) : (isHovered || (isCurrentTrack && !isPlayingCurrentTrack)) ?
(
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
                    esStorage={item.foto_url && !(item.foto_url.startsWith('http://') || item.foto_url.startsWith('https://'))}
                />
            </div>
            <div className="flex-grow min-w-0">
                {rutaItemExiste ?
(
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
                        {item.usuarios && Array.isArray(item.usuarios) && item.usuarios.length > 0 ? (
                            item.usuarios.map((u, idx) => (
                                <React.Fragment key={u.id}>
                                    <Link href={route('profile.show', u.id)} className="hover:underline">
                                        {u.name}
                                    </Link>
                                    {idx < item.usuarios.length - 1 && ', '}
                                </React.Fragment>
                            ))
                        ) : typeof item.artista === 'string' ? item.artista : item.artista?.name}
                    </p>
                )}
            </div>
            <div className="flex-shrink-0">
                 <button
                     onClick={handleLoopzButtonClick}
                     disabled={isLikeProcessing}
                     className={`p-1 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${isLikeProcessing ?
'text-gray-500 cursor-wait' : 'text-gray-400 hover:text-purple-400'}`}
                     title={isLiked ?
"Quitar de LoopZ" : "Añadir a LoopZ"}
                 >
                     {isLikeProcessing ?
(
                         <LoadingIcon className="h-5 w-5 animate-spin text-purple-400"/>
                     ) : (
                         isLiked ? (
                            <HeartIconSolid className="h-5 w-5 text-purple-500" />
                         ) : (
                             <HeartIconOutline className="h-5 w-5" />
                         )
                     )}
                 </button>
            </div>
        </li>
    );
});
CancionListItem.propTypes = {
    item: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    tipoItem: PropTypes.string,
    nombreRuta: PropTypes.string,
    onPlayPauseClick: PropTypes.func.isRequired,
    isCurrentTrack: PropTypes.bool,
    isPlayingCurrentTrack: PropTypes.bool,
    isLoadingTrack: PropTypes.bool,
    isLiked: PropTypes.bool,
    onToggleLoopz: PropTypes.func.isRequired,
    isLikeProcessing: PropTypes.bool,
    onContextMenu: PropTypes.func,
};
CancionListItem.displayName = 'CancionListItem';

const ProfileCancionesList = ({
    items,
    tipoItem,
    nombreRuta,
    onPlayPauseSong,
    currentTrackId,
    Reproduciendo,
    isPlayerLoading,
    currentSourceId,
    mainSourceId,
    onToggleLoopz,
    likeProcessingSongId,
    onContextMenu,
}) => {
    if (!items || items.length === 0) {
        return <p className="text-sm text-gray-400 italic px-4 sm:px-6">Aún no has agregado {tipoItem}s a tu perfil.</p>;
    }
    return (
        <ul className="space-y-1 px-4 sm:px-6">
            {items.map((item, index) => {
                const isThisCurrentTrack = item.id === currentTrackId && currentSourceId === mainSourceId;
                const isLoadingThisTrack = isPlayerLoading && isThisCurrentTrack && !Reproduciendo;
                const isLikeProcessing = likeProcessingSongId ===
 item.id;
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
ProfileCancionesList.propTypes = {
    items: PropTypes.array,
    tipoItem: PropTypes.string,
    nombreRuta: PropTypes.string,
    onPlayPauseSong: PropTypes.func.isRequired,
    currentTrackId: PropTypes.number,
    Reproduciendo: PropTypes.bool,
    isPlayerLoading: PropTypes.bool,
    currentSourceId: PropTypes.string,
    mainSourceId: PropTypes.string,
    onToggleLoopz: PropTypes.func.isRequired,
    likeProcessingSongId: PropTypes.number,
    onContextMenu: PropTypes.func,
};
ProfileCancionesList.displayName = 'ProfileCancionesList';

export default function Index() {
    const { props, url } = usePage();
    const {
        usuario,
        cancionesUsuario: cancionesUsuarioProp = [],
        playlistsUsuario = [],
        albumesUsuario = [],
        epsUsuario = [],
        singlesUsuario = [],
        auth
    } = props;
    const usuarioLogueadoId = auth?.user?.id ?? null;
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
        cargando: isPlayerLoading =
 false,
        añadirSiguiente = () => {},
    } = playerContextValue || {};
    const userSongsSourceId = `user-${usuario.id}-all-canciones`;
    const isCurrentSourcePlayingUserSongs = sourceId === userSongsSourceId && Reproduciendo;
    const isPlayerLoadingThisSource = isPlayerLoading && sourceId === userSongsSourceId;
    const [cancionesUsuario, setCancionesUsuario] = useState(cancionesUsuarioProp);
    const [likeProcessingSongId, setLikeProcessingSongId] = useState(null);

    const [contextMenu, setContextMenu] = useState({
        show: false,
        x: 0,
        y: 0,
        song: null,
    });
    const contextMenuTimer = useRef(null);

    const openContextMenu = useCallback((event, song) => {
        event.preventDefault();
        setContextMenu({
            show: true,
            x: event.pageX,
            y: event.pageY,
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


    const handlePlayPauseUserSongs = useCallback(() => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        if (sourceId === userSongsSourceId) {
            if (Reproduciendo) {
                pause();
            } else {
                play();
            }
        } else {
            const formattedSongs = cancionesUsuario.map(cancion => ({ ...cancion }));
            cargarColaYIniciar(formattedSongs, { id: userSongsSourceId, name: `Canciones de ${usuario.name}`, type: 'userCollection', iniciar: 0 });
        }
    }, [cancionesUsuario, pause, sourceId, userSongsSourceId, Reproduciendo, play, cargarColaYIniciar, usuario?.name]);

    const handleToggleShuffleUserSongs = useCallback(() => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        if (sourceId === userSongsSourceId) {
             toggleAleatorio();
        } else {
             toggleAleatorio();
        }
    }, [cancionesUsuario, toggleAleatorio, sourceId, userSongsSourceId]);

    const handlePlayPauseSingleSong = useCallback((songToPlay, songIndexInList) => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        const isClickedSongCurrent = cancionActual && cancionActual.id === songToPlay.id && sourceId === userSongsSourceId;
        if (isClickedSongCurrent) {
            if (Reproduciendo) {
                pause();
            } else {
                play();
            }
        } else {
            const formattedSongs = cancionesUsuario.map(cancion => ({ ...cancion }));
            cargarColaYIniciar(formattedSongs, {
                id: userSongsSourceId,
                name: `Canciones de ${usuario.name}`,
                type: 'userCollection',
                iniciar: songIndexInList,
                clickDirecto: true
            });
        }
    }, [cancionesUsuario, cancionActual, sourceId, userSongsSourceId, Reproduciendo, pause, play, cargarColaYIniciar, usuario?.name]);

    const handleToggleLoopzSong = useCallback((songId, isInLoopz) => {
        if (!songId || likeProcessingSongId === songId) return;
        setLikeProcessingSongId(songId);
        // Optimistic update
        setCancionesUsuario(prevCanciones =>
            prevCanciones.map(song =>
                song.id === songId ? { ...song, is_in_user_loopz: !isInLoopz } : song
            )
        );
        router.post(route('cancion.loopz', { cancion: songId }), {}, {
            preserveScroll: true,
            preserveState: true, // Keep preserveState
            onSuccess: (page) => {
                 // Update state with the list from page.props if available
                 if (page.props.cancionesUsuario && Array.isArray(page.props.cancionesUsuario)) {
                    setCancionesUsuario(page.props.cancionesUsuario);
                 }
                 // Optional: If backend also returns the updated individual song, you could use that
                 // if (page.props.cancionActualizada) {
                 //    setCancionesUsuario(prevCanciones =>
                 //         prevCanciones.map(song =>
                 //            song.id === page.props.cancionActualizada.id ? { ...song, ...page.props.cancionActualizada } : song
                 //         )
                 //     );
                 // }
            },
            onError: (errors) => {
                // Revert optimistic update on error
                setCancionesUsuario(prevCanciones =>
                    prevCanciones.map(song =>
                        song.id === songId ? { ...song, is_in_user_loopz: isInLoopz } : song
                    )
                );
            },
            onFinish: () => {
                setLikeProcessingSongId(null);
            },
        });
    }, [likeProcessingSongId]);

    const getContextMenuOptions = useCallback(() => {
        if (!contextMenu.song) return [];

        const options = [];

        options.push({
            label: contextMenu.song.is_in_user_loopz ? "Quitar LoopZ" : "Añadir LoopZ",
            action: () => handleToggleLoopzSong(contextMenu.song.id, contextMenu.song.is_in_user_loopz),
            icon: contextMenu.song.is_in_user_loopz ? <HeartIconSolid className="h-5 w-5 text-purple-500" /> : <HeartIconOutline className="h-5 w-5" />,
            disabled: likeProcessingSongId === contextMenu.song.id,
        });

        if (añadirSiguiente) {
             options.push({
                 label: "Añadir a la cola",
                 action: handleAddToQueueNext,
                 icon: <QueueListIcon className="h-5 w-5" />,
             });
        }


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


        return options;
    }, [contextMenu.song, handleToggleLoopzSong, likeProcessingSongId, añadirSiguiente, handleAddToQueueNext, handleViewArtist]);


    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Perfil" />

            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                show={contextMenu.show}
                onClose={closeContextMenu}
                options={getContextMenuOptions()}
            />

            <div key={url} className="pt-16 pb-12 min-h-screen">
                <div className="mx-auto max-w-7xl space-y-10 sm:px-6 lg:px-8">
                    <div className="relative">
                        <div className="bg-gray-800 shadow-xl sm:rounded-lg overflow-hidden">
                            <ProfileImagenConPlaceholder src={usuario.banner_perfil} alt="Banner del perfil" claseImagen="w-full h-52 sm:h-72 object-cover" clasePlaceholder="w-full h-52 sm:h-72 bg-gray-700 flex items-center justify-center" tipo="banner" esStorage={true} />
                        </div>
                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 z-10">
                            <ProfileImagenConPlaceholder
                                src={usuario.foto_perfil}
                                alt={`Foto de perfil de ${usuario.name}`}
                                claseImagen="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-gray-800 shadow-md"
                                clasePlaceholder="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-gray-800 bg-gray-700 flex items-center justify-center text-white text-4xl sm:text-5xl shadow-md"
                                tipo="perfil"
                                nombre={usuario.name}
                                esStorage={true}
                            />
                        </div>
                    </div>
                    <div className="mt-72 sm:mt-96 px-4 sm:px-6">
                        <div className="flex justify-end mb-4">
                            <Link
                                href={route('profile.edit')}
                                className="inline-flex items-center px-4 py-2 bg-transparent border border-gray-600 rounded-full font-semibold text-xs text-gray-200 uppercase tracking-widest hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150"
                            >
                                Editar perfil
                            </Link>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end">
                            <div className="flex flex-col items-start">
                                <h3 className="text-3xl font-bold text-white">{usuario.name}</h3>
                            </div>
                            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                                {cancionesUsuario && cancionesUsuario.length > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <button
                                             onClick={handlePlayPauseUserSongs}
                                             disabled={isPlayerLoadingThisSource || !cancionesUsuario || cancionesUsuario.length === 0}
                                             aria-label={isCurrentSourcePlayingUserSongs ?
'Pausar canciones del usuario' : (sourceId === userSongsSourceId && cancionActual ? 'Continuar reproducción de canciones del usuario' : 'Reproducir todas las canciones del usuario')}
                                             className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-md hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                             {isPlayerLoadingThisSource ?
<LoadingIcon className="h-6 w-6 animate-spin" /> : isCurrentSourcePlayingUserSongs ? <PauseIconSolid className="h-6 w-6" /> : <PlayIconSolid className="h-6 w-6" />}
                                        </button>
                                        <button
                                             onClick={handleToggleShuffleUserSongs}
                                             disabled={!cancionesUsuario ||
cancionesUsuario.length === 0}
                                             aria-label={aleatorio ?
"Desactivar modo aleatorio para canciones del usuario" : "Activar modo aleatorio para canciones del usuario"}
                                             className={`flex items-center justify-center p-3 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed ${
                                                 aleatorio
                                                     ?
'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500'
                                                     : 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white focus:ring-gray-500'
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
                                items={cancionesUsuario}
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
        </AuthenticatedLayout>
    );
}

ProfileImagenConPlaceholder.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string.isRequired,
    claseImagen: PropTypes.string,
    clasePlaceholder: PropTypes.string,
    tipo: PropTypes.string,
    nombre: PropTypes.string,
    esStorage: PropTypes.bool,
};

CardImagenConPlaceholder.propTypes = {
    src: PropTypes.string,
    alt: PropTypes.string.isRequired,
    claseImagen: PropTypes.string,
    clasePlaceholder: PropTypes.string,
    tipo: PropTypes.string,
    esStorage: PropTypes.bool,
};

CardListaUsuarios.propTypes = {
    tipo: PropTypes.string,
    usuarios: PropTypes.array,
    usuarioLogueadoId: PropTypes.number,
};

ItemCard.propTypes = {
    item: PropTypes.object.isRequired,
    tipoPredeterminado: PropTypes.string,
    usuarioLogueadoId: PropTypes.number,
};

ProfileDisplayList.propTypes = {
    items: PropTypes.array,
    usuarioLogueadoId: PropTypes.number,
    tipoPredeterminado: PropTypes.string,
};

CancionListItem.propTypes = {
    item: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    tipoItem: PropTypes.string,
    nombreRuta: PropTypes.string,
    onPlayPauseClick: PropTypes.func.isRequired,
    isCurrentTrack: PropTypes.bool,
    isPlayingCurrentTrack: PropTypes.bool,
    isLoadingTrack: PropTypes.bool,
    isLiked: PropTypes.bool,
    onToggleLoopz: PropTypes.func.isRequired,
    isLikeProcessing: PropTypes.bool,
    onContextMenu: PropTypes.func,
};

ProfileCancionesList.propTypes = {
    items: PropTypes.array,
    tipoItem: PropTypes.string,
    nombreRuta: PropTypes.string,
    onPlayPauseSong: PropTypes.func.isRequired,
    currentTrackId: PropTypes.number,
    Reproduciendo: PropTypes.bool,
    isPlayerLoading: PropTypes.bool,
    currentSourceId: PropTypes.string,
    mainSourceId: PropTypes.string,
    onToggleLoopz: PropTypes.func.isRequired,
    likeProcessingSongId: PropTypes.number,
    onContextMenu: PropTypes.func,
};


Index.propTypes = {
    auth: PropTypes.object.isRequired,
    usuario: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        banner_perfil: PropTypes.string,
        foto_perfil: PropTypes.string,
    }).isRequired,
    cancionesUsuario: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        titulo: PropTypes.string.isRequired,
        archivo_url: PropTypes.string,
        foto_url: PropTypes.string,
        duracion: PropTypes.number,
        is_in_user_loopz: PropTypes.bool,
        usuarios: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })),
        artista: PropTypes.string,
    })),
    playlistsUsuario: PropTypes.array,
    albumesUsuario: PropTypes.array,
    epsUsuario: PropTypes.array,
    singlesUsuario: PropTypes.array,
};
