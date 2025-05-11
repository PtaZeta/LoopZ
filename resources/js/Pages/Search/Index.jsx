import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const obtenerUrlImagenResultado = (item, tipo) => {
    if (!item) return null;

    if (tipo === 'user' && item.foto_perfil) {
        return item.foto_perfil.startsWith('http') ? item.foto_perfil : `/storage/${item.foto_perfil}`;
    }
    if (tipo === 'cancion' && item.foto_url) {
         return item.foto_url.startsWith('http') ? item.foto_url : `/storage/${item.foto_url}`;
    }
    if (['album', 'ep', 'single', 'playlist'].includes(tipo) && item.imagen) {
        return item.imagen.startsWith('http') ? item.imagen : `/storage/${item.imagen}`;
    }

    if (tipo === 'cancion' && item.album?.imagen) {
         return item.album.imagen.startsWith('http') ? item.album.imagen : `/storage/${item.album.imagen}`;
    }
    if (item.image_url) return item.image_url;


    return null;
};

const ResultItemCard = ({ item, tipo, href }) => {
    const imageUrl = obtenerUrlImagenResultado(item, tipo);
    const isCircular = tipo === 'user';

    const primaryText = item.titulo || item.name || 'Título desconocido';
    let secondaryText = '';
    if (tipo === 'cancion' && item.usuarios?.length > 0) {
        secondaryText = item.usuarios.map(u => u.name).join(', ');
    } else if (['album', 'ep', 'single'].includes(tipo) && item.artista) {
        secondaryText = item.artista;
    } else if (tipo === 'playlist' && item.user?.name) {
        secondaryText = `Por ${item.user.name}`;
    } else if (tipo === 'user') {
        secondaryText = 'Artista';
    }

    return (
        <Link
            href={href}
            className="flex flex-col items-center text-center bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200 group"
        >
            <div className={`relative ${isCircular ? 'w-24 h-24 rounded-full' : 'w-full h-36 rounded-md'} overflow-hidden mb-3`}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={primaryText}
                        className={`absolute inset-0 w-full h-full object-cover ${isCircular ? 'rounded-full' : 'rounded-md'}`}
                    />
                ) : (
                    <div className={`w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 ${isCircular ? 'rounded-full' : 'rounded-md'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-12 h-12 ${isCircular ? 'rounded-full' : 'rounded-md'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    )}
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            <p className="text-white text-sm font-semibold truncate w-full">{primaryText}</p>
            {secondaryText && <p className="text-gray-400 text-xs truncate w-full mt-1">{secondaryText}</p>}
        </Link>
    );
};

const playSong = (song) => {
    console.log(`Playing song: ${song.titulo}`);
    // Implement your actual music playback logic here.
};


export default function SearchIndex({ searchQuery, results }) {
    const { users, canciones, playlists, albumes, eps, singles } = results;

    const secciones = [
        { key: 'usuarios', label: 'Perfiles', items: users, tipo: 'user' },
        { key: 'canciones', label: 'Canciones', items: canciones, tipo: 'cancion' },
        { key: 'playlists', label: 'Listas', items: playlists, tipo: 'playlist' },
        { key: 'albumes', label: 'Álbumes', items: albumes, tipo: 'album' },
        { key: 'eps', label: 'Eps', items: eps, tipo: 'ep' },
        { key: 'singles', label: 'Singles', items: singles, tipo: 'single' },
    ];

    const principal =
        users?.[0] ||
        canciones?.[0] ||
        playlists?.[0] ||
        albumes?.[0] ||
        eps?.[0] ||
        singles?.[0];

    const principalTipo = users?.length
        ? 'user'
        : canciones?.length
        ? 'cancion'
        : playlists?.length
        ? 'playlist'
        : albumes?.length
        ? 'album'
        : eps?.length
        ? 'ep'
        : 'single';

    const filteredResults = {
        users: principalTipo === 'user' ? users.slice(1) : users,
        canciones: principalTipo === 'cancion' ? canciones.slice(1) : canciones,
        playlists: principalTipo === 'playlist' ? playlists.slice(1) : playlists,
        albumes: principalTipo === 'album' ? albumes.slice(1) : albumes,
        eps: principalTipo === 'ep' ? eps.slice(1) : eps,
        singles: principalTipo === 'single' ? singles.slice(1) : singles,
    };


    return (
        <AuthenticatedLayout>
            <Head title={`Resultados de "${searchQuery}"`} />

            <div className="container mx-auto px-4 py-6">
                <nav className="flex space-x-2 mb-8 overflow-x-auto pb-2">
                     <Link
                         href={route('search.index', { q: searchQuery })}
                         className="flex-shrink-0 px-4 py-2 rounded-full bg-white text-black text-sm font-semibold"
                     >
                         Todo
                     </Link>
                    {secciones.map(sec =>
                        sec.items?.length > 0 ? (
                            <Link
                                key={sec.key}
                                href={route('search.index', { q: searchQuery, filter: sec.key })}
                                className="flex-shrink-0 px-4 py-2 rounded-full bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600 transition-colors duration-200"
                            >
                                {sec.label}
                            </Link>
                        ) : null
                    )}
                </nav>

                {(principal || filteredResults.canciones.length > 0) && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                         {principal && (
                             <div className="md:col-span-1 bg-gray-800 rounded-lg p-6 flex flex-col items-center text-center md:flex-row md:text-left md:items-start shadow-lg">
                                {/* Wrap the clickable content in a Link */}
                                <Link
                                     href={
                                         principalTipo === 'user'
                                             ? route('profile.show', principal.id)
                                             : principalTipo === 'cancion' // Corrected route for song
                                                 ? route('canciones.show', principal.id)
                                                 : route(`${principalTipo}s.show`, principal.id)
                                     }
                                     className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start group w-full"
                                >
                                    <div className={`relative ${principalTipo === 'user' ? 'w-32 h-32 rounded-full' : 'w-32 h-32 rounded-lg'} overflow-hidden mb-4 md:mb-0 md:mr-6 shadow-md`}>
                                        {obtenerUrlImagenResultado(principal, principalTipo) ? (
                                            <img
                                                src={obtenerUrlImagenResultado(principal, principalTipo)}
                                                alt={principal.titulo || principal.name}
                                                className={`absolute inset-0 w-full h-full object-cover ${principalTipo === 'user' ? 'rounded-full' : 'rounded-lg'}`}
                                            />
                                        ) : (
                                            <div className={`w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 ${principalTipo === 'user' ? 'rounded-full' : 'rounded-lg'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-16 h-16 ${principalTipo === 'user' ? 'rounded-full' : 'rounded-lg'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-gray-400 uppercase text-xs font-semibold">{principalTipo === 'user' ? 'Perfil' : 'Resultado principal'}</p>
                                        <p className="text-white text-3xl font-bold mt-1">
                                            {principal.titulo || principal.name}
                                        </p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {principalTipo === 'cancion' &&
                                                principal.usuarios?.map(u => u.name).join(', ')}
                                            {principalTipo === 'playlist' && `Por ${principal.user?.name}`}
                                            {principalTipo === 'user' && 'Perfil de artista o usuario'}
                                            {(principalTipo === 'album' || principalTipo === 'ep' || principalTipo === 'single') && principal.artista}
                                        </p>
                                    </div>
                                </Link>
                                 {principalTipo === 'cancion' && (
                                     <button
                                         onClick={() => playSong(principal)}
                                         className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full text-sm font-bold hover:bg-green-400 transition-colors duration-200 shadow-md self-center md:self-start"
                                     >
                                         Reproducir
                                     </button>
                                  )}
                             </div>
                         )}

                         {filteredResults.canciones.length > 0 && (
                             <div className="md:col-span-2 bg-gray-800 rounded-lg p-6 shadow-lg">
                                 <h2 className="text-white text-xl font-semibold mb-4">Canciones</h2>
                                 <div>
                                     {filteredResults.canciones.map((cancion, index) => (
                                         <Link
                                             key={cancion.id}
                                             href={route('canciones.show', cancion.id)}
                                             className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-gray-700 transition-colors duration-200 group"
                                         >
                                             <div className="flex items-center">
                                                 <div className="w-12 h-12 overflow-hidden rounded mr-3 flex-shrink-0">
                                                      {obtenerUrlImagenResultado(cancion, 'cancion') ? (
                                                         <img
                                                             src={obtenerUrlImagenResultado(cancion, 'cancion')}
                                                             alt={cancion.titulo}
                                                             className="w-full h-full object-cover"
                                                         />
                                                      ) : (
                                                         <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400">
                                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19a2 2 0 001.859 1.954l3 1A2 2 0 0016 20v-3l-4.553-2.276A1 1 0 0010 14v-2.236A2 2 0 009 19zm-6 0a2 2 0 01-2-2V7a2 2 0 012-2h3m6 1v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1m4 10a2 2 0 01-2 2H9a2 2 0 01-2-2v-1a2 2 0 012-2h2a2 2 0 012 2v1zm-6 0a2 2 0 01-2-2V7h3v10h-.5a2 2 0 00-.5 2z" /></svg>
                                                         </div>
                                                      )}
                                                 </div>
                                                 <div className="flex-grow truncate">
                                                     <p className="text-white text-sm font-medium truncate">{cancion.titulo}</p>
                                                     <p className="text-gray-400 text-xs truncate mt-0.5">
                                                         {cancion.usuarios?.map(u => u.name).join(', ')}
                                                     </p>
                                                 </div>
                                             </div>
                                             {cancion.duracion && (
                                                 <p className="text-gray-400 text-sm ml-4 flex-shrink-0">
                                                     {Math.floor(cancion.duracion / 60)}:{(cancion.duracion % 60).toString().padStart(2, '0')}
                                                 </p>
                                             )}
                                         </Link>
                                     ))}
                                 </div>
                             </div>
                         )}
                      </div>
                )}

                {secciones.map(sec => {
                    if (principal && sec.key === principalTipo + 's' && sec.items?.[0]?.id === principal.id && sec.key !== 'canciones') {
                        return null;
                    }
                    if (principalTipo === 'cancion' && sec.key === 'canciones') {
                         return null;
                    }

                    const itemsToDisplay = (sec.key === principalTipo + 's') ? filteredResults[sec.key] : sec.items;

                    return itemsToDisplay?.length > 0 && (
                        <section key={sec.key} className="mb-8">
                            <h2 className="text-white text-xl font-semibold mb-4">{sec.label}</h2>
                            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                                {itemsToDisplay.map(item => (
                                    <div key={item.id} className="flex-shrink-0 w-40">
                                        <ResultItemCard
                                            item={item}
                                            tipo={sec.tipo}
                                            href={
                                                sec.key === 'usuarios'
                                                    ? route('profile.show', item.id)
                                                    : route(`${sec.key}.show`, item.id)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}

                 {principalTipo === 'user' && principal.items_including_user?.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-white text-xl font-semibold mb-4">{`Incluye a ${principal.name}`}</h2>
                         <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                            {principal.items_including_user.map(item => (
                                <div key={item.id} className="flex-shrink-0 w-40">
                                    <ResultItemCard
                                        item={item}
                                        tipo={item.type}
                                        href={route(`${item.type}s.show`, item.id)}
                                    />
                                </div>
                            ))}
                         </div>
                    </section>
                 )}
            </div>
        </AuthenticatedLayout>
    );
}
