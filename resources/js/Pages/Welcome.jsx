import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useContext } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import { PlayerContext } from '@/contexts/PlayerContext';
import { PauseIcon, PlayIcon, MusicalNoteIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { ArrowPathIcon as LoadingIcon } from '@heroicons/react/20/solid';


export default function Welcome({ auth, generos }) {
    const [mostrarTodosGeneros, setMostrarTodosGeneros] = useState(false);
    const [cancionesAleatorias, setCancionesAleatorias] = useState([]);
    const Layout = auth.user ? AuthenticatedLayout : GuestLayout;

    const {
        cancionActual,
        Reproduciendo,
        cargarColaYIniciar,
        play,
        pause
    } = useContext(PlayerContext);

    const [likeProcessing, setLikeProcessing] = useState({});

    const recargarCancionesAleatorias = () => {
        fetch('/api/welcome-random')
            .then(res => {
                 if (!res.ok) {
                      throw new Error(`HTTP error! status: ${res.status}`);
                 }
                 return res.json();
             })
            .then(data => {
                 const cancionesConLoopz = data.map(cancion => ({
                      ...cancion,
                      is_in_user_loopz: cancion.is_in_user_loopz ?? false,
                 }));
                 setCancionesAleatorias(cancionesConLoopz);
            })
            .catch(err => console.error("Error al recargar canciones:", err));
    };

    const manejarCancionLoopzToggle = (cancion) => {
        if (likeProcessing[cancion.id] || !auth.user) {
             return;
        }

        setCancionesAleatorias(prevCanciones =>
             prevCanciones.map(c =>
                 c.id === cancion.id ? { ...c, is_in_user_loopz: !c.is_in_user_loopz } : c
             )
        );

        setLikeProcessing(prev => ({ ...prev, [cancion.id]: true }));

        router.post(route('cancion.loopz', { cancion: cancion.id }), {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
            },
            onError: () => {
                 setCancionesAleatorias(prevCanciones =>
                     prevCanciones.map(c =>
                         c.id === cancion.id ? { ...c, is_in_user_loopz: !c.is_in_user_loopz } : c
                     )
                );
                console.error(`Error al alternar LoopZ para la canción ${cancion.id}`);
            },
            onFinish: () => {
                setLikeProcessing(prev => {
                    const newState = { ...prev };
                    delete newState[cancion.id];
                    return newState;
                });
            },
        });
    };


    useEffect(() => {
        recargarCancionesAleatorias();
    }, []);

    const manejarReproducirPausa = (cancion) => {
        const mismaCancion = cancionActual?.id === cancion.id;

        if (mismaCancion) {
            if (Reproduciendo) {
                pause();
            } else {
                play();
            }
        } else {
            cargarColaYIniciar([cancion], { clickDirecto: true });
        }
    };

    const estaSonandoCancion = (cancion) => cancionActual?.id === cancion.id && Reproduciendo;
    const estaProcesandoLoopz = (cancionId) => likeProcessing[cancionId];


    return (
        <Layout>
            <Head title="Bienvenido" />

            <main className='pt-20'>
                <section className="container mx-auto px-6 py-20 md:py-28 text-center flex flex-col items-center relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 opacity-10">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-900 rounded-full filter blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-900 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white relative z-10">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500">LoopZ:</span> El like que suena
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl relative z-10">
                        Sumérgete en un universo de sonidos. Descubre, reproduce y conecta con la música que moverá tu mundo. Tu próxima obsesión está a un play de distancia.
                    </p>
                    <Link
                        href={auth.user ? route('biblioteca') : route('login')}
                        className="relative z-10 px-10 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-300 ease-in-out"
                    >
                        Ir a Mi Biblioteca
                    </Link>
                </section>

                <section id="explore" className="container mx-auto px-6 py-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-white">Descubre al Azar</h2>
                        <button
                            onClick={recargarCancionesAleatorias}
                            className="flex items-center gap-2 text-sm px-4 py-2 rounded-md bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white font-medium transition-all shadow-md"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                            Recargar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {cancionesAleatorias && cancionesAleatorias.length > 0 ? (
                            cancionesAleatorias.map((cancion) => {
                                const estaSonando = estaSonandoCancion(cancion);
                                const procesandoLoopz = estaProcesandoLoopz(cancion.id);

                                return (
                                    <div key={cancion.id} className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl ${estaSonando ? 'ring-2 ring-blue-500' : ''}`}>
                                        <Link href={route('canciones.show', { cancione: cancion.id })} className="block w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500 hover:opacity-90 transition-opacity">
                                            {cancion.foto_url ? (
                                                <img src={cancion.foto_url} alt={cancion.titulo} className="w-full h-full object-cover" />
                                            ) : (
                                                <MusicalNoteIcon className="w-10 h-10" />
                                            )}
                                        </Link>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
                                                <Link href={route('canciones.show', { cancione: cancion.id })} className="hover:underline">
                                                    {cancion.titulo}
                                                </Link>
                                            </h3>
                                            {cancion.generos && cancion.generos.length > 0 ? (
                                                <p className="text-sm text-gray-400 mb-3 truncate">
                                                    Género/s: {cancion.generos.map(g => g.nombre).join(', ')}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 mb-3 italic">Sin género</p>
                                            )}
                                            <div className="flex items-center justify-between mt-4">
                                                <button
                                                    onClick={() => manejarReproducirPausa(cancion)}
                                                    className={`flex-grow flex items-center justify-center px-4 py-2 rounded-md text-white text-sm font-medium transition-colors mr-2 ${estaSonando ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                    disabled={!cancion.archivo_url}
                                                >
                                                    {estaSonando ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                                    <span className="ml-2">{estaSonando ? 'Pausar' : 'Reproducir'}</span>
                                                </button>
                                                <button
                                                    onClick={() => manejarCancionLoopzToggle(cancion)}
                                                    disabled={procesandoLoopz || !auth.user}
                                                    className={`p-2 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${procesandoLoopz || !auth.user ?
                                                        'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-purple-400'
                                                    }`}
                                                    title={cancion.is_in_user_loopz ? "Quitar de LoopZ" : "Añadir a LoopZ"}
                                                >
                                                    {procesandoLoopz ? (
                                                        <LoadingIcon className="h-5 w-5 animate-spin text-purple-400"/>
                                                    ) : (
                                                        cancion.is_in_user_loopz ? (
                                                            <HeartIconSolid className="h-5 w-5 text-purple-500" />
                                                        ) : (
                                                            <HeartIconOutline className="h-5 w-5" />
                                                        )
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center col-span-full text-gray-500">No se encontraron canciones.</p>
                        )}
                    </div>
                </section>

                <section id="genres" className="container mx-auto px-6 py-16 relative">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-white inline-block">Explora por Género</h2>

                        {generos.length > 8 && (
                            <button onClick={() => setMostrarTodosGeneros(!mostrarTodosGeneros)} className="text-white hover:text-gray-300 ml-4">
                                {mostrarTodosGeneros ? 'Mostrar menos' : 'Mostrar todos'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {generos.slice(0, mostrarTodosGeneros ? generos.length : 10).map(genero => (
                            <Link key={genero.id} href={`/genero/${genero.id}`} className="block p-6 rounded-lg text-center font-semibold text-white bg-gradient-to-br from-gray-700 to-gray-800 hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md">
                                {genero.nombre}
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </Layout>
    );
}
