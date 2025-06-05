import React, { useState, useContext, memo, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { PlayerContext } from '@/contexts/PlayerContext';
import Notificacion from '@/Components/Notificacion';
import ContextMenu from '@/Components/ContextMenu';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon as LoadingIconSolid,
  EllipsisVerticalIcon,
  ShareIcon,
  QueueListIcon,
  ArrowUpOnSquareIcon,
  HeartIcon as HeartIconOutline,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';


const obtenerUrlImagen = (item, tipo) => {
  if (!item) return null;
  if (tipo === 'user' && item.foto_perfil) return item.foto_perfil;
  if (tipo === 'cancion' && item.foto_url) return item.foto_url;
  if (item.imagen) return item.imagen;
  if (item.foto_url) return item.foto_url;
  if (item.foto_perfil) return item.foto_perfil;
  if (item.image_url) return item.image_url;
  return null;
};

const getTipoNombreMayuscula = tipo => {
  if (!tipo) return 'Elemento';
  switch (tipo) {
    case 'album': return 'Álbum';
    case 'playlist': return 'Playlist';
    case 'ep': return 'EP';
    case 'single': return 'Single';
    case 'user': return 'Perfil';
    case 'cancion': return 'Canción';
    default: return 'Elemento';
  }
};

const construirRuta = (tipo, id) => {
  switch (tipo) {
    case 'user': return route('profile.show', id);
    case 'cancion': return route('canciones.show', id);
    case 'playlist': return route('playlists.show', id);
    case 'album': return route('albumes.show', id);
    case 'ep': return route('eps.show', id);
    case 'single': return route('singles.show', id);
    default: return '#';
  }
};

const formatearDuracion = segundos => {
  if (typeof segundos !== 'number' || isNaN(segundos) || segundos < 0) return '0:00';
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder }) => {
  const [error, setError] = useState(false);
  const url = src ? (src.startsWith('http://') || src.startsWith('https://') ? src : `/storage/${src}`) : null;

  useEffect(() => { setError(false); }, [src]);

  if (url && !error) {
    return <img src={url} alt={alt} className={claseImagen} loading="lazy" onError={() => setError(true)} />;
  }
  return (
    <div className={clasePlaceholder}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
    </div>
  );
};

const ResultadoCard = memo(({ objeto, tipo }) => {
  const href = construirRuta(tipo, objeto.id);
  const imageUrl = obtenerUrlImagen(objeto, tipo);
  const title = objeto.name || objeto.titulo || objeto.nombre || 'Desconocido';
  const {
    cargarColaYIniciar,
    Reproduciendo,
    play,
    pause,
    sourceId,
    cargando
  } = useContext(PlayerContext);

  const sourceKey = tipo === 'cancion'
    ? `search-cancion-${objeto.id}`
    : `search-container-${objeto.id}`;
  const isCurrent = sourceId === sourceKey;
  const canciones = (tipo === 'cancion' && objeto.archivo_url) ? [objeto] : (objeto.canciones || []);

  const handlePlayClick = e => {
    e.preventDefault(); e.stopPropagation();
    if (cargando && !isCurrent) return;

    if (isCurrent) {
      return Reproduciendo ? pause() : play();
    }

    if (canciones.length) {
      if (tipo === 'cancion' && objeto.archivo_url) {
        cargarColaYIniciar([objeto], { id: sourceKey, type: 'search-result-single-song' });
      } else {
        cargarColaYIniciar(canciones, { id: sourceKey, type: 'search-container', iniciar: 0 });
      }
    } else {
      if (canciones.length === 0) {
        alert(`No hay canciones para reproducir en ${getTipoNombreMayuscula(tipo)}.`);
      }
    }
  };

  const showPlayButton = tipo === 'cancion' || (canciones.length > 0);

  const isUserType = tipo === 'user';
  const cardClasses = `
    bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden
    flex flex-col items-center text-center p-4 pb-0
    transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl w-full group
  `;

  const imageContainerClasses = `
    relative w-full aspect-square mb-3 transform transition-transform duration-300 ease-in-out group-hover:scale-105
    ${isUserType ? 'rounded-full' : 'rounded'}
  `;

  const imageClasses = `
    absolute inset-0 w-full h-full object-cover
    ${isUserType ? 'rounded-full' : 'rounded'}
  `;

  const placeholderClasses = `
    absolute inset-0 w-full h-full bg-gray-750 flex items-center justify-center
    ${isUserType ? 'rounded-full' : 'rounded'}
  `;

  return (
    <Link href={href} className={cardClasses}>
      <div className={imageContainerClasses}>
        <ImagenConPlaceholder
          src={imageUrl}
          alt={title}
          claseImagen={imageClasses}
          clasePlaceholder={placeholderClasses}
        />
        {showPlayButton && (
          <button
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
            disabled={cargando && !isCurrent}
          >
            {cargando && isCurrent
              ? <LoadingIconSolid className="w-7 h-7 animate-spin text-white" />
              : isCurrent && Reproduciendo
                ? <PauseIcon className="w-7 h-7 text-white" />
                : <PlayIcon className="w-7 h-7 text-white" />}
          </button>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-100 group-hover:text-white group-hover:underline line-clamp-2" title={title}>{title}</p>
      <p className="text-xs text-gray-400 mt-1 truncate w-full">
        {getTipoNombreMayuscula(tipo)}
      </p>
    </Link>
  );
});

ResultadoCard.propTypes = {
    objeto: PropTypes.object.isRequired,
    tipo: PropTypes.string.isRequired,
};

const CancionListaItem = ({ cancion, openContextMenu, openContextMenuMobile, isMobile, auth, likeProcessing, manejarCancionLoopzToggle }) => {
  const {
    cargarColaYIniciar,
    Reproduciendo,
    play,
    pause,
    cancionActual,
    sourceId,
    cargando
  } = useContext(PlayerContext);
  const isThis = cancionActual?.id === cancion.id;
  const isThisLoading = cargando && isThis;

  const handlePlay = () => {
    if (!cancion.archivo_url) return;
    if (sourceId === `search-cancion-${cancion.id}`) {
      return Reproduciendo ? pause() : play();
    }
    cargarColaYIniciar([cancion], { id: `search-cancion-${cancion.id}`, type: 'search-result' });
  };

  return (
    <div
      className="flex items-center py-2 px-2 hover:bg-gray-700 rounded-md transition duration-150 ease-in-out group relative"
      onContextMenu={!isMobile ? (e) => openContextMenu(e, cancion) : undefined}
    >
      <button
        onClick={handlePlay}
        className={`flex-shrink-0 p-1 ${isThis ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'}`}
        disabled={isThisLoading || !cancion.archivo_url}
      >
        {isThisLoading
          ? <LoadingIconSolid className="h-5 w-5 animate-spin text-blue-500" />
          : isThis
            ? <PauseIcon className="h-5 w-5" />
            : <PlayIcon className="h-5 w-5" />}
      </button>
      <div className="flex-shrink-0 w-12 h-12 mr-3">
        <ImagenConPlaceholder
          src={obtenerUrlImagen(cancion, 'cancion')}
          alt={cancion.titulo}
          claseImagen="w-full h-full object-cover rounded-md"
          clasePlaceholder="w-full h-full bg-gray-750 rounded-md flex items-center justify-center"
        />
      </div>
      <Link href={construirRuta('cancion', cancion.id)} className="flex-grow truncate">
        <p className="text-white text-sm font-semibold truncate">{cancion.titulo}</p>
        <p className="text-gray-400 text-xs truncate">{(cancion.usuarios?.map(u => u.name).join(', ') || cancion.artista) || 'Desconocido'}</p>
      </Link>
      {cancion.duracion && <span className="ml-2 text-gray-400 text-xs">{formatearDuracion(cancion.duracion)}</span>}

      {auth.user && (
          <button
              onClick={() => manejarCancionLoopzToggle(cancion.id, cancion.is_in_user_loopz)}
              disabled={likeProcessing === cancion.id}
              className={`p-1 text-gray-400 hover:text-purple-400 focus:outline-none flex-shrink-0 ml-auto ${likeProcessing === cancion.id ? 'cursor-wait' : ''}`}
              title={cancion.is_in_user_loopz ? "Quitar de LoopZ" : "Añadir a LoopZ"}
          >
              {likeProcessing === cancion.id ? <LoadingIconSolid className="h-5 w-5 animate-spin text-purple-400" /> :
                  (cancion.is_in_user_loopz ? (<HeartIconSolid className="h-5 w-5 text-purple-500" />) : (<HeartIconOutline className="h-5 w-5" />))
              }
          </button>
      )}

      {isMobile && (
        <button
            onClick={(e) => openContextMenuMobile(e, cancion)}
            className="p-1 text-gray-400 hover:text-gray-200 focus:outline-none flex-shrink-0 ml-1"
            title="Opciones"
        >
            <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

CancionListaItem.propTypes = {
    cancion: PropTypes.object.isRequired,
    openContextMenu: PropTypes.func.isRequired,
    openContextMenuMobile: PropTypes.func.isRequired,
    isMobile: PropTypes.bool.isRequired,
    auth: PropTypes.object.isRequired,
    likeProcessing: PropTypes.string,
    manejarCancionLoopzToggle: PropTypes.func.isRequired,
};

export default function SearchIndex({ searchQuery, results, principal, principalKey, relatedContent, relatedSongs, auth }) {
  const {
    cargarColaYIniciar,
    Reproduciendo,
    play,
    pause,
    sourceId,
    cargando,
    añadirSiguiente = () => {},
  } = useContext(PlayerContext);

  const page = usePage();
  const [cancionesState, setCancionesState] = useState(relatedSongs || []);
  const [likeProcessing, setLikeProcessing] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [mensajeToast, setMensajeToast] = useState('');
  const [contextMenu, setContextMenu] = useState({
      show: false,
      x: 0,
      y: 0,
      song: null,
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCancionesState(relatedSongs || []);
  }, [relatedSongs]);


  const principalSourceKey = `search-principal-${principalKey}-${principal?.id}`;
  const isPrincipalPlayingOrLoading = sourceId === principalSourceKey;

  const handlePrincipalPlay = () => {
    if (!principal) return;
    if (principalKey === 'cancion' && principal.archivo_url) {
      if (isPrincipalPlayingOrLoading) {
        return Reproduciendo ? pause() : play();
      }
      cargarColaYIniciar([principal], { id: principalSourceKey, type: 'search-principal' });
    } else if (principal.canciones && principal.canciones.length > 0) {
      if (isPrincipalPlayingOrLoading) {
        return Reproduciendo ? pause() : play();
      }
      cargarColaYIniciar(principal.canciones, { id: principalSourceKey, type: 'search-principal-container', iniciar: 0 });
    } else {
      alert(`No hay canciones para reproducir en este ${getTipoNombreMayuscula(principalKey)}.`);
    }
  };

  const showPrincipalPlayButton = principal && (principalKey === 'cancion' || (principal.canciones && principal.canciones.length > 0));

  const sectionsToRender = [];

  const copiarAlPortapapeles = useCallback((texto, mensaje = 'Guardado en el portapapeles') => {
    navigator.clipboard.writeText(texto).then(() => {
        setMensajeToast(mensaje);
        setMostrarToast(true);
        setTimeout(() => { setMostrarToast(false); }, 3000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        setMensajeToast('Error al copiar');
        setMostrarToast(true);
        setTimeout(() => { setMostrarToast(false); }, 3000);
    });
  }, []);

  const closeContextMenu = useCallback(() => {
      setContextMenu({ ...contextMenu, show: false, song: null });
  }, [contextMenu]);

  const manejarCancionLoopzToggle = useCallback((songId, isInLoopz) => {
    if (!songId || likeProcessing === songId) return;
    setLikeProcessing(songId);

    setCancionesState(prevCanciones => {
        if (!prevCanciones) return prevCanciones;
        const newCanciones = [...prevCanciones];
        const songIndex = newCanciones.findIndex(c => c.id === songId);

        if (songIndex !== -1) {
            newCanciones[songIndex] = {
                ...newCanciones[songIndex],
                is_in_user_loopz: !isInLoopz
            };
        }
        return newCanciones;
    });

    router.post(route('cancion.loopz', { cancion: songId }), {}, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: (page) => {
            if (page.props.flash?.song_loopz_status) {
                setMensajeToast(page.props.flash.song_loopz_status);
                setMostrarToast(true);
            }
            if (contextMenu.show && contextMenu.song?.id === songId) {
                closeContextMenu();
            }
        },
        onError: (errors) => {
            setCancionesState(prevCanciones => {
                if (!prevCanciones) return prevCanciones;
                const newCanciones = [...prevCanciones];
                const songIndex = newCanciones.findIndex(c => c.id === songId);
                if (songIndex !== -1) {
                    newCanciones[songIndex] = { ...newCanciones[songIndex], is_in_user_loopz: isInLoopz };
                }
                return newCanciones;
            });
            setMensajeToast(errors.message || 'Error al actualizar LoopZ.');
            setMostrarToast(true);
        },
        onFinish: () => {
            setLikeProcessing(null);
        },
    });
  }, [likeProcessing, contextMenu.show, contextMenu.song, closeContextMenu]);

  const manejarToggleCancion = useCallback((cancionId, playlistId) => {
    if (!cancionId || !playlistId) return;
    router.post(
        route('playlist.toggleCancion', {
            playlist: playlistId,
            cancion: cancionId
        }),
        {},
        {
            preserveScroll: true,
            onSuccess: (page) => {
                closeContextMenu();
                setMensajeToast(page.props.flash?.message || 'Canción actualizada en la playlist.');
                setMostrarToast(true);
                setTimeout(() => { setMostrarToast(false); }, 3000);
                router.reload({ only: ['auth.user.playlists'] });
            },
            onError: (errors) => {
                setMensajeToast(errors.message || 'Error al actualizar la canción en la playlist.');
                setMostrarToast(true);
                setTimeout(() => { setMostrarToast(false); }, 3000);
            }
        }
    );
  }, [closeContextMenu]);

  const openContextMenu = useCallback((event, song) => {
      event.preventDefault();
      setContextMenu({
          show: true,
          x: event.pageX,
          y: event.pageY,
          song: song,
      });
  }, []);

  const openContextMenuMobile = useCallback((event, song) => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      setContextMenu({
          show: true,
          x: rect.left + window.scrollX + rect.width / 2,
          y: rect.bottom + window.scrollY + 10,
          song: song,
      });
  }, []);

  const handleAddToQueueNext = useCallback(() => {
    if (contextMenu.song && añadirSiguiente) {
        añadirSiguiente(contextMenu.song);
        closeContextMenu();
        setMensajeToast('Canción añadida a la cola');
        setMostrarToast(true);
        setTimeout(() => { setMostrarToast(false); }, 3000);
    }
  }, [contextMenu.song, añadirSiguiente, closeContextMenu]);

  const handleCompartirCancion = useCallback(() => {
    if (contextMenu.song) {
        const songUrl = route('canciones.show', contextMenu.song.id);
        copiarAlPortapapeles(songUrl, 'URL de canción copiada');
        closeContextMenu();
    }
  }, [contextMenu.song, copiarAlPortapapeles, closeContextMenu]);

  const getContextMenuOptions = useCallback(() => {
      if (!contextMenu.song) return [];
      const options = [];
      options.push({
          label: "Ver canción",
          icon: <MusicalNoteIcon className="h-5 w-5" />,
          action: () => {
              router.visit(route('canciones.show', contextMenu.song.id));
              closeContextMenu();
          },
      });

      options.push({
          label: contextMenu.song.is_in_user_loopz ? "Quitar de LoopZ" : "Añadir a LoopZ",
          action: () => manejarCancionLoopzToggle(contextMenu.song.id, contextMenu.song.is_in_user_loopz),
          icon: contextMenu.song.is_in_user_loopz ? <HeartIconSolid className="h-5 w-5 text-purple-500" /> : <HeartIconOutline className="h-5 w-5" />,
          disabled: likeProcessing === contextMenu.song.id,
      });

      options.push({
          label: "Añadir a la cola",
          action: handleAddToQueueNext,
          icon: <QueueListIcon className="h-5 w-5" />,
          disabled: !añadirSiguiente,
      });

      if (auth.user) {
          options.push({
              label: "Añadir a playlist",
              icon: <ArrowUpOnSquareIcon className="h-5 w-5" />,
              submenu: 'userPlaylists',
          });
      }

      options.push({
          label: "Compartir",
          icon: <ShareIcon className="h-5 w-5" />,
          action: handleCompartirCancion,
      });

      return options;
  }, [
      contextMenu.song,
      manejarCancionLoopzToggle,
      likeProcessing,
      handleAddToQueueNext,
      handleCompartirCancion,
      añadirSiguiente,
      auth.user,
      closeContextMenu
  ]);

  if (cancionesState && cancionesState.length > 0) {
      sectionsToRender.push({
          key: 'all_related_songs',
          label: `Canciones`,
          items: cancionesState,
          type: 'cancion'
      });
  }

  const relatedSectionLabels = {
      'artistas_relacionados': 'Artistas relacionados',
      'playlists_del_artista': 'Playlists del artista',
      'albumes_del_artista': 'Álbumes del artista',
      'eps_del_artista': 'EPs del artista',
      'singles_del_artista': 'Singles del artista',
      'mas_de_estos_artistas': 'Más de estos artistas',
      'artistas_de_la_cancion': 'Artistas de la canción',
      'contenedores_del_artista': 'Álbumes y Playlists del artista',
  };

  Object.keys(relatedContent).forEach(key => {
      if (relatedContent[key] && relatedContent[key].length > 0) {
          let sectionItemType;
          if (key.includes('artistas')) sectionItemType = 'user';
          else if (key.includes('canciones')) sectionItemType = 'cancion';
          else sectionItemType = relatedContent[key][0]?.tipo || 'album';

          sectionsToRender.push({
              key: `related_${key}`,
              label: relatedSectionLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              items: relatedContent[key],
              type: sectionItemType
          });
      }
  });


  const displayedTypes = new Set(sectionsToRender.map(s => s.type));
  if (cancionesState && cancionesState.length > 0) displayedTypes.add('cancion');

  ['users', 'playlists', 'eps', 'singles', 'albumes']
    .forEach(key => {
      if (results[key] && results[key].length > 0) {
        if (!displayedTypes.has(key.slice(0, -1))) {
            sectionsToRender.push({
                key: `general_${key}`,
                label: `Más ${getTipoNombreMayuscula(key.slice(0, -1)).toLowerCase()}${key.endsWith('s') ? 's' : ''} de tu búsqueda`,
                items: results[key],
                type: key.slice(0, -1)
            });
        }
      }
    });

  const noResultsFound = !principal && sectionsToRender.every(s => s.items.length === 0);

  return (
    <AuthenticatedLayout>
      <Head title={`Resultados: "${searchQuery}"`} />

      <div className="relative z-[9999]">
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          show={contextMenu.show}
          onClose={closeContextMenu}
          options={getContextMenuOptions()}
          userPlaylists={(auth.user?.playlists || []).map(p => ({
              id: p.id,
              name: p.nombre,
              action: () => manejarToggleCancion(contextMenu.song?.id, p.id),
              canciones: p.canciones || [],
              imagen: p.imagen,
          }))}
          currentSong={contextMenu.song}
        />
      </div>

      <Notificacion
          mostrar={mostrarToast}
          mensaje={mensajeToast}
          tipo="success"
      />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl text-white mb-6">
          Resultados para <span className="text-green-400">"{searchQuery}"</span>
        </h1>

        {principal && (
          <div className="relative mb-8 bg-gray-800 rounded-lg p-6 flex flex-col md:flex-row items-center shadow-lg">
            <Link
              href={construirRuta(principalKey, principal.id)}
              className="flex items-center group w-full md:w-auto mb-4 md:mb-0"
            >
              <div className={`relative ${principalKey === 'user' ? 'w-32 h-32 rounded-full' : 'w-32 h-32 rounded-lg'} overflow-hidden mr-6`}>
                <ImagenConPlaceholder
                  src={obtenerUrlImagen(principal, principalKey)}
                  alt={principal.name || principal.titulo || principal.nombre}
                  claseImagen="w-full h-full object-cover"
                  clasePlaceholder="w-full h-32 bg-gray-700 flex items-center justify-center rounded-lg"
                />
              </div>
              <div className="flex-grow">
                <p className="text-gray-400 uppercase text-xs font-semibold">
                  {getTipoNombreMayuscula(principalKey)}
                </p>
                <p className="text-white text-3xl font-bold mt-1 line-clamp-2">
                  {principal.name || principal.titulo || principal.nombre}
                </p>
                {principalKey !== 'user' && (
                    <p className="text-sm text-gray-400 mt-1 truncate">
                        {(principal.usuarios?.map(u => u.name).join(', ') || principal.artista) || 'Desconocido'}
                    </p>
                )}
              </div>
            </Link>

            {showPrincipalPlayButton && (
              <button
                onClick={handlePrincipalPlay}
                className="absolute top-4 right-4 inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white shadow-lg hover:scale-105 transition-transform focus:outline-none"
                disabled={cargando && !isPrincipalPlayingOrLoading}
              >
                {cargando && isPrincipalPlayingOrLoading
                  ? <LoadingIconSolid className="h-7 w-7 animate-spin" />
                  : isPrincipalPlayingOrLoading && Reproduciendo
                    ? <PauseIcon className="h-7 w-7" />
                    : <PlayIcon className="h-7 w-7" />}
              </button>
            )}
          </div>
        )}

        {sectionsToRender.map((section, index) => (
          section.items.length > 0 && (
            <section key={section.key || `section-${index}`} className="mb-8">
              <h2 className="text-white text-xl font-semibold mb-4">{section.label}</h2>
              {section.type === 'cancion' ? (
                <div className="flex flex-col gap-2">
                  {section.items.map(c => (
                    <CancionListaItem
                      key={c.id}
                      cancion={c}
                      openContextMenu={openContextMenu}
                      openContextMenuMobile={openContextMenuMobile}
                      isMobile={isMobile}
                      auth={auth}
                      likeProcessing={likeProcessing}
                      manejarCancionLoopzToggle={manejarCancionLoopzToggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {section.items.map(o => <ResultadoCard key={`${o.tipo || 'desconocido'}-${o.id}`} objeto={o} tipo={o.tipo || section.type} />)}
                </div>
              )}
            </section>
          )
        ))}

        {noResultsFound && (
          <p className="text-gray-400">No se encontraron resultados.</p>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

SearchIndex.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  results: PropTypes.shape({
    users: PropTypes.array,
    canciones: PropTypes.array,
    playlists: PropTypes.array,
    albumes: PropTypes.array,
    eps: PropTypes.array,
    singles: PropTypes.array,
  }),
  principal: PropTypes.object,
  principalKey: PropTypes.string,
  relatedContent: PropTypes.object,
  relatedSongs: PropTypes.array,
  auth: PropTypes.object.isRequired,
};
