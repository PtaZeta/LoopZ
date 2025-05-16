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

const obtenerUrlImagen = item => {
  if (!item) return null;
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
  }
};

const formatearDuracion = segundos => {
  if (typeof segundos !== 'number' || isNaN(segundos) || segundos < 0) return '0:00';
  const m = Math.floor(segundos / 60), s = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder }) => {
  const [error, setError] = useState(false);
  const url = src ? (src.startsWith('http') ? src : `/storage/${src}`) : null;
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
  const title = objeto.titulo || objeto.name || objeto.nombre || 'Desconocido';
  const {
    cargarColaYIniciar,
    Reproduciendo,
    play,
    pause,
    cancionActual,
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
    if (isCurrent) {
      return Reproduciendo ? pause() : play();
    }
    if (canciones.length) {
      cargarColaYIniciar(canciones, { id: sourceKey, type: 'search-container', iniciar: 0 });
    } else {
      alert(`No hay canciones para reproducir en ${getTipoNombreMayuscula(tipo)}.`);
    }
  };

  return (
    <Link href={href} className="bg-gradient-to-b from-gray-800 to-gray-850 rounded-lg shadow-lg overflow-hidden flex flex-col items-center text-center p-4 pb-0 transition duration-300 ease-in-out hover:from-gray-700 hover:to-gray-750 hover:shadow-xl w-full group">
      <div className={`relative w-full ${tipo==='user'?'w-24 h-24 aspect-square rounded-full':'aspect-square'} mb-3 transform transition-transform duration-300 ease-in-out group-hover:scale-105`}>
        <ImagenConPlaceholder
          src={imageUrl}
          alt={title}
          claseImagen={`absolute inset-0 w-full h-full object-cover ${tipo==='user'?'rounded-full':'rounded'}`}
          clasePlaceholder={`absolute inset-0 w-full h-full bg-gray-750 flex items-center justify-center ${tipo==='user'?'rounded-full':'rounded'}`}
        />
        {canciones.length > 0 && (
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
      {tipo !== 'user' && (
        <p className="text-xs text-gray-400 mt-1 truncate w-full">
          {(objeto.usuarios?.map(u => u.name).join(', ') || objeto.artista) || 'Desconocido'}
        </p>
      )}
      {tipo === 'user' && <p className="text-xs text-gray-400 mt-1 truncate w-full">Perfil</p>}
    </Link>
  );
});

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
        disabled={isThisLoading}
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

export default function SearchIndex({ searchQuery, results }) {
  const secciones = [
    { key: 'user', items: results.users || [], label: 'Perfiles' },
    { key: 'cancion', items: results.canciones || [], label: 'Canciones' },
    { key: 'playlist', items: results.playlists || [], label: 'Playlists' },
    { key: 'ep', items: results.eps || [], label: 'EPs' },
    { key: 'single', items: results.singles || [], label: 'Singles' },
    { key: 'album', items: results.albumes || [], label: 'Álbumes' }
  ];

  const primero = secciones.find(s => s.items.length > 0);
  const principal = primero?.items[0] || null;
  const principalKey = primero?.key || null;

  const filtrados = {};
  secciones.forEach(s => {
    filtrados[s.key] = s.key === principalKey ? s.items.slice(1) : s.items;
  });

  const {
    cargarColaYIniciar,
    Reproduciendo,
    play,
    pause,
    cancionActual,
    sourceId,
    cargando
  } = useContext(PlayerContext);

  const principalSourceKey = `search-principal-${principal?.id}`;
  const isPrincipal = sourceId === principalSourceKey;
  const handlePrincipalPlay = () => {
    if (!principal) return;
    if (isPrincipal) return Reproduciendo ? pause() : play();
    cargarColaYIniciar([principal], { id: principalSourceKey, type: 'search-principal' });
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Resultados: "${searchQuery}"`} />
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
                  alt={principal.nombre || principal.name || principal.titulo}
                  claseImagen="w-full h-full object-cover"
                  clasePlaceholder="w-full h-full bg-gray-700 flex items-center justify-center"
                />
              </div>
              <div className="flex-grow">
                <p className="text-gray-400 uppercase text-xs font-semibold">
                  {principalKey === 'user' ? 'Perfil' : getTipoNombreMayuscula(principalKey)}
                </p>
                <p className="text-white text-3xl font-bold mt-1 line-clamp-2">
                  {principal.nombre || principal.name || principal.titulo}
                </p>
              </div>
            </Link>

            {/* Botón principal */}
            {principalKey === 'cancion' && (
              <button
                onClick={handlePrincipalPlay}
                className="absolute top-4 right-4 inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white shadow-lg hover:scale-105 transition-transform focus:outline-none"
                disabled={cargando && !isPrincipal}
              >
                {cargando && !isPrincipal
                  ? <LoadingIconSolid className="h-7 w-7 animate-spin" />
                  : isPrincipal && Reproduciendo
                    ? <PauseIcon className="h-7 w-7" />
                    : <PlayIcon className="h-7 w-7" />}
              </button>
            )}
          </div>
        )}

        {secciones
          .filter(s => s.key !== principalKey)
          .map(({ key, label }) => (
            filtrados[key]?.length > 0 && (
              <section key={key} className="mb-8">
                <h2 className="text-white text-xl font-semibold mb-4">{label}</h2>
                {key === 'cancion' ? (
                  <div className="flex flex-col gap-2">
                    {filtrados[key].map(c => <CancionListaItem key={c.id} cancion={c} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filtrados[key].map(o => <ResultadoCard key={`${key}-${o.id}`} objeto={o} tipo={key} />)}
                  </div>
                )}
              </section>
            )
          ))}

        {!principal && secciones.every(s => (results[s.key] || []).length === 0) && (
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
  })
};
