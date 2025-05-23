import React, { useState, useContext, memo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { PlayerContext } from '@/contexts/PlayerContext';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon as LoadingIconSolid
} from '@heroicons/react/24/outline';

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
  const m = Math.floor(segundos / 60), s = Math.floor(segundos % 60).toString().padStart(2, '0');
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

  return (
    <Link href={href} className="bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center p-4 pb-0 transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl w-full group">
      <div className={`relative w-full ${tipo==='user'?'w-24 h-24 aspect-square rounded-full':'aspect-square'} mb-3 transform transition-transform duration-300 ease-in-out group-hover:scale-105`}>
        <ImagenConPlaceholder
          src={imageUrl}
          alt={title}
          claseImagen={`absolute inset-0 w-full h-full object-cover ${tipo==='user'?'rounded-full':'rounded'}`}
          clasePlaceholder={`absolute inset-0 w-full h-full bg-gray-750 flex items-center justify-center ${tipo==='user'?'rounded-full':'rounded'}`}
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
      {tipo === 'user' ? (
        <p className="text-xs text-gray-400 mt-1 truncate w-full">
            Perfil
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1 truncate w-full">
          {(objeto.usuarios?.map(u => u.name).join(', ') || objeto.artista) || 'Desconocido'}
        </p>
      )}
    </Link>
  );
});

ResultadoCard.propTypes = {
    objeto: PropTypes.object.isRequired,
    tipo: PropTypes.string.isRequired,
};

const CancionListaItem = ({ cancion }) => {
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
    <div className="flex items-center py-2 px-2 hover:bg-gray-700 rounded-md transition duration-150 ease-in-out group">
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
    </div>
  );
};

CancionListaItem.propTypes = {
    cancion: PropTypes.object.isRequired,
};

// MODIFICACIÓN: Aquí se pasan los nuevos props
export default function SearchIndex({ searchQuery, results, principal, principalKey, relatedContent, relatedSongs }) {
  const {
    cargarColaYIniciar,
    Reproduciendo,
    play,
    pause,
    sourceId,
    cargando
  } = useContext(PlayerContext);

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

  // Las secciones a renderizar
  const sectionsToRender = [];

  // 1. La sección de canciones relacionadas (unificada)
  if (relatedSongs && relatedSongs.length > 0) {
      sectionsToRender.push({
          key: 'all_related_songs',
          label: `Canciones`, // Etiqueta genérica para todas las canciones
          items: relatedSongs,
          type: 'cancion'
      });
  }

  // 2. Las otras secciones relacionadas (artistas, playlists, etc.)
  // Mapeamos las claves de relatedContent a sus etiquetas deseables
  const relatedSectionLabels = {
      'artistas_relacionados': 'Artistas relacionados',
      'playlists_del_artista': 'Playlists del artista',
      'albumes_del_artista': 'Álbumes del artista',
      'eps_del_artista': 'EPs del artista',
      'singles_del_artista': 'Singles del artista',
      'mas_de_estos_artistas': `Más de estos artistas`, // La etiqueta exacta se puede construir en Laravel si es dinámica
      'artistas_de_la_cancion': 'Artistas de la canción',
      'contenedores_del_artista': 'Álbumes y Playlists del artista',
  };

  Object.keys(relatedContent).forEach(key => {
      if (relatedContent[key] && relatedContent[key].length > 0) {
          let itemType;
          if (key.includes('artistas')) itemType = 'user';
          else if (key.includes('playlists')) itemType = 'playlist';
          else if (key.includes('albumes')) itemType = 'album';
          else if (key.includes('eps')) itemType = 'ep';
          else if (key.includes('singles')) itemType = 'single';
          else {
            // Intenta deducir el tipo del primer elemento si existe
            itemType = relatedContent[key][0]?.tipo || 'album'; // Default a album o lo que sea más común
          }
          sectionsToRender.push({
              key: `related_${key}`,
              label: relatedSectionLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formatear la clave
              items: relatedContent[key],
              type: itemType
          });
      }
  });


  // 3. Resultados generales de la búsqueda (lo que no es el principal ni relacionado)
  // Añadir solo si no hay resultados relacionados o si queremos que aparezcan DESPUÉS
  // Asegúrate de no duplicar tipos que ya estén en relatedSongs o otherRelatedSections
  const displayedTypes = new Set(sectionsToRender.map(s => s.type));
  if (relatedSongs && relatedSongs.length > 0) displayedTypes.add('cancion'); // Asegurar que 'cancion' se considere mostrada

  ['users', 'playlists', 'eps', 'singles', 'albumes'] // Canciones ya se manejaron
    .forEach(key => {
      if (results[key] && results[key].length > 0) {
        // Evitar añadir la sección si el tipo ya está cubierto por relatedContent o relatedSongs
        if (!displayedTypes.has(key.slice(0, -1))) { // 'users' -> 'user'
            sectionsToRender.push({
                key: `general_${key}`,
                label: `Más ${getTipoNombreMayuscula(key.slice(0, -1)).toLowerCase()}s de tu búsqueda`,
                items: results[key],
                type: key.slice(0, -1) // 'users' -> 'user', etc.
            });
        }
      }
    });

  // Si no hay principal y no hay otros resultados relevantes, mostrar mensaje
  const noResultsFound = !principal && sectionsToRender.every(s => s.items.length === 0);

  return (
    <AuthenticatedLayout>
      <Head title={`Resultados: "${searchQuery}"`} />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl text-white mb-6">
          Resultados para <span className="text-green-400">"{searchQuery}"</span>
        </h1>

        {/* Sección del resultado principal */}
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

        {/* Renderizado de las secciones (primero canciones relacionadas, luego otras relacionadas, luego generales) */}
        {sectionsToRender.map((section, index) => (
          section.items.length > 0 && (
            <section key={section.key || `section-${index}`} className="mb-8">
              <h2 className="text-white text-xl font-semibold mb-4">{section.label}</h2>
              {section.type === 'cancion' ? (
                <div className="flex flex-col gap-2">
                  {section.items.map(c => <CancionListaItem key={c.id} cancion={c} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {section.items.map(o => <ResultadoCard key={`${section.type}-${o.id}`} objeto={o} tipo={section.type} />)}
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
  relatedContent: PropTypes.object, // Ahora contiene no-canciones
  relatedSongs: PropTypes.array, // Nueva prop para todas las canciones relacionadas
};