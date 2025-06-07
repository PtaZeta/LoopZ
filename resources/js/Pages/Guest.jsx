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
        const valorInicial = Math.floor(Math.random() * images.length);
        return valorInicial;
    });
    const [imageOpacity, setImageOpacity] = useState(1);
    const [nextImageIndex, setNextImageIndex] = useState(0);

    useEffect(() => {
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        setNextImageIndex((currentImageIndex + 1) % images.length);

        const transitionDuration = 2000;
        const displayDuration = 13000;
        const totalDuration = displayDuration + transitionDuration;

        const interval = setInterval(() => {
            setImageOpacity(0);

            setTimeout(() => {
                setCurrentImageIndex(anteriorIndex => {
                    const nuevoIndex = (anteriorIndex + 1) % images.length;
                    setNextImageIndex((nuevoIndex + 1) % images.length);
                    return nuevoIndex;
                });
                setImageOpacity(1);
            }, transitionDuration);
        }, totalDuration);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans overflow-hidden">
            <main className="relative w-full flex-grow overflow-hidden flex items-center justify-center text-center" itemScope itemType="https://schema.org/WebPage">
                <meta itemProp="name" content="Descubre tu Próxima Obsesión Musical" />
                <meta itemProp="description" content="Sumérgete en un universo de sonidos ilimitados. Crea tus playlists, sigue a tus artistas favoritos y haz que cada ritmo cuente." />

                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center overflow-hidden transition-opacity duration-[2000ms] ease-in-out"
                    style={{
                        backgroundImage: `url('${images[currentImageIndex]}')`,
                        opacity: imageOpacity
                    }}
                ></div>
                <div
                    className="hidden"
                    style={{ backgroundImage: `url('${images[nextImageIndex]}')` }}
                ></div>

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
