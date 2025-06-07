import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Guest() {
    const imagenesFondo = [
        '/imagenes/fondo_guest_1.jpg',
        '/imagenes/fondo_guest_2.jpg',
        '/imagenes/fondo_guest_3.jpg',
        '/imagenes/fondo_guest_4.jpg',
    ];

    const [indiceImagenActual, setIndiceImagenActual] = useState(() => {
        const valorInicial = Math.floor(Math.random() * imagenesFondo.length);
        return valorInicial;
    });
    const [opacidadImagen, setOpacidadImagen] = useState(1);
    const [indiceSiguienteImagen, setIndiceSiguienteImagen] = useState(0);

    useEffect(() => {
        imagenesFondo.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        setIndiceSiguienteImagen((indiceImagenActual + 1) % imagenesFondo.length);

        const duracionTransicion = 2000;
        const duracionVisualizacion = 13000;
        const duracionTotalCiclo = duracionVisualizacion + duracionTransicion;

        const intervalo = setInterval(() => {
            setOpacidadImagen(0);

            setTimeout(() => {
                setIndiceImagenActual(anteriorIndex => {
                    const nuevoIndex = (anteriorIndex + 1) % imagenesFondo.length;
                    setIndiceSiguienteImagen((nuevoIndex + 1) % imagenesFondo.length);
                    return nuevoIndex;
                });
                setOpacidadImagen(1);
            }, duracionTransicion);
        }, duracionTotalCiclo);

        return () => clearInterval(intervalo);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans overflow-hidden">
            <main className="relative w-full flex-grow overflow-hidden flex items-center justify-center text-center">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center overflow-hidden transition-opacity duration-[2000ms] ease-in-out" style={{ backgroundImage: `url('${imagenesFondo[indiceImagenActual]}')`, opacity: opacidadImagen }}></div>
                <div className="hidden" style={{ backgroundImage: `url('${imagenesFondo[indiceSiguienteImagen]}')` }}></div>

                <div className="absolute inset-0 bg-black opacity-60"></div>

                <div className="relative z-10 px-6 md:px-12 max-w-4xl">
                    <nav aria-label="breadcrumb">
                        <ul className="hidden">
                            <li>
                                <Link href="/">Inicio</Link>
                            </li>
                            <li>
                                Bienvenida
                            </li>
                        </ul>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-white drop-shadow-lg">
                        Descubre tu Próxima Obsesión Musical
                    </h1>
                    <p className="text-lg md:text-2xl text-gray-200 mb-10 drop-shadow-md">
                        Sumérgete en un universo de sonidos ilimitados. Crea tus playlists, sigue a tus artistas favoritos y haz que cada ritmo cuente.
                    </p>
                    <Link
                        href={route('register')}
                        className="inline-block px-10 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 duration-300 ease-in-out animate-bounce-once"
                    >
                        ¡Empieza a Escuchar Ahora!
                    </Link>
                    <p className="mt-4 text-gray-400 text-md">
                        ¿Ya estás registrado?{' '}
                        <Link
                            href={route('login')}
                            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-300 ease-in-out"
                        >
                            Inicia Sesión
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
