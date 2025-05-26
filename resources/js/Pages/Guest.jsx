import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Guest() {
    const images = [
        '/imagenes/fondo_guest_1.jpg',
        '/imagenes/fondo_guest_2.jpg',
        '/imagenes/fondo_guest_3.jpg',
        '/imagenes/fondo_guest_4.jpg',
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(() => {
        const initialIndex = Math.floor(Math.random() * images.length);
        return initialIndex;
    });
    const [imageOpacity, setImageOpacity] = useState(1);
    const [nextImageIndex, setNextImageIndex] = useState(0); // Para precargar la siguiente imagen y tenerla lista

    useEffect(() => {
        // Pre-carga todas las imágenes para evitar parpadeos
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        // Inicializa el índice de la siguiente imagen
        setNextImageIndex((currentImageIndex + 1) % images.length);

        const transitionDuration = 2000; // 2 segundos para el fundido (más suave)
        const displayDuration = 13000; // 13 segundos que la imagen está visible antes de empezar a fundirse
        const totalDuration = displayDuration + transitionDuration; // Total: 15 segundos

        const interval = setInterval(() => {
            // Paso 1: Reducir la opacidad a 0 para iniciar el fundido de salida
            setImageOpacity(0);

            // Paso 2: Cambiar la imagen *después* de que haya iniciado el fundido de salida
            // Se hace un poco antes de que la opacidad llegue a 0 para que el cambio no sea visible
            setTimeout(() => {
                setCurrentImageIndex(prevIndex => {
                    const newIndex = (prevIndex + 1) % images.length;
                    setNextImageIndex((newIndex + 1) % images.length); // Actualiza la siguiente imagen
                    return newIndex;
                });
                setImageOpacity(1); // Paso 3: Aumentar la opacidad a 1 para el fundido de entrada de la nueva imagen
            }, transitionDuration); // Cambia la imagen justo cuando el fundido de salida termina
        }, totalDuration);

        return () => clearInterval(interval);
    }, []); // El array de dependencias vacío asegura que se ejecute una sola vez al montar

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans overflow-hidden">
            <main className="relative w-full flex-grow overflow-hidden flex items-center justify-center text-center" itemScope itemType="https://schema.org/WebPage">
                <meta itemProp="name" content="Descubre tu Próxima Obsesión Musical" />
                <meta itemProp="description" content="Sumérgete en un universo de sonidos ilimitados. Crea tus playlists, sigue a tus artistas favoritos y haz que cada ritmo cuente." />

                {/* Div principal de la imagen con la transición de opacidad */}
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center overflow-hidden transition-opacity duration-[2000ms] ease-in-out" // Ajustada duración a 2000ms
                    style={{
                        backgroundImage: `url('${images[currentImageIndex]}')`,
                        opacity: imageOpacity
                    }}
                ></div>
                {/* Div auxiliar para precargar la siguiente imagen (opcional, pero mejora la fluidez) */}
                <div
                    className="hidden" // Escondido, solo para que el navegador lo cargue
                    style={{ backgroundImage: `url('${images[nextImageIndex]}')` }}
                ></div>

                {/* Overlay de oscuridad */}
                <div className="absolute inset-0 bg-black opacity-60"></div>

                <div className="relative z-10 px-6 md:px-12 max-w-4xl">
                    <nav aria-label="breadcrumb" itemScope itemType="https://schema.org/BreadcrumbList">
                        <ul className="hidden">
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <Link href="/" itemProp="item"><span itemProp="name">Inicio</span></Link>
                                <meta itemProp="position" content="1" />
                            </li>
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <span itemProp="name">Bienvenida</span>
                                <meta itemProp="position" content="2" />
                            </li>
                        </ul>
                    </nav>
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-white drop-shadow-lg" itemProp="headline">
                        Descubre tu Próxima Obsesión Musical
                    </h1>
                    <p className="text-lg md:text-2xl text-gray-200 mb-10 drop-shadow-md" itemProp="text">
                        Sumérgete en un universo de sonidos ilimitados. Crea tus playlists, sigue a tus artistas favoritos y haz que cada ritmo cuente.
                    </p>
                    <Link
                        href={route('register')}
                        className="inline-block px-10 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 duration-300 ease-in-out animate-bounce-once"
                        itemProp="url"
                    >
                        ¡Empieza a Escuchar Ahora!
                    </Link>
                </div>
            </main>
        </div>
    );
}
