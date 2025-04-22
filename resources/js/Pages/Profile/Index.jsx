import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';

const ImagenPerfil = ({ src, alt, clasePlaceholder, claseImagen }) => {
    const urlImagen = src ? `/storage/${src}?t=${Date.now()}` : null;
    const claveUnica = src ? `img-${src}` : 'placeholder';

    return (
        <>
            {urlImagen ? (
                <img key={claveUnica} src={urlImagen} alt={alt} className={claseImagen} />
            ) : (
                <div key={claveUnica} className={clasePlaceholder}></div>
            )}
        </>
    );
};

const ImagenCancion = ({ src, alt, clasePlaceholder, claseImagen }) => {
    const urlImagen = src ? `${src}?t=${Date.now()}` : null;
    const claveUnica = src ? `song-img-${src}` : 'song-placeholder';

    return (
        <>
            {urlImagen ? (
                <img key={claveUnica} src={urlImagen} alt={alt} className={claseImagen} />
            ) : (
                <div key={claveUnica} className={clasePlaceholder}>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"></path></svg>
                </div>
            )}
        </>
    );
};

export default function Index() {
    const { auth, cancionesUsuario, playlistsUsuario, albumesUsuario, epsUsuario, singlesUsuario } = usePage().props;
    const usuario = auth.user;

    const obtenerIniciales = (nombre) => {
        if (!nombre) return '';
        const nombres = nombre.split(' ');
        const iniciales = nombres.map(n => n.charAt(0)).join('');
        return iniciales.toUpperCase().slice(0, 2);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                           Perfil
                      </h2>
                      <Link
                           href={route('profile.edit')}
                           className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                      >
                            Editar Perfil
                      </Link>
                </div>
            }
        >
            <Head title="Perfil" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    <div className="relative mb-16 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <div className="relative">
                            <ImagenPerfil
                                src={usuario.banner_perfil}
                                alt="Banner del perfil"
                                claseImagen="w-full h-48 sm:h-64 object-cover rounded-t-lg"
                                clasePlaceholder="w-full h-48 sm:h-64 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center text-gray-200"
                            />
                             {!usuario.banner_perfil && (
                                 <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-100 pointer-events-none">
                                      Sin banner
                                 </span>
                             )}
                        </div>

                        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                             <div className="relative">
                                <ImagenPerfil
                                    src={usuario.foto_perfil}
                                    alt={`Foto de perfil de ${usuario.name}`}
                                    claseImagen="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-white dark:bg-gray-700"
                                    clasePlaceholder="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg"
                                />

                                {!usuario.foto_perfil && (
                                     <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-semibold pointer-events-none rounded-full">
                                          {obtenerIniciales(usuario.name)}
                                     </div>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg mt-8 sm:mt-16">
                        <div className="max-w-xl mx-auto text-center sm:text-left">
                             <div className="pt-12 sm:pt-16"></div>

                             <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                   {usuario.name}
                             </h3>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                   {usuario.email}
                             </p>
                             <div className="mt-4">
                                <Link
                                    href={route('profile.edit')}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-400 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-900 uppercase tracking-widest hover:bg-indigo-500 dark:hover:bg-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                >
                                    Editar Perfil
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Mis Canciones
                        </h3>
                        {cancionesUsuario && cancionesUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {cancionesUsuario.map((cancion) => (
                                    <li key={cancion.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <ImagenCancion
                                                 src={cancion.foto_url}
                                                 alt={`Portada de ${cancion.titulo}`}
                                                 claseImagen="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 clasePlaceholder="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                                             />
                                        </div>
                                        <div className="flex-grow">
                                            {route().has('canciones.show') ? (
                                                <Link
                                                    href={route('canciones.show', cancion.id)}
                                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {cancion.titulo}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {cancion.titulo}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aún no has agregado canciones.
                            </p>
                        )}
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Mis Playlists
                        </h3>
                        {playlistsUsuario && playlistsUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {playlistsUsuario.map((playlist) => (
                                    <li key={playlist.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <ImagenPerfil
                                                 src={playlist.imagen}
                                                 alt={`${playlist.nombre} cover`}
                                                 claseImagen="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 clasePlaceholder="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                                             />
                                        </div>
                                        <div className="flex-grow">
                                            {route().has('playlists.show') ? (
                                                <Link
                                                    href={route('playlists.show', playlist.id)}
                                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {playlist.nombre}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {playlist.nombre}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aún no has agregado playlists.
                            </p>
                        )}
                    </div>
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Mis Álbumes
                        </h3>
                        {albumesUsuario && albumesUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {albumesUsuario.map((album) => (
                                    <li key={album.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <ImagenPerfil
                                                 src={album.imagen}
                                                 alt={`${album.nombre} cover`}
                                                 claseImagen="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 clasePlaceholder="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                                             />
                                        </div>
                                        <div className="flex-grow">
                                            {route().has('albumes.show') ? (
                                                <Link
                                                    href={route('albumes.show', album.id)}
                                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {album.nombre}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {album.nombre}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aún no has agregado álbumes.
                            </p>
                        )}
                    </div>
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Mis Extended Plays
                        </h3>
                        {epsUsuario && epsUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {epsUsuario.map((ep) => (
                                    <li key={ep.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <ImagenPerfil
                                                 src={ep.imagen}
                                                 alt={`${ep.nombre} cover`}
                                                 claseImagen="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 clasePlaceholder="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                                             />
                                        </div>
                                        <div className="flex-grow">
                                            {route().has('eps.show') ? (
                                                <Link
                                                    href={route('eps.show', ep.id)}
                                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {ep.nombre}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {ep.nombre}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aún no has agregado extended plays.
                            </p>
                        )}
                    </div>
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Mis Singles
                        </h3>
                        {singlesUsuario && singlesUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {singlesUsuario.map((single) => (
                                    <li key={single.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <ImagenPerfil
                                                 src={single.imagen}
                                                 alt={`${single.nombre} cover`}
                                                 claseImagen="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 clasePlaceholder="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
                                             />
                                        </div>
                                        <div className="flex-grow">
                                            {route().has('singles.show') ? (
                                                <Link
                                                    href={route('singles.show', single.id)}
                                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {single.nombre}
                                                </Link>
                                            ) : (
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {single.nombre}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aún no has agregado singles.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
