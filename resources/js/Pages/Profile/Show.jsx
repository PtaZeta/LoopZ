import React, { useState, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link, router } from '@inertiajs/react';
import Notificacion from '@/Components/Notificacion';
import { PlayerContext } from '@/contexts/PlayerContext';
import {
    PlayIcon as IconoReproducirSolido,
    ShareIcon as IconoCompartir,
    PauseIcon as IconoPausarSolido,
    ArrowsRightLeftIcon as IconoAleatorio,
    UserCircleIcon as IconoUsuarioCirculo,
    PhotoIcon as IconoFoto,
    MusicalNoteIcon as IconoNotaMusicalSolido,
    QueueListIcon as IconoListaCola,
    UserIcon as IconoUsuario,
    HeartIcon as IconoCorazonContorno,
    ChevronRightIcon as IconoChevronDerecha,
    ArrowUpOnSquareIcon as IconoFlechaArribaCuadrado,
    CheckIcon as IconoCheck,
    XMarkIcon as IconoX,
    EllipsisVerticalIcon as IconoEllipsisVertical
} from '@heroicons/react/24/solid';
import { ArrowPathIcon as IconoCargando } from '@heroicons/react/20/solid';
import { HeartIcon as IconoCorazonSolido } from '@heroicons/react/24/solid';
import ContextMenu from '@/Components/ContextMenu';

const esUrlCompleta = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

const ImagenPerfilConMarcador = React.memo(({ src, alt, claseImagen, claseMarcador, tipo = 'perfil', nombre = '', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const urlImagenCompleta = src ? (esUrlCompleta(src) ? src : (esStorage ? `/storage/${src}` : `${src}`)) : null;
    const manejarErrorImagen = useCallback(() => {
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
    const IconoMarcador = useCallback(() => {
        switch (tipo) {
            case 'perfil': return <IconoUsuarioCirculo className="w-1/2 h-1/2 text-gray-500" />;
            case 'banner': return <IconoFoto className="w-1/3 h-1/3 text-gray-500" />;
            case 'cancion': case 'playlist': case 'album': case 'ep': case 'single':
                return <IconoNotaMusicalSolido className="w-1/2 h-1/2 text-gray-500" />;
            default: return <IconoFoto className="w-1/3 h-1/3 text-gray-500" />;
        }
    }, [tipo]);
    const ContenidoMarcador = useCallback(() => {
        if (tipo === 'perfil' && !src && nombre) {
            return <span className="text-white text-4xl font-semibold pointer-events-none">{obtenerIniciales(nombre)}</span>;
        }
        return <IconoMarcador />;
    }, [tipo, src, nombre, obtenerIniciales, IconoMarcador]);
    const claveParaImagen = urlImagenCompleta ? `img-${urlImagenCompleta}` : null;
    const claveParaContenedorMarcador = `ph-wrapper-${tipo}-${alt.replace(/\s+/g, '-')}-${nombre || 'no-nombre'}`;
    return (
        <div className={`${claseMarcador} flex items-center justify-center overflow-hidden relative`}>
            {urlImagenCompleta && !errorCarga ? (
                <img
                    key={claveParaImagen}
                    src={urlImagenCompleta}
                    alt={alt}
                    className={`${claseImagen}`}
                    onError={manejarErrorImagen}
                />
            ) : (
                <div key={claveParaContenedorMarcador} className="w-full h-full flex items-center justify-center">
                    <ContenidoMarcador />
                </div>
            )}
        </div>
    );
});
ImagenPerfilConMarcador.displayName = 'ImagenPerfilConMarcador';

const ImagenTarjetaConMarcador = React.memo(({ src, alt, claseImagen, claseMarcador, tipo = 'playlist', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const urlImagenCompleta = src ? (esUrlCompleta(src) ? src : (esStorage ? `/storage/${src}` : src)) : null;
    const manejarErrorImagen = useCallback(() => { setErrorCarga(true); }, []);
    const ContenidoMarcador = useCallback(() => (
        <IconoNotaMusicalSolido className="w-1/2 h-1/2 text-gray-500" />
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
            onError={manejarErrorImagen}
        />
    ) : (
        <div key={claveUnicaParaElemento} className={`${claseMarcador} flex items-center justify-center overflow-hidden`}>
            <ContenidoMarcador />
        </div>
    );
});
ImagenTarjetaConMarcador.displayName = 'ImagenTarjetaConMarcador';

const TarjetaListaUsuarios = React.memo(({ tipo, usuarios: usuariosProp, idUsuarioAutenticado }) => {
    const usuarios = Array.isArray(usuariosProp) ? usuariosProp : [];
    if (usuarios.length === 0) {
        const textoDefault = tipo === 'playlist' ? 'Sin colaboradores' : 'Artista desconocido';
        return <span className="text-xs text-gray-500 mt-1 truncate w-full">{textoDefault}</span>;
    }
    const MAX_SHOWN = 1;
    let ordenVisualizacion = [];
    const idsUsuariosProcesados = new Set();
    let propietarioFinal = null;
    let usuarioAutenticadoFinal = null;
    for (const u of usuarios) {
        if (u.id === idUsuarioAutenticado) usuarioAutenticadoFinal = u;
        if (u.pivot?.propietario === true) propietarioFinal = u;
    }
    if (usuarioAutenticadoFinal) {
        ordenVisualizacion.push(usuarioAutenticadoFinal);
        idsUsuariosProcesados.add(usuarioAutenticadoFinal.id);
    }
    if (propietarioFinal && !idsUsuariosProcesados.has(propietarioFinal.id)) {
        if (usuarioAutenticadoFinal) {
            const indiceAutenticado = ordenVisualizacion.findIndex(u => u.id === usuarioAutenticadoFinal.id);
            if (indiceAutenticado !== -1) {
                ordenVisualizacion.splice(indiceAutenticado + 1, 0, propietarioFinal);
            } else {
                ordenVisualizacion.push(propietarioFinal);
            }
        } else {
            ordenVisualizacion.unshift(propietarioFinal);
        }
        idsUsuariosProcesados.add(propietarioFinal.id);
    }
    usuarios.forEach(u => {
        if (!idsUsuariosProcesados.has(u.id)) {
            ordenVisualizacion.push(u);
        }
    });
    if (ordenVisualizacion.length === 0 && usuarios.length > 0) {
        ordenVisualizacion = [...usuarios];
    }
    const usuariosMostrados = ordenVisualizacion.slice(0, MAX_SHOWN);
    const usuariosTooltip = ordenVisualizacion.slice(MAX_SHOWN);
    const textoMostrado = usuariosMostrados.map(u => u.name).join(', ');
    const numOcultos = usuariosTooltip.length;
    const tipoCapitalizado = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Item';
    const tituloCompleto = `${tipoCapitalizado} · ${ordenVisualizacion.map(u => u.name).join(', ')}`;
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
TarjetaListaUsuarios.displayName = 'TarjetaListaUsuarios';

const obtenerRutaBaseRecurso = (tipo) => {
    switch (tipo) {
        case 'album': return 'albumes';
        case 'playlist': return 'playlists';
        case 'ep': return 'eps';
        case 'single': return 'singles';
        default: return tipo ? `${tipo}s` : 'items';
    }
};

const TarjetaItem = React.memo(({ item, tipoPredeterminado, idUsuarioAutenticado }) => {
    const tipoItem = item.tipo || tipoPredeterminado;
    const rutaBase = obtenerRutaBaseRecurso(tipoItem);
    const nombreRuta = `${rutaBase}.show`;
    const rutaExiste = typeof route === 'function' && route().has(nombreRuta);
    const claseAnchoTarjeta = 'w-56';
    const anchoMinimoTarjeta = '14rem';
    const seccionImagen = (
        <div className="relative w-full aspect-square mb-3">
            <ImagenTarjetaConMarcador
                src={item.imagen_url || item.imagen}
                alt={`Portada de ${item.nombre}`}
                claseImagen="absolute inset-0 w-full h-full object-cover rounded transition-transform duration-300 ease-in-out group-hover:scale-105"
                claseMarcador="absolute inset-0 w-full h-full rounded bg-gray-750 flex items-center justify-center"
                tipo={tipoItem}
                esStorage={true}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded group-hover:scale-105">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white transform transition-transform duration-300 ease-in-out group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
            </div>
        </div>
    );
    const seccionTexto = (
        <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
            <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                {item.nombre}
            </span>
            <TarjetaListaUsuarios tipo={tipoItem} usuarios={item.usuarios || (item.artista ? [{ name: item.artista, id: `art-${item.id}` }] : [])} idUsuarioAutenticado={idUsuarioAutenticado} />
        </div>
    );
    const seccionTextoEnlazado = (
        <div className="w-full px-3 sm:px-4 pb-4 flex flex-col items-center">
            <Link href={rutaExiste ? route(nombreRuta, item.id) : '#'} className="block w-full group">
                <span className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={item.nombre}>
                    {item.nombre}
                </span>
            </Link>
            <TarjetaListaUsuarios tipo={tipoItem} usuarios={item.usuarios || (item.artista ? [{ name: item.artista, id: `art-${item.id}` }] : [])} idUsuarioAutenticado={idUsuarioAutenticado} />
        </div>
    );
    return (
        <li className={`bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl ${claseAnchoTarjeta} flex-shrink-0`}
            style={{ minWidth: anchoMinimoTarjeta }}>
            {rutaExiste ? (
                <>
                    <Link href={route(nombreRuta, item.id)} className="block w-full p-4 pb-0 group">
                        {seccionImagen}
                    </Link>
                    {seccionTextoEnlazado}
                </>
            ) : (
                <div className="block w-full p-4 pb-0 group cursor-default">
                    {seccionImagen}
                    {seccionTexto}
                </div>
            )}
        </li>
    );
});
TarjetaItem.displayName = 'TarjetaItem';

const ListaVisualizacionPerfil = React.memo(({ items, idUsuarioAutenticado, tipoPredeterminado = 'playlist' }) => {
    const contenedorDesplazamientoRef = useRef(null);
    const [estaSobre, setEstaSobre] = useState(false);
    const [puedeDesplazarseIzquierda, setPuedeDesplazarseIzquierda] = useState(false);
    const [puedeDesplazarseDerecha, setPuedeDesplazarseDerecha] = useState(false);
    const cantidadDesplazamiento = 400;
    const arrayItems = Array.isArray(items) ? items : [];
    const actualizarCapacidadDesplazamiento = useCallback(() => {
        const elemento = contenedorDesplazamientoRef.current;
        if (elemento) {
            setPuedeDesplazarseIzquierda(elemento.scrollLeft > 1);
            const maxScrollLeft = elemento.scrollWidth - elemento.clientWidth;
            setPuedeDesplazarseDerecha(elemento.scrollLeft < (maxScrollLeft - 1));
        }
    }, []);
    useEffect(() => {
        const el = contenedorDesplazamientoRef.current;
        if (!el || arrayItems.length === 0) {
            setPuedeDesplazarseIzquierda(false);
            setPuedeDesplazarseDerecha(false);
            return;
        }
        actualizarCapacidadDesplazamiento();
        el.addEventListener('scroll', actualizarCapacidadDesplazamiento, { passive: true });
        window.addEventListener('resize', actualizarCapacidadDesplazamiento);
        return () => {
            el.removeEventListener('scroll', actualizarCapacidadDesplazamiento);
            window.removeEventListener('resize', actualizarCapacidadDesplazamiento);
        };
    }, [actualizarCapacidadDesplazamiento, arrayItems.length]);
    const manejarDesplazamiento = (direccion) => {
        if (contenedorDesplazamientoRef.current) {
            const cantidad = direccion === 'left' ? -cantidadDesplazamiento : cantidadDesplazamiento;
            contenedorDesplazamientoRef.current.scrollBy({ left: cantidad, behavior: 'smooth' });
        }
    };
    if (!arrayItems || arrayItems.length === 0) {
        return null;
    }
    return (
        <div className="relative" onMouseEnter={() => setEstaSobre(true)} onMouseLeave={() => setEstaSobre(false)}>
            <button onClick={() => manejarDesplazamiento('left')} disabled={!puedeDesplazarseIzquierda} aria-label="Desplazarse a la izquierda" className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${estaSobre && puedeDesplazarseIzquierda ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={contenedorDesplazamientoRef} className="overflow-x-auto px-4 sm:px-6 pb-1 -mb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                <ul className="flex flex-nowrap gap-4 sm:gap-6 py-1">
                    {arrayItems.map(item => (
                        <TarjetaItem
                            key={`${item.tipo || tipoPredeterminado}-${item.id}`}
                            item={item}
                            tipoPredeterminado={tipoPredeterminado}
                            idUsuarioAutenticado={idUsuarioAutenticado}
                        />
                    ))}
                </ul>
            </div>
            <button onClick={() => manejarDesplazamiento('right')} disabled={!puedeDesplazarseDerecha} aria-label="Desplazarse a la derecha" className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-70 rounded-full text-white transition-opacity duration-300 ease-in-out hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${estaSobre && puedeDesplazarseDerecha ? 'opacity-100' : 'opacity-0 pointer-events-none'} disabled:opacity-20 disabled:pointer-events-none disabled:cursor-not-allowed`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
});
ListaVisualizacionPerfil.displayName = 'ListaVisualizacionPerfil';

const ItemListaCancion = React.memo(({
    item,
    index,
    tipoItem,
    nombreRuta,
    alClicReproducirPausar,
    esPistaActual,
    estaReproduciendoPistaActual,
    estaCargandoPista,
    estaEnLoopz,
    alAlternarLoopz,
    estaProcesandoMeGusta,
    alMenuContexto,
}) => {
    const rutaExiste = useCallback((name) => {
        if (typeof route === 'function' && typeof route().has === 'function') return route().has(name);
        return false;
    }, []);

    const rutaItemExiste = nombreRuta ? rutaExiste(nombreRuta) : false;
    const [estaSobreItem, setEstaSobreItem] = useState(false);

    const manejarClicBotonReproducir = useCallback((e) => {
        e.stopPropagation();
        alClicReproducirPausar(item, index);
    }, [item, index, alClicReproducirPausar]);

    const manejarClicBotonLoopz = useCallback((e) => {
        e.stopPropagation();
        alAlternarLoopz(item.id, estaEnLoopz);
    }, [item?.id, estaEnLoopz, alAlternarLoopz]);

    const manejarMenuContextoMovil = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (alMenuContexto) {
            const buttonRect = e.currentTarget.getBoundingClientRect();
            alMenuContexto({
                preventDefault: () => { },
                pageX: buttonRect.right,
                pageY: buttonRect.top + window.scrollY,
                currentTarget: e.currentTarget
            }, item);
        }
    }, [alMenuContexto, item]);

    const manejarMenuContextoEscritorio = useCallback((e) => {
        if (alMenuContexto) {
            alMenuContexto(e, item);
        }
    }, [alMenuContexto, item]);

    return (
        <li
            className={`flex items-center space-x-3 p-2 transition duration-150 ease-in-out group rounded-md ${esPistaActual ? 'bg-indigo-900/30' : 'hover:bg-gray-700/60'
                } cursor-default`}
            onMouseEnter={() => setEstaSobreItem(true)}
            onMouseLeave={() => setEstaSobreItem(false)}
            onDoubleClick={manejarClicBotonReproducir}
            onContextMenu={manejarMenuContextoEscritorio}
        >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {estaCargandoPista ? (
                    <IconoCargando className="w-5 h-5 text-white animate-spin" />
                ) : estaReproduciendoPistaActual ? (
                    <button onClick={manejarClicBotonReproducir} className="focus:outline-none" aria-label="Pausar">
                        <IconoPausarSolido className="w-5 h-5 text-indigo-400" />
                    </button>
                ) : (estaSobreItem || (esPistaActual && !estaReproduciendoPistaActual)) ? (
                    <button onClick={manejarClicBotonReproducir} className="focus:outline-none" aria-label={esPistaActual ? "Continuar reproducción" : "Reproducir"}>
                        <IconoReproducirSolido className="w-5 h-5 text-white" />
                    </button>
                ) : (
                    <span className="text-sm text-gray-400 w-full text-center select-none">{index + 1}</span>
                )}
            </div>
            <div className="flex-shrink-0">
                <ImagenPerfilConMarcador
                    src={item.foto_url}
                    alt={`Portada de ${item.titulo}`}
                    claseImagen="w-10 h-10 rounded object-cover"
                    claseMarcador="w-10 h-10 rounded bg-gray-700 text-gray-400 flex items-center justify-center"
                    tipo={tipoItem}
                    esStorage={item.foto_url && !(item.foto_url.startsWith('http://') || item.foto_url.startsWith('https://'))}
                />
            </div>
            <div className="flex-grow min-w-0">
                {rutaItemExiste ? (
                    <Link
                        href={route(nombreRuta, item.id)}
                        className={`text-sm font-medium ${esPistaActual ? 'text-indigo-400' : 'text-gray-100 group-hover:text-white'} hover:underline truncate block`}
                        title={item.titulo}
                    >
                        {item.titulo}
                    </Link>
                ) : (
                    <span
                        className={`text-sm font-medium ${esPistaActual ? 'text-indigo-400' : 'text-gray-200'} truncate block`}
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
            <div className="flex-shrink-0 flex items-center space-x-2">
                <button
                    onClick={manejarClicBotonLoopz}
                    disabled={estaProcesandoMeGusta}
                    className={`p-1 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${estaProcesandoMeGusta ? 'text-gray-500 cursor-wait' : 'text-gray-400 hover:text-purple-400'}`}
                    title={estaEnLoopz ? "Quitar de LoopZ" : "Añadir a LoopZ"}
                >
                    {estaProcesandoMeGusta ? (
                        <IconoCargando className="h-5 w-5 animate-spin text-purple-400" />
                    ) : (
                        estaEnLoopz ? (
                            <IconoCorazonSolido className="h-5 w-5 text-purple-500" />
                        ) : (
                            <IconoCorazonContorno className="h-5 w-5" />
                        )
                    )}
                </button>
                <button
                    onClick={manejarMenuContextoMovil}
                    className="p-2 rounded-full transition-colors duration-150 ease-in-out text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 md:hidden"
                    title="Más opciones"
                >
                    <IconoEllipsisVertical className="h-5 w-5" />
                </button>
            </div>
        </li>
    );
});
ItemListaCancion.displayName = 'ItemListaCancion';

const ListaCancionesPerfil = ({
    items,
    tipoItem,
    nombreRuta,
    alReproducirPausarCancion,
    idCancionActual,
    reproduciendo,
    jugadorCargando,
    idFuenteActual,
    idFuentePrincipal,
    alAlternarLoopz,
    idCancionProcesandoMeGusta,
    alMenuContexto,
}) => {
    if (!items || items.length === 0) {
        return null;
    }
    return (
        <ul className="space-y-1 px-4 sm:px-6">
            {items.map((item, index) => {
                const esEstaLaPistaActual = item.id === idCancionActual && idFuenteActual === idFuentePrincipal;
                const estaCargandoEstaPista = jugadorCargando && esEstaLaPistaActual && !reproduciendo;
                const estaProcesandoMeGusta = idCancionProcesandoMeGusta === item.id;
                return (
                    <ItemListaCancion
                        key={item.id}
                        item={item}
                        index={index}
                        tipoItem={tipoItem}
                        nombreRuta={nombreRuta}
                        alClicReproducirPausar={alReproducirPausarCancion}
                        esPistaActual={esEstaLaPistaActual}
                        estaReproduciendoPistaActual={esEstaLaPistaActual && reproduciendo}
                        estaCargandoPista={estaCargandoEstaPista}
                        estaEnLoopz={item.es_loopz}
                        alAlternarLoopz={alAlternarLoopz}
                        estaProcesandoMeGusta={estaProcesandoMeGusta}
                        alMenuContexto={alMenuContexto}
                    />
                );
            })}
        </ul>
    );
};
ListaCancionesPerfil.displayName = 'ListaCancionesPerfil';

const ModalSeguidores = ({ usuarios, titulo, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black bg-opacity-75" onClick={onClose}></div>
            <div className="relative bg-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-96 overflow-y-auto p-5 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">{titulo}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
                        <IconoX className="h-6 w-6" />
                    </button>
                </div>
                <ul className="space-y-3">
                    {usuarios.map(usuario => (
                        <li key={usuario.id} className="flex items-center space-x-3">
                            <ImagenPerfilConMarcador
                                src={usuario.foto_perfil}
                                alt={`Perfil de ${usuario.name}`}
                                claseImagen="w-10 h-10 rounded-full"
                                claseMarcador="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
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
        cancionesUsuario: cancionesUsuarioProp = [],
        playlistsUsuario = [],
        albumesUsuario = [],
        epsUsuario = [],
        singlesUsuario = [],
        auth,
        seguidores_count,
        seguidos_count,
        is_following,
        es_administrador
    } = props;
    const idUsuarioAutenticado = auth?.user?.id ?? null;
    const esCreador = auth?.user?.id === usuario.id;
    const valorContextoJugador = useContext(PlayerContext);
    const {
        cargarColaYIniciar = () => { },
        play = () => { },
        pause = () => { },
        toggleAleatorio = () => { },
        Reproduciendo = false,
        aleatorio = false,
        cancionActual = null,
        sourceId = null,
        cargando: estaCargandoJugador = false,
        añadirSiguiente = () => { },
    } = valorContextoJugador || {};
    const idFuenteCancionesUsuario = `user-${usuario.id}-all-canciones`;
    const esFuenteActualReproduciendoCancionesUsuario = sourceId === idFuenteCancionesUsuario && Reproduciendo;
    const estaCargandoJugadorEstaFuente = estaCargandoJugador && sourceId === idFuenteCancionesUsuario;
    const [cancionesUsuario, setCancionesUsuario] = useState(cancionesUsuarioProp);
    const [idCancionProcesandoMeGusta, setIdCancionProcesandoMeGusta] = useState(null);
    const [menuContexto, setMenuContexto] = useState({
        mostrar: false,
        x: 0,
        y: 0,
        cancion: null,
    });
    const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
    const [mensajeNotificacion, setMensajeNotificacion] = useState('');
    const [mostrarTodasLasCanciones, setMostrarTodasLasCanciones] = useState(false);

    const cancionesAMostrar = useMemo(() => {
        if (mostrarTodasLasCanciones) return cancionesUsuario;
        return cancionesUsuario.slice(0, 10);
    }, [cancionesUsuario, mostrarTodasLasCanciones]);


    const copiarAlPortapapeles = useCallback((texto, mensaje = 'Guardado en el portapapeles') => {
        navigator.clipboard.writeText(texto).then(() => {
            setMensajeNotificacion(mensaje);
            setMostrarNotificacion(true);

            setTimeout(() => {
                setMostrarNotificacion(false);
            }, 5000);
        }).catch(err => {
            setMensajeNotificacion('Error al copiar');
            setMostrarNotificacion(true);

            setTimeout(() => {
                setMostrarNotificacion(false);
            }, 5000);
        });
    }, []);
    const temporizadorMenuContexto = useRef(null);
    const abrirMenuContexto = useCallback((evento, cancion) => {
        evento.preventDefault();
        setMenuContexto({
            mostrar: true,
            x: evento.pageX,
            y: evento.pageY,
            cancion: cancion,
        });
    }, []);
    const cerrarMenuContexto = useCallback(() => {
        if (temporizadorMenuContexto.current) {
            clearTimeout(temporizadorMenuContexto.current);
            temporizadorMenuContexto.current = null;
        }
        setMenuContexto({ ...menuContexto, mostrar: false, cancion: null });
    }, [menuContexto]);
    const iniciarTemporizadorCierre = useCallback(() => {
        temporizadorMenuContexto.current = setTimeout(cerrarMenuContexto, 100);
    }, [cerrarMenuContexto]);
    const cancelarTemporizadorCierre = useCallback(() => {
        if (temporizadorMenuContexto.current) {
            clearTimeout(temporizadorMenuContexto.current);
            temporizadorMenuContexto.current = null;
        }
    }, []);
    const manejarAnadirAlaColaSiguiente = useCallback(() => {
        if (menuContexto.cancion && añadirSiguiente) {
            añadirSiguiente(menuContexto.cancion);
            cerrarMenuContexto();
        }
    }, [menuContexto.cancion, añadirSiguiente, cerrarMenuContexto]);
    const manejarVerArtista = useCallback((artista) => {
        if (artista?.id) {
            router.visit(route('profile.show', artista.id));
            cerrarMenuContexto();
        }
    }, [cerrarMenuContexto]);

    const manejarCompartirCancion = useCallback(() => {
        if (menuContexto.cancion) {
            const urlCancion = route('canciones.show', menuContexto.cancion.id);
            copiarAlPortapapeles(urlCancion, 'URL de canción copiada');
            cerrarMenuContexto();
        }
    }, [menuContexto.cancion, copiarAlPortapapeles, cerrarMenuContexto]);

    const manejarAlternarCancion = useCallback((idCancion, idPlaylist) => {
        if (!idCancion || !idPlaylist) return;
        router.post(route('playlist.toggleCancion', { playlist: idPlaylist, cancion: idCancion }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (page.props.cancionesUsuario && Array.isArray(page.props.cancionesUsuario)) {
                    setCancionesUsuario(page.props.cancionesUsuario);
                }
            },
        });
    }, []);
    const manejarReproducirPausarCancionesUsuario = useCallback(() => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        if (sourceId === idFuenteCancionesUsuario) {
            if (Reproduciendo) {
                pause();
            } else {
                play();
            }
        } else {
            const cancionesFormateadas = cancionesUsuario.map(cancion => ({ ...cancion }));
            cargarColaYIniciar(cancionesFormateadas, { id: idFuenteCancionesUsuario, name: `Canciones de ${usuario.name}`, type: 'userCollection', iniciar: 0 });
        }
    }, [cancionesUsuario, pause, sourceId, idFuenteCancionesUsuario, Reproduciendo, play, cargarColaYIniciar, usuario?.name]);
    const manejarAlternarAleatorioCancionesUsuario = useCallback(() => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        if (sourceId === idFuenteCancionesUsuario) {
            toggleAleatorio();
        } else {
            toggleAleatorio();
        }
    }, [cancionesUsuario, toggleAleatorio, sourceId, idFuenteCancionesUsuario]);
    const manejarReproducirPausarCancionIndividual = useCallback((cancionAReproducir, indiceCancionEnLista) => {
        if (!cancionesUsuario || cancionesUsuario.length === 0) return;
        const esCancionClicadaActual = cancionActual && cancionActual.id === cancionAReproducir.id && sourceId === idFuenteCancionesUsuario;
        if (esCancionClicadaActual) {
            if (Reproduciendo) {
                pause();
            } else {
                play();
            }
        } else {
            const cancionesFormateadas = cancionesUsuario.map(cancion => ({ ...cancion }));
            cargarColaYIniciar(cancionesFormateadas, {
                id: idFuenteCancionesUsuario,
                name: `Canciones de ${usuario.name}`,
                type: 'userCollection',
                iniciar: indiceCancionEnLista,
                clickDirecto: true
            });
        }
    }, [cancionesUsuario, cancionActual, sourceId, idFuenteCancionesUsuario, Reproduciendo, pause, play, cargarColaYIniciar, usuario?.name]);
    const manejarAlternarLoopzCancion = useCallback((idCancion, estaEnLoopz) => {
        if (!idCancion || idCancionProcesandoMeGusta === idCancion) return;
        setIdCancionProcesandoMeGusta(idCancion);
        setCancionesUsuario(prevCanciones =>
            prevCanciones.map(song =>
                song.id === idCancion ? { ...song, es_loopz: !estaEnLoopz } : song
            )
        );
        router.post(route('cancion.loopz', { cancion: idCancion }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (page.props.cancionesUsuario && Array.isArray(page.props.cancionesUsuario)) {
                    setCancionesUsuario(page.props.cancionesUsuario);
                }
            },
            onError: (errors) => {
                setCancionesUsuario(prevCanciones =>
                    prevCanciones.map(song =>
                        song.id === idCancion ? { ...song, es_loopz: estaEnLoopz } : song
                    )
                );
            },
            onFinish: () => {
                setIdCancionProcesandoMeGusta(null);
            },
        });
    }, [idCancionProcesandoMeGusta]);
    const obtenerOpcionesMenuContexto = useCallback(() => {
        if (!menuContexto.cancion) return [];
        const opciones = [];
        opciones.push({
            label: "Ver cancion",
            icon: <IconoNotaMusicalSolido className="h-5 w-5" />,
            action: () => {
                router.visit(route('canciones.show', menuContexto.cancion.id));
                cerrarMenuContexto();
            },
        });
        opciones.push({
            label: menuContexto.cancion.es_loopz ? "Quitar LoopZ" : "Añadir LoopZ",
            action: () => manejarAlternarLoopzCancion(menuContexto.cancion.id, menuContexto.cancion.es_loopz),
            icon: menuContexto.cancion.es_loopz ? <IconoCorazonSolido className="h-5 w-5 text-purple-500" /> : <IconoCorazonContorno className="h-5 w-5" />,
            disabled: idCancionProcesandoMeGusta === menuContexto.cancion.id,
        });
        if (añadirSiguiente) {
            opciones.push({
                label: "Añadir a la cola",
                action: manejarAnadirAlaColaSiguiente,
                icon: <IconoListaCola className="h-5 w-5" />,
            });
        }
        opciones.push({
            label: "Añadir a playlist",
            icon: <IconoFlechaArribaCuadrado className="h-5 w-5" />,
            submenu: 'userPlaylists',
        });
        if (menuContexto.cancion.usuarios && Array.isArray(menuContexto.cancion.usuarios) && menuContexto.cancion.usuarios.length > 0) {
            const opcionesSubmenuArtista = menuContexto.cancion.usuarios.map(artista => ({
                label: artista.name,
                action: () => manejarVerArtista(artista),
                icon: <IconoUsuario className="h-5 w-5" />,
                disabled: !artista?.id || !artista?.name,
            }));
            opciones.push({
                label: "Compartir",
                icon: <IconoCompartir className="h-5 w-5" />,
                action: manejarCompartirCancion,
            });
            opciones.push({
                label: `Ver artista${menuContexto.cancion.usuarios.length > 1 ? 's' : ''}`,
                icon: <IconoUsuario className="h-5 w-5" />,
                submenu: opcionesSubmenuArtista,
                disabled: opcionesSubmenuArtista.length === 0,
            });
        } else if (menuContexto.cancion.artista) {
            opciones.push({
                label: `Artista: ${menuContexto.cancion.artista}`,
                icon: <IconoUsuario className="h-5 w-5 text-gray-400" />,
                disabled: true,
            });
        }
        return opciones;
    }, [menuContexto.cancion, manejarAlternarLoopzCancion, idCancionProcesandoMeGusta, añadirSiguiente, manejarCompartirCancion, manejarAnadirAlaColaSiguiente, manejarAlternarCancion, auth.user?.playlists, manejarVerArtista]);
    const [mostrarModalSeguidores, setMostrarModalSeguidores] = useState(false);
    const [mostrarModalSeguidos, setMostrarModalSeguidos] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Perfil" />
            <ContextMenu
                x={menuContexto.x}
                y={menuContexto.y}
                show={menuContexto.mostrar}
                onClose={cerrarMenuContexto}
                options={obtenerOpcionesMenuContexto()}
                userPlaylists={(auth.user?.playlists || []).map(p => ({
                    id: p.id,
                    name: p.nombre,
                    canciones: p.canciones || [],
                    imagen: p.imagen,
                    action: () => manejarAlternarCancion(menuContexto.cancion?.id, p.id),
                }))}
                currentSong={menuContexto.cancion}
            />
            <div key={url} className="pt-16 pb-12 min-h-screen">
                <div className="mx-auto max-w-7xl space-y-10 sm:px-6 lg:px-8">
                    <div className="relative">
                        <div className="bg-gray-800 shadow-xl sm:rounded-lg overflow-hidden">
                            <ImagenPerfilConMarcador src={usuario.banner_perfil} alt="Banner del perfil" claseImagen="w-full h-52 sm:h-72 object-cover" claseMarcador="w-full h-52 sm:h-72 bg-gray-700 flex items-center justify-center" tipo="banner" esStorage={true} />
                        </div>
                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 z-10">
                            <ImagenPerfilConMarcador
                                src={usuario.foto_perfil}
                                alt={`Foto de perfil de ${usuario.name}`}
                                claseImagen="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-gray-800 shadow-md"
                                claseMarcador="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-gray-800 bg-gray-700 flex items-center justify-center text-white text-4xl sm:text-5xl shadow-md"
                                tipo="perfil"
                                nombre={usuario.name}
                                esStorage={true}
                            />
                        </div>
                    </div>
                    <div className="mt-72 sm:mt-96 px-4 sm:px-6">
                        <div className="flex justify-end mb-4">
                            {(esCreador) ? (
                                <Link
                                    href={route('profile.edit', usuario.id)}
                                    className="inline-flex items-center px-4 py-2 bg-transparent border border-gray-600 rounded-full font-semibold text-xs text-gray-200 uppercase tracking-widest hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                >
                                    Editar perfil
                                </Link>
                            ) : (
                                <div className="hidden sm:block" style={{ width: '96px', height: '40px' }}></div>
                            )}
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
                            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                                {!esCreador ? (
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
                                        className={`px-6 py-2 rounded-full text-sm font-medium ${is_following
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                            } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500`}
                                    >
                                        {is_following ? 'Dejar de seguir' : 'Seguir'}
                                    </button>
                                ) : (
                                    <div style={{ width: '96px', height: '40px' }} className="hidden sm:block"></div>
                                )}
                                {cancionesUsuario && cancionesUsuario.length > 0 && (
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={manejarReproducirPausarCancionesUsuario}
                                            disabled={estaCargandoJugadorEstaFuente || !cancionesUsuario || cancionesUsuario.length === 0}
                                            aria-label={esFuenteActualReproduciendoCancionesUsuario ?
                                                'Pausar canciones del usuario' : (sourceId === idFuenteCancionesUsuario && cancionActual ? 'Continuar reproducción de canciones del usuario' : 'Reproducir todas las canciones del usuario')}
                                            className="flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-md hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {estaCargandoJugadorEstaFuente ?
                                                <IconoCargando className="h-6 w-6 animate-spin" /> : esFuenteActualReproduciendoCancionesUsuario ? <IconoPausarSolido className="h-6 w-6" /> : <IconoReproducirSolido className="h-6 w-6" />}
                                        </button>
                                        <button
                                            onClick={manejarAlternarAleatorioCancionesUsuario}
                                            disabled={!cancionesUsuario ||
                                                cancionesUsuario.length === 0}
                                            aria-label={aleatorio ?
                                                "Desactivar modo aleatorio para canciones del usuario" : "Activar modo aleatorio para canciones del usuario"}
                                            className={`flex items-center justify-center p-3 border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed ${aleatorio
                                                ?
                                                'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500'
                                                : 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white focus:ring-gray-500'
                                                }`}
                                        >
                                            <IconoAleatorio className="h-6 w-6" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-10">
                        {cancionesUsuario && cancionesUsuario.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Canciones</h3>
                                    {cancionesUsuario.length > 10 && (
                                        <button
                                            onClick={() => setMostrarTodasLasCanciones(!mostrarTodasLasCanciones)}
                                            className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 mr-6 focus:outline-none"
                                        >
                                            {mostrarTodasLasCanciones ? 'Mostrar menos' : 'Mostrar todas'}
                                        </button>
                                    )}
                                </div>

                                <ListaCancionesPerfil
                                    items={cancionesAMostrar}
                                    tipoItem="cancion"
                                    nombreRuta={null}
                                    alReproducirPausarCancion={manejarReproducirPausarCancionIndividual}
                                    idCancionActual={cancionActual?.id}
                                    reproduciendo={Reproduciendo}
                                    jugadorCargando={estaCargandoJugador}
                                    idFuenteActual={sourceId}
                                    idFuentePrincipal={idFuenteCancionesUsuario}
                                    alAlternarLoopz={manejarAlternarLoopzCancion}
                                    idCancionProcesandoMeGusta={idCancionProcesandoMeGusta}
                                    alMenuContexto={abrirMenuContexto}
                                />
                            </div>
                        )}
                        {playlistsUsuario && playlistsUsuario.length > 0 && (
                            <div>
                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Playlists</h3>
                                <ListaVisualizacionPerfil items={playlistsUsuario} idUsuarioAutenticado={idUsuarioAutenticado} tipoPredeterminado="playlist" />
                            </div>
                        )}
                        {albumesUsuario && albumesUsuario.length > 0 && (
                            <div>
                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Álbumes</h3>
                                <ListaVisualizacionPerfil items={albumesUsuario} idUsuarioAutenticado={idUsuarioAutenticado} tipoPredeterminado="album" />
                            </div>
                        )}
                        {epsUsuario && epsUsuario.length > 0 && (
                            <div>
                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">EPs</h3>
                                <ListaVisualizacionPerfil items={epsUsuario} idUsuarioAutenticado={idUsuarioAutenticado} tipoPredeterminado="ep" />
                            </div>
                        )}
                        {singlesUsuario && singlesUsuario.length > 0 && (
                            <div>
                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-100 mb-5 px-4 sm:px-6">Singles</h3>
                                <ListaVisualizacionPerfil items={singlesUsuario} idUsuarioAutenticado={idUsuarioAutenticado} tipoPredeterminado="single" />
                            </div>
                        )}
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
            <Notificacion
                mostrar={mostrarNotificacion}
                mensaje={mensajeNotificacion}
                tipo="success"
            />
        </AuthenticatedLayout>
    );
}
