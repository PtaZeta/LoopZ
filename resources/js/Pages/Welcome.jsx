import { Head, Link } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';

const PlayIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>;
const PauseIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>;
const MusicNoteIcon = () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path></svg>;


export default function Welcome({ auth, cancionesAleatorias }) {

    const [urlCancionActual, setUrlCancionActual] = useState(null);
    const [idCancionSonando, setIdCancionSonando] = useState(null);
    const referenciaAudio = useRef(null);

    useEffect(() => {
        const elementoAudio = referenciaAudio.current;
        if (urlCancionActual && elementoAudio) {
            elementoAudio.src = urlCancionActual;
            elementoAudio.play().catch(error => {
                console.error("Error al intentar reproducir:", error);
                setIdCancionSonando(null);
                setUrlCancionActual(null);
            });
            elementoAudio.onended = () => {
                setIdCancionSonando(null);
                setUrlCancionActual(null);
            }
        } else if (elementoAudio) {
            elementoAudio.pause();
            elementoAudio.onended = null;
        }
        return () => {
            if (elementoAudio) {
                elementoAudio.onended = null;
            }
        }
    }, [urlCancionActual]);

    const manejarReproducirPausa = (cancion) => {
        if (idCancionSonando === cancion.id) {
            referenciaAudio.current?.pause();
            setIdCancionSonando(null);
            setUrlCancionActual(null);
        } else {
            if (cancion.archivo_url) {
                setUrlCancionActual(cancion.archivo_url);
                setIdCancionSonando(cancion.id);
            } else {
                console.warn('La canción no tiene URL de archivo:', cancion.titulo);
            }
        }
    };

    const Layout = auth.user ? AuthenticatedLayout : GuestLayout;

    return (
        <Layout>
            <Head title="Bienvenido - Música al Azar" />


                <main className='pt-0'>
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
                    <h2 className="text-3xl font-bold mb-8 text-center text-white">Descubre al Azar</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {cancionesAleatorias && cancionesAleatorias.length > 0 ? (
                            cancionesAleatorias.map((cancion) => {
                                const estaSonandoActual = idCancionSonando === cancion.id;
                                return (
                                    <div key={cancion.id} className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden group transition-all transform hover:-translate-y-1 hover:shadow-xl ${estaSonandoActual ? 'ring-2 ring-blue-500' : ''}`}>
                                        <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-500">
                                            {cancion.foto_url ? (
                                                <img src={cancion.foto_url} alt={cancion.titulo} className="w-full h-full object-cover" />
                                            ) : (
                                                <MusicNoteIcon />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors truncate">{cancion.titulo}</h3>
                                            {cancion.generos && cancion.generos.length > 0 ? (
                                                <p className="text-sm text-gray-400 mb-3 truncate">
                                                    Género/s: {cancion.generos.map(g => g.nombre).join(', ') }

                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500 mb-3 italic">Sin género</p>
                                            )}
                                            <button
                                                onClick={() => manejarReproducirPausa(cancion)}
                                                className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${estaSonandoActual ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100'}`}
                                                disabled={!cancion.archivo_url}
                                            >
                                                {estaSonandoActual ? <PauseIcon /> : <PlayIcon />}
                                                <span className="ml-2">{estaSonandoActual ? 'Pausar' : 'Reproducir'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center col-span-full text-gray-500">No se encontraron canciones.</p>
                        )}
                    </div>
                </section>

                    <section id="genres" className="container mx-auto px-6 py-16">
                        <h2 className="text-3xl font-bold mb-8 text-center text-white">Explora por Género</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {['Pop', 'Rock', 'Electrónica', 'Hip Hop', 'Techno', 'House', 'Dance', 'Indie', 'Synthwave', 'EDM'].map(genero => (
                                <Link key={genero} href={`/genres/${genero.toLowerCase()}`}
                                    className="block p-6 rounded-lg text-center font-semibold text-white bg-gradient-to-br from-gray-700 to-gray-800 hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-md"
                                >
                                    {genero}
                                </Link>
                            ))}
                        </div>
                    </section>
                </main>

                <audio ref={referenciaAudio} className="hidden" />

        </Layout>
    );
}
