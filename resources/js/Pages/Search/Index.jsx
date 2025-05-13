import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const obtenerUrlImagenResultado = (item, tipo) => {
  if (!item) return null;
  if (tipo === 'user' && item.foto_perfil) {
    return item.foto_perfil.startsWith('http')
      ? item.foto_perfil
      : `/storage/${item.foto_perfil}`;
  }
  if (tipo === 'cancion' && item.foto_url) {
    return item.foto_url.startsWith('http')
      ? item.foto_url
      : `/storage/${item.foto_url}`;
  }
  if (['album','ep','single','playlist'].includes(tipo) && item.imagen) {
    return item.imagen.startsWith('http')
      ? item.imagen
      : `/storage/${item.imagen}`;
  }
  if (tipo === 'cancion' && item.album?.imagen) {
    return item.album.imagen.startsWith('http')
      ? item.album.imagen
      : `/storage/${item.album.imagen}`;
  }
  return item.image_url || null;
};

const construirRuta = (tipo, id) => {
  switch (tipo) {
    case 'user':      return route('profile.show', id);
    case 'cancion':   return route('canciones.show', id);
    case 'playlist':  return route('playlists.show', id);
    case 'album':     return route('albumes.show', id);
    case 'ep':        return route('eps.show', id);
    case 'single':    return route('singles.show', id);
    default:          return '#';
  }
};

const formatDuration = seconds => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ResultItemCard = ({ item, tipo }) => {
  const href = construirRuta(tipo, item.id);
  const imageUrl = obtenerUrlImagenResultado(item, tipo);
  const isUser = tipo === 'user';
  const title = item.titulo || item.name || item.nombre || 'Desconocido';
  let subtitle = '';

  if ((tipo === 'cancion' || tipo === 'playlist') && item.usuarios?.length) {
    subtitle = item.usuarios.map(u => u.name).join(', ');
  } else if (['album','ep','single'].includes(tipo) && item.artista) {
    subtitle = item.artista;
  } else if (tipo === 'user') {
    subtitle = 'Artista';
  }

  return (
    <Link href={href} className="flex flex-col items-center bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition duration-200 group">
      <div className={`${isUser ? 'w-24 h-24 rounded-full' : 'w-full h-36 rounded-md'} overflow-hidden mb-3`}>
        {imageUrl
          ? <img src={imageUrl} alt={title} className={`${isUser ? 'rounded-full' : 'rounded-md'} w-full h-full object-cover`} />
          : <div className={`${isUser ? 'rounded-full' : 'rounded-md'} w-full h-full bg-gray-700 flex items-center justify-center text-gray-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
        }
      </div>
      <p className="text-white font-semibold truncate">{title}</p>
      {subtitle && <p className="text-gray-400 text-xs truncate mt-1">{subtitle}</p>}
    </Link>
  );
};

export default function SearchIndex({ searchQuery, results }) {
  const { users, canciones, playlists, albumes, eps, singles } = results;

  const principalList = [
    { items: users, tipo: 'user' },
    { items: canciones, tipo: 'cancion' },
    { items: playlists, tipo: 'playlist' },
    { items: albumes, tipo: 'album' },
    { items: eps, tipo: 'ep' },
    { items: singles, tipo: 'single' },
  ];
  const primero = principalList.find(section => section.items.length > 0);
  const principal = primero ? primero.items[0] : null;
  const principalTipo = primero ? primero.tipo : null;

  const filtered = {
    user:     principalTipo==='user'     ? users.slice(1)    : users,
    cancion:  principalTipo==='cancion'  ? canciones.slice(1): canciones,
    playlist: principalTipo==='playlist'? playlists.slice(1): playlists,
    album:    principalTipo==='album'    ? albumes.slice(1)  : albumes,
    ep:       principalTipo==='ep'       ? eps.slice(1)      : eps,
    single:   principalTipo==='single'   ? singles.slice(1)  : singles,
  };

  const secciones = [
    { items: filtered.cancion,  tipo: 'cancion',  label: 'Canciones' },
    { items: filtered.user,     tipo: 'user',     label: 'Perfiles'  },
    { items: filtered.playlist, tipo: 'playlist', label: 'Playlists' },
    { items: filtered.ep,       tipo: 'ep',       label: 'EPs'       },
    { items: filtered.single,   tipo: 'single',   label: 'Singles'   },
    { items: filtered.album,    tipo: 'album',    label: 'Álbumes'   },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={`Resultados: "${searchQuery}"`} />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl text-white mb-6">
          Resultados para <span className="text-green-400">"{searchQuery}"</span>
        </h1>

        {principal && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6 flex flex-col md:flex-row items-center md:items-start shadow-lg">
            <Link href={construirRuta(principalTipo, principal.id)} className="flex items-center group w-full">
              <div className={`relative ${principalTipo==='user' ? 'w-32 h-32 rounded-full' : 'w-32 h-32 rounded-lg'} overflow-hidden mr-6`}>
                {obtenerUrlImagenResultado(principal, principalTipo) ? (
                  <img
                    src={obtenerUrlImagenResultado(principal, principalTipo)}
                    alt={principal.titulo || principal.name || principal.nombre}
                    className={`w-full h-full object-cover ${principalTipo==='user'?'rounded-full':'rounded-lg'}`}
                  />
                ) : (
                  <div className={`w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 ${principalTipo==='user'?'rounded-full':'rounded-lg'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-400 uppercase text-xs font-semibold">
                  {principalTipo === 'user'
                    ? 'Perfil'
                    : principalTipo.charAt(0).toUpperCase() + principalTipo.slice(1)}
                </p>
                <p className="text-white text-3xl font-bold mt-1">
                  {principal.titulo || principal.name || principal.nombre}
                </p>
                <div className="text-gray-400 mt-2 space-y-1">
                  {['cancion','playlist'].includes(principalTipo) && principal.usuarios?.length > 0 && (
                    <p className="text-xs">
                      Artistas: {principal.usuarios.map(u => u.name).join(', ')}
                    </p>
                  )}
                  {principalTipo === 'cancion' && principal.duracion && (
                    <p className="text-xs">
                      Duración: {formatDuration(principal.duracion)}
                    </p>
                  )}
                  {( ['album','ep','single'].includes(principalTipo) && principal.artista ) && (
                    <p className="text-xs">
                      Artista: {principal.artista}
                    </p>
                  )}
                  {principalTipo === 'user' && (
                    <p className="text-xs">Artista</p>
                  )}
                </div>
              </div>
            </Link>
            {principalTipo === 'cancion' && (
              <button
                onClick={() => playSong(principal)}
                className="mt-4 md:mt-0 md:ml-auto p-3 bg-green-500 rounded-full hover:bg-green-400 transition shadow-lg"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 4l10 6-10 6V4z" clipRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {secciones.map(({ items, tipo, label }) =>
          items.length > 0 && (
            <section key={tipo} className="mb-8">
              <h2 className="text-white text-xl font-semibold mb-4">{label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map(item => (
                  <ResultItemCard key={item.id} item={item} tipo={tipo} />
                ))}
              </div>
            </section>
          )
        )}

        {!principal && secciones.every(s => s.items.length === 0) && (
          <p className="text-gray-400">No se encontraron resultados.</p>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
