import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';

const ProfileImage = ({ src, alt, placeholderClass, imageClass }) => {
    const imageUrl = src ? `/storage/${src}?t=${Date.now()}` : null;
    const uniqueKey = src ? `img-${src}` : 'placeholder';

    return (
        <>
            {imageUrl ? (
                <img key={uniqueKey} src={imageUrl} alt={alt} className={imageClass} />
            ) : (
                <div key={uniqueKey} className={placeholderClass}>

                </div>
            )}
        </>
    );
};

const SongImage = ({ src, alt, placeholderClass, imageClass }) => {
    const imageUrl = src ? `${src}?t=${Date.now()}` : null;
    const uniqueKey = src ? `song-img-${src}` : 'song-placeholder';

    return (
        <>
            {imageUrl ? (
                <img key={uniqueKey} src={imageUrl} alt={alt} className={imageClass} />
            ) : (
                <div key={uniqueKey} className={placeholderClass}>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"></path></svg>
                </div>
            )}
        </>
    );
};


export default function Index() {
    const { auth, cancionesUsuario, playlistsUsuario } = usePage().props;
    const user = auth.user;

    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        const initials = names.map(n => n.charAt(0)).join('');
        return initials.toUpperCase().slice(0, 2);
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                           Profile
                      </h2>
                      <Link
                           href={route('profile.edit')}
                           className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                      >
                            Edit Profile
                      </Link>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    <div className="relative mb-16 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <div className="relative">
                            <ProfileImage
                                src={user.banner_perfil}
                                alt="Profile banner"
                                imageClass="w-full h-48 sm:h-64 object-cover rounded-t-lg"
                                placeholderClass="w-full h-48 sm:h-64 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center text-gray-200"
                            />
                             {!user.banner_perfil && (
                                 <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-100 pointer-events-none">
                                      No banner set
                                 </span>
                             )}
                        </div>

                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                             <div className="relative">
                                <ProfileImage
                                    src={user.foto_perfil}
                                    alt={`${user.name}'s profile picture`}
                                    imageClass="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-white dark:bg-gray-700"
                                    placeholderClass="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg"
                                />
                                {!user.foto_perfil && (
                                     <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-semibold pointer-events-none rounded-full">
                                          {getInitials(user.name)}
                                     </div>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg mt-8 sm:mt-16">
                        <div className="max-w-xl mx-auto text-center sm:text-left">
                             <div className="pt-12 sm:pt-16"></div>

                             <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                   {user.name}
                             </h3>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                   {user.email}
                             </p>

                        </div>
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            My Songs
                        </h3>
                        {cancionesUsuario && cancionesUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {cancionesUsuario.map((cancion) => (
                                    <li key={cancion.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <SongImage
                                                 src={cancion.foto_url}
                                                 alt={`${cancion.titulo} cover`}
                                                 imageClass="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 placeholderClass="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
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
                                You haven't added any songs yet.
                            </p>
                        )}
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            My Playlists
                        </h3>
                        {playlistsUsuario && playlistsUsuario.length > 0 ? (
                            <ul className="space-y-4">
                                {playlistsUsuario.map((playlist) => (
                                    <li key={playlist.id} className="flex items-center space-x-4 p-3 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <div className="flex-shrink-0">
                                             <ProfileImage
                                                 src={playlist.imagen}
                                                 alt={`${playlist.nombre} cover`}
                                                 imageClass="w-12 h-12 rounded object-cover bg-gray-200 dark:bg-gray-600"
                                                 placeholderClass="w-12 h-12 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
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
                                You haven't added any playlists yet.
                            </p>
                        )}
                    </div>


                </div>
            </div>
        </AuthenticatedLayout>
    );
}
