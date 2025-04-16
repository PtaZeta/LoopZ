import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

const obtenerUrlImagen = (lista) => {
    if (lista.image_url) { return lista.image_url; }
    if (lista.imagen) { return `/storage/${lista.imagen}`; }
    return null;
};

const ImagenCancion = ({ url, titulo, className = "w-10 h-10" }) => {
    const placeholder = (
        <div className={`${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
        </div>
    );

    const manejarErrorImagen = (e) => {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = `${className} bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded`;
        placeholderDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>`;
        if(e.target.parentNode) {
            e.target.parentNode.replaceChild(placeholderDiv, e.target);
        }
    };

    return url ? (
        <img
            src={url}
            alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy"
            onError={manejarErrorImagen}
        />
    ) : (
        placeholder
    );
};

ImagenCancion.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
};


export default function PlaylistShow({ auth, playlist: listaReproduccionInicial }) {

    const { flash: mensajeFlash } = usePage().props;

    const [listaReproduccion, setListaReproduccion] = useState(listaReproduccionInicial);
    const urlImagenPlaylist = obtenerUrlImagen(listaReproduccion);

    const [consultaBusqueda, setConsultaBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [anadiendoCancionId, setAnadiendoCancionId] = useState(null);
    const minQueryLength = 2;


    const buscarCancionesApi = async (consulta) => {
        setEstaBuscando(true);
        try {
            const respuesta = await fetch(route('songs.search', { query: consulta }));
            if (!respuesta.ok) {
                throw new Error('La respuesta de red no fue correcta');
            }
            const datos = await respuesta.json();
            setResultadosBusqueda(Array.isArray(datos) ? datos : []);
        } catch (error) {
            console.error("Error al obtener canciones:", error);
            setResultadosBusqueda([]);
        } finally {
            setEstaBuscando(false);
        }
    };

    const busquedaDebounced = useCallback(debounce(buscarCancionesApi, 300), []);

    const manejarCambioInputBusqueda = (e) => {
        const consulta = e.target.value;
        setConsultaBusqueda(consulta);
        busquedaDebounced(consulta);
    };

    const manejarAnadirCancion = (idCancion) => {
        setAnadiendoCancionId(idCancion);
        router.post(route('playlists.songs.add', listaReproduccion.id), {
            cancion_id: idCancion,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setAnadiendoCancionId(null);
                 // buscarCancionesApi('');
            },
            onError: (errores) => {
                console.error("Error al añadir canción:", errores);
                let mensajeAlerta = 'Error al añadir la canción. Revisa la consola.';
                if (errores && errores.cancion_id) {
                    mensajeAlerta = `Error: ${errores.cancion_id}`;
                } else if (errores && Object.values(errores).length > 0) {
                     mensajeAlerta = `Error: ${Object.values(errores)[0]}`;
                }
                alert(mensajeAlerta);
            },
        });
    };

    useEffect(() => {
        buscarCancionesApi('');
    }, []);

    useEffect(() => {
        if (listaReproduccionInicial && !Array.isArray(listaReproduccionInicial.canciones)) {
            listaReproduccionInicial.canciones = [];
        }
        setListaReproduccion(listaReproduccionInicial);
    }, [listaReproduccionInicial]);


    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Detalles de: {listaReproduccion.nombre}
                </h2>
            }
        >
            <Head title={`Playlist: ${listaReproduccion.nombre}`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">

                     {mensajeFlash && mensajeFlash.success && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeFlash.success}
                        </div>
                     )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">

                             <div className="mb-6">
                                 <Link href={route('playlists.index')} className="text-blue-600 dark:text-blue-400 hover:underline">
                                     &larr; Volver a Mis Playlists
                                 </Link>
                             </div>
                             {urlImagenPlaylist && ( <div className="mb-6 flex justify-center"> <img src={urlImagenPlaylist} alt={`Portada de ${listaReproduccion.nombre}`} className="max-w-sm w-full h-auto rounded-lg shadow-md object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> </div> )}
                             {!urlImagenPlaylist && ( <div className="mb-6 text-center text-gray-500 dark:text-gray-400">(Sin imagen)</div> )}
                             <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">{listaReproduccion.nombre}</h1>
                             <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-6 text-center"><p>{listaReproduccion.descripcion}</p></div>
                             {(listaReproduccion.created_at || listaReproduccion.updated_at) && (
                                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-t dark:border-gray-700 pt-4 text-center">
                                     {listaReproduccion.created_at && <p>Creada el: {new Date(listaReproduccion.created_at).toLocaleString()}</p>}
                                     {listaReproduccion.updated_at && listaReproduccion.updated_at !== listaReproduccion.created_at && <p>Última actualización: {new Date(listaReproduccion.updated_at).toLocaleString()}</p>}
                                 </div>
                             )}


                            <div className="mb-10">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Canciones en esta Playlist</h3>
                                {listaReproduccion.canciones && Array.isArray(listaReproduccion.canciones) && listaReproduccion.canciones.length > 0 ? (
                                    <ul className="space-y-2">
                                        {listaReproduccion.canciones.map((cancion) => (
                                            <li key={cancion.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center space-x-3">
                                                <ImagenCancion url={cancion.foto_url} titulo={cancion.titulo} className="w-10 h-10" />
                                                <span className="text-gray-800 dark:text-gray-200 flex-grow truncate">{cancion.titulo}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 italic">Esta playlist aún no tiene canciones.</p>
                                )}
                            </div>

                            <div className="mt-10 border-t dark:border-gray-700 pt-6">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Añadir Canciones</h3>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Buscar canciones por título..."
                                        value={consultaBusqueda}
                                        onChange={manejarCambioInputBusqueda}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200"
                                    />
                                </div>

                                {estaBuscando && <p className="text-gray-500 dark:text-gray-400 italic">Buscando...</p>}

                                {!estaBuscando && resultadosBusqueda.length > 0 && (
                                    <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2 space-y-2 bg-gray-50 dark:bg-gray-700/50">
                                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                            {consultaBusqueda.length >= minQueryLength ? 'Resultados:' : 'Canciones Disponibles:'}
                                        </h4>
                                        <ul>
                                            {resultadosBusqueda.map((cancionEncontrada) => (
                                                <li key={cancionEncontrada.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded space-x-3">
                                                    <div className="flex items-center space-x-3 flex-grow overflow-hidden">
                                                        <ImagenCancion url={cancionEncontrada.foto_url} titulo={cancionEncontrada.titulo} className="w-10 h-10" />
                                                        <span className="text-gray-800 dark:text-gray-200 truncate">{cancionEncontrada.titulo}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => manejarAnadirCancion(cancionEncontrada.id)}
                                                        disabled={anadiendoCancionId === cancionEncontrada.id || listaReproduccion.canciones?.some(c => c.id === cancionEncontrada.id)}
                                                        className={`ml-2 px-3 py-1 text-xs font-semibold rounded-md transition ease-in-out duration-150 flex-shrink-0 ${
                                                            listaReproduccion.canciones?.some(c => c.id === cancionEncontrada.id)
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                                                : anadiendoCancionId === cancionEncontrada.id
                                                                    ? 'bg-indigo-300 text-white cursor-wait dark:bg-indigo-700'
                                                                    : 'bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                                                        }`}
                                                    >
                                                        {listaReproduccion.canciones?.some(c => c.id === cancionEncontrada.id) ? 'Añadida' : (anadiendoCancionId === cancionEncontrada.id ? 'Añadiendo...' : 'Añadir')}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {!estaBuscando && consultaBusqueda.length >= minQueryLength && resultadosBusqueda.length === 0 && (
                                     <p className="text-gray-500 dark:text-gray-400 italic">No se encontraron canciones que coincidan.</p>
                                )}

                                 {!estaBuscando && consultaBusqueda.length < minQueryLength && resultadosBusqueda.length === 0 && (
                                     <p className="text-gray-500 dark:text-gray-400 italic">No hay canciones disponibles para añadir.</p>
                                )}
                            </div>

                             <div className="mt-8 flex justify-center space-x-3">
                                 <Link href={route('playlists.edit', listaReproduccion.id)} className="inline-flex items-center px-4 py-2 bg-yellow-500 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:border-yellow-700 focus:ring ring-yellow-300 disabled:opacity-25 transition ease-in-out duration-150">
                                     Editar Playlist
                                 </Link>
                             </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

PlaylistShow.propTypes = {
    auth: PropTypes.object.isRequired,
    playlist: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string.isRequired,
        imagen: PropTypes.string,
        image_url: PropTypes.string,
        created_at: PropTypes.string,
        updated_at: PropTypes.string,
        canciones: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            titulo: PropTypes.string.isRequired,
            foto_url: PropTypes.string, // Espera foto_url
        })),
    }).isRequired,
};
