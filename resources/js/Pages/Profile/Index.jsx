import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';

const ImagenConPlaceholder = ({ src, alt, claseImagen, clasePlaceholder, tipo = 'perfil', nombre = '', esStorage = false }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const baseUrl = esStorage ? '/storage/' : '';
    const urlImagenCompleta = src ? `${baseUrl}${src}?t=${new Date().getTime()}` : null;

    const handleImageError = () => {
        setErrorCarga(true);
    };

    const obtenerIniciales = (nombre) => {
        if (!nombre) return '';
        const nombres = nombre.split(' ');
        const iniciales = nombres.map(n => n.charAt(0)).join('');
        return iniciales.toUpperCase().slice(0, 2);
    };

    const PlaceholderContenido = () => {
        if (tipo === 'perfil' && !esStorage && !src) {
             return (
                 <span className="text-white text-4xl font-semibold pointer-events-none">
                     {obtenerIniciales(nombre)}
                 </span>
             );
        } else if (tipo === 'cancion') {
            return (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"></path></svg>
            );
        } else if (tipo === 'banner' && !src) {
             return (
                 <span className="text-sm text-gray-300 pointer-events-none">
                     Sin banner
                 </span>
             );
        }
        return null;
    };

    const claveUnica = urlImagenCompleta || `placeholder-${tipo}-${alt}`;

    return (
        <>
            {urlImagenCompleta && !errorCarga ? (
                <img
                    key={claveUnica}
                    src={urlImagenCompleta}
                    alt={alt}
                    className={claseImagen}
                    onError={handleImageError}
                    loading="lazy"
                />
            ) : (
                <div key={claveUnica} className={`${clasePlaceholder} flex items-center justify-center overflow-hidden`}>
                   <PlaceholderContenido />
                </div>
            )}
        </>
    );
};

const SeccionListaItems = ({ tituloSeccion, items, tipoItem, nombreRuta }) => {
    const rutaExiste = route().has(nombreRuta);

    return (
        <div className="p-4 sm:p-8 bg-gray-800 shadow sm:rounded-lg">
            <h3 className="text-lg font-medium text-gray-100 mb-4">
                {tituloSeccion}
            </h3>
            {items && items.length > 0 ? (
                <ul className="space-y-4">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-center space-x-4 p-3 border border-gray-700 rounded-md hover:bg-gray-700 transition duration-150 ease-in-out">
                            <div className="flex-shrink-0">
                                <ImagenConPlaceholder
                                    src={tipoItem === 'cancion' ? item.foto_url : item.imagen}
                                    alt={`Portada de ${tipoItem === 'cancion' ? item.titulo : item.nombre}`}
                                    claseImagen="w-12 h-12 rounded object-cover bg-gray-600"
                                    clasePlaceholder="w-12 h-12 rounded bg-gray-600"
                                    tipo={tipoItem}
                                    esStorage={false}
                                />
                            </div>
                            <div className="flex-grow">
                                {rutaExiste ? (
                                    <Link
                                        href={route(nombreRuta, item.id)}
                                        className="text-sm font-semibold text-indigo-400 hover:underline"
                                    >
                                        {tipoItem === 'cancion' ? item.titulo : item.nombre}
                                    </Link>
                                ) : (
                                    <span className="text-sm font-semibold text-gray-200">
                                        {tipoItem === 'cancion' ? item.titulo : item.nombre}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-400">
                    Aún no has agregado {tipoItem}s.
                </p>
            )}
        </div>
    );
};


export default function Index() {
    const { auth, cancionesUsuario, playlistsUsuario, albumesUsuario, epsUsuario, singlesUsuario } = usePage().props;
    const usuario = auth.user;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold leading-tight text-gray-200">
                            Perfil
                        </h2>
                        {/* Botón Editar Perfil en la cabecera (ya existía) */}
                        <Link
                            href={route('profile.edit')}
                            className="inline-flex items-center px-4 py-2 bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-gray-800 uppercase tracking-widest hover:bg-white focus:bg-white active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150"
                        >
                            Editar Perfil
                        </Link>
                </div>
            }
        >
            <Head title="Perfil" />

            <div className="py-12 bg-gray-900">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    <div className="relative mb-16">
                        <div className="bg-gray-800 shadow sm:rounded-lg overflow-hidden">
                            <div className="relative">
                                <ImagenConPlaceholder
                                    src={usuario.banner_perfil}
                                    alt="Banner del perfil"
                                    claseImagen="w-full h-48 sm:h-64 object-cover"
                                    clasePlaceholder="w-full h-48 sm:h-64 bg-gray-700"
                                    tipo="banner"
                                    esStorage={true}
                                />
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                             <ImagenConPlaceholder
                                 src={usuario.foto_perfil}
                                 alt={`Foto de perfil de ${usuario.name}`}
                                 claseImagen="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 object-cover shadow-lg bg-gray-700"
                                 clasePlaceholder="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 bg-gray-600 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg"
                                 tipo="perfil"
                                 nombre={usuario.name}
                                 esStorage={true}
                             />
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 bg-gray-800 shadow sm:rounded-lg mt-8 sm:mt-16">
                        <div className="max-w-xl mx-auto text-center">
                            <div className="pt-12 sm:pt-16"></div>

                            <h3 className="text-2xl font-semibold text-gray-100 mb-1">
                                {usuario.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {usuario.email}
                            </p>
                            {/* Botón Editar Perfil añadido aquí */}
                            <div className="mt-4">
                                <Link
                                    href={route('profile.edit')}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-600 focus:bg-indigo-600 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                >
                                    Editar Perfil
                                </Link>
                            </div>
                        </div>
                    </div>

                    <SeccionListaItems
                        tituloSeccion="Mis Canciones"
                        items={cancionesUsuario}
                        tipoItem="cancion"
                        nombreRuta="canciones.show"
                    />
                    <SeccionListaItems
                        tituloSeccion="Mis Playlists"
                        items={playlistsUsuario}
                        tipoItem="playlist"
                        nombreRuta="playlists.show"
                    />
                     <SeccionListaItems
                        tituloSeccion="Mis Álbumes"
                        items={albumesUsuario}
                        tipoItem="album"
                        nombreRuta="albumes.show"
                    />
                     <SeccionListaItems
                        tituloSeccion="Mis Extended Plays"
                        items={epsUsuario}
                        tipoItem="ep"
                        nombreRuta="eps.show"
                    />
                    <SeccionListaItems
                        tituloSeccion="Mis Singles"
                        items={singlesUsuario}
                        tipoItem="single"
                        nombreRuta="singles.show"
                    />

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
