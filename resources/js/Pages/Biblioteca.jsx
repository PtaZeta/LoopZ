import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PropTypes from 'prop-types';

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder, tipo = 'playlist', nombre = '', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const baseUrl = esStorage ? '/storage/' : '';
    const urlImagenCompleta = src ? `${baseUrl}${src}` : null;
    const handleImageError = () => { setErrorCarga(true); };
    const PlaceholderContenido = () => (
        <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
    );
    const claveUnica = urlImagenCompleta || `placeholder-${tipo}-${alt.replace(/\s+/g, '-')}-${Math.random()}`;
    useEffect(() => { setErrorCarga(false); }, [src]);
    return urlImagenCompleta && !errorCarga ? (
        <img key={claveUnica} src={urlImagenCompleta} alt={alt} className={claseImagen} onError={handleImageError} loading="lazy" />
    ) : (
        <div key={claveUnica} className={`${clasePlaceholder} flex items-center justify-center overflow-hidden`}>
            <PlaceholderContenido />
        </div>
    );
};

const ListaUsuariosPlaylist = ({ tipo, usuarios: usuariosProp, usuarioLogueadoId }) => {
    const usuarios = Array.isArray(usuariosProp) ? usuariosProp : [];

    if (usuarios.length === 0) {
        const textoDefault = tipo === 'playlist' ? 'Sin colaboradores' : 'Artista desconocido';
        return <span className="text-xs text-gray-500 mt-1 truncate w-full">{textoDefault}</span>;
    }

    const MAX_SHOWN = 1;
    let displayOrder = [];
    let owner = null;
    let authUser = null;

    for (const u of usuarios) {
        if (u.pivot?.propietario === true) { owner = u; }
        if (u.id === usuarioLogueadoId) { authUser = u; }
        if (owner && authUser) break;
    }

    const addedIds = new Set();
    if (authUser) {
        displayOrder.push(authUser);
        addedIds.add(authUser.id);
    }
    if (owner && !addedIds.has(owner.id)) {
       if (!authUser) { displayOrder.unshift(owner); } else { displayOrder.push(owner); }
        addedIds.add(owner.id);
    }
    usuarios.forEach(u => { if (!addedIds.has(u.id)) { displayOrder.push(u); addedIds.add(u.id); } });
    if (displayOrder.length === 0) { displayOrder = [...usuarios]; }

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
                    <ul className="list-none p-0 m-0">
                        {usuariosTooltip.map(u => <li key={u.id} className="py-0.5">{u.name}</li>)}
                    </ul>
                     <svg className="absolute text-gray-700 h-2 w-full left-0 top-full" viewBox="0 0 255 255" xmlSpace="preserve">
                         <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
                     </svg>
                </div>
            )}
        </div>
    );
};

const getResourceRouteBase = (tipo) => {
    switch (tipo) {
        case 'album': return 'albumes';
        case 'playlist': return 'playlists';
        case 'ep': return 'eps';
        case 'single': return 'singles';
        case 'loopzs': return 'playlists';
        default: return tipo ? `${tipo}s` : 'items';
    }
};

const DisplayList = ({ items, usuarioLogueadoId, tipoPredeterminado = 'playlist' }) => {
    const scrollContainerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const LIMITE_GRID = 6;
    const scrollAmount = 400;
    const itemsArray = Array.isArray(items) ? items : [];
    // *** CAMBIO DE TAMAÑO AQUÍ ***
    const cardWidthClass = 'w-56'; // Antes w-48
    const cardMinWidth = '14rem'; // Antes 12rem

    const updateScrollability = useCallback(() => {
        const element = scrollContainerRef.current;
        if (element) {
            const hasScrollLeft = element.scrollLeft > 1;
            setCanScrollLeft(hasScrollLeft);
            const maxScrollLeft = element.scrollWidth - element.clientWidth;
            const hasScrollRight = element.scrollLeft < (maxScrollLeft - 1);
            setCanScrollRight(hasScrollRight);
        }
    }, []);

    useEffect(() => {
        if (itemsArray.length <= LIMITE_GRID || !scrollContainerRef.current) {
            setCanScrollLeft(false); setCanScrollRight(false); return;
        }
        const element = scrollContainerRef.current;
        updateScrollability();
        element.addEventListener('scroll', updateScrollability, { passive: true });
        window.addEventListener('resize', updateScrollability);
        return () => {
            element.removeEventListener('scroll', updateScrollability);
            window.removeEventListener('resize', updateScrollability);
        };
    }, [itemsArray.length, updateScrollability, LIMITE_GRID]);

    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const amount = direction === 'left' ? -scrollAmount : scrollAmount;
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    const renderItemCard = (item) => {
        const tipoItem = item.tipo || tipoPredeterminado;
        const rutaBase = getResourceRouteBase(tipoItem);
        const rutaShow = `${rutaBase}.show`;

        return (
            <li
                key={`${tipoItem}-${item.id}`}
                className={`bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl ${cardWidthClass} flex-shrink-0`}
            >
                <Link href={route(rutaShow, item.id)} className="block w-full p-4 pb-0 group">
                    <div className="relative w-full aspect-square mb-3">
                        <ImagenConPlaceholder
                            src={item.imagen} alt={`Portada de ${item.nombre}`}
                            claseImagen="absolute inset-0 w-full h-full object-cover rounded transition-transform duration-300 ease-in-out group-hover:scale-105"
                            clasePlaceholder="absolute inset-0 w-full h-full rounded bg-gray-750 flex items-center justify-center"
                            tipo={tipoItem} esStorage={true} />
                         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white transform transition-transform duration-300 ease-in-out group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                        </div>
                    </div>
                </Link>
                <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
                    <Link href={route(rutaShow, item.id)} className="block w-full group">
                        <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                            {item.nombre}
                        </span>
                    </Link>
                    <ListaUsuariosPlaylist tipo={tipoItem} usuarios={item.usuarios} usuarioLogueadoId={usuarioLogueadoId} />
                </div>
            </li>
        );
    }

    if (itemsArray.length <= LIMITE_GRID) {
        return (
            <ul className={`grid grid-cols-[repeat(auto-fill,minmax(${cardMinWidth},1fr))] gap-4 sm:gap-6`}>
                {itemsArray.map(item => renderItemCard(item))}
            </ul>
        );
    } else {
        return (
            <div
                className="relative"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                <button
                    onClick={() => handleScroll('left')} disabled={!canScrollLeft} aria-label="Scroll Left"
                    className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${ isHovering && canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide pb-1 -mb-1">
                    <ul className="flex flex-nowrap gap-4 sm:gap-6 px-1 py-1">
                         {itemsArray.map(item => renderItemCard(item))}
                    </ul>
                </div>
                 <button
                    onClick={() => handleScroll('right')} disabled={!canScrollRight} aria-label="Scroll Right"
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${ isHovering && canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
        );
    }
};

export default function Biblioteca({ auth, playlists, loopzContenedores }) {
    const usuarioLogueadoId = auth.user.id;
    const playlistsArray = Array.isArray(playlists) ? playlists : [];
    const loopzArray = Array.isArray(loopzContenedores) ? loopzContenedores : [];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-200 leading-tight">Mi Biblioteca</h2>}
        >
            <Head title="Mi Biblioteca" />
            <main className='py-8 px-4 sm:px-6 lg:px-8 min-h-screen'>
                <div className="space-y-12">
                    <div>
                        <h3 className="text-2xl font-semibold mb-6 text-gray-100">Tus Playlists</h3>
                        {playlistsArray.length > 0 ? (
                             <DisplayList
                                items={playlistsArray}
                                usuarioLogueadoId={usuarioLogueadoId}
                                tipoPredeterminado="playlist"
                             />
                        ) : (
                            <p className="text-gray-400 italic">No tienes ninguna playlist todavía.</p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold mb-6 text-gray-100">LoopZs</h3>
                         {loopzArray.length > 0 ? (
                             <DisplayList
                                items={loopzArray}
                                usuarioLogueadoId={usuarioLogueadoId}
                             />
                        ) : (
                            <p className="text-gray-400 italic">No has marcado nada como LoopZ todavía.</p>
                        )}
                    </div>
                </div>
            </main>
        </AuthenticatedLayout>
    );
}
