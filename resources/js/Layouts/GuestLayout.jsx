// GuestLayout.jsx
import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function GuestLayout({ children }) {
    return (
        // El div principal del GuestLayout.
        // No tiene 'overflow-hidden' aquí, ya que Guest.jsx maneja su propio scroll.
        // Las páginas como Login/Register sí pueden scrollear si su contenido es largo.
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans pt-6 sm:pt-0">
            {/* Header fijo en la parte superior.
                Asegúrate de que no tenga ninguna clase de sombra (shadow-lg, shadow-md, etc.)
                para evitar la línea gris que veías.
            */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md text-white">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                        <ApplicationLogo className="h-8 w-auto" />
                    </Link>
                    <div className="flex items-center space-x-4">
                         <Link
                            href={route('login')}
                            className="hover:text-blue-400 transition-colors text-sm"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            href={route('register')}
                            className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 transition-colors"
                        >
                            Registrarse
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN: Contenedor principal para el contenido de las páginas.
                - pt-16: Proporciona un padding superior para que el contenido no quede debajo del header fijo.
                         (Asume que tu header tiene una altura de aproximadamente 64px / 4rem. Ajusta si tu header es diferente).
                - w-full: Asegura que ocupe todo el ancho disponible.
                - flex-grow: Permite que este main se estire para ocupar el espacio vertical restante en la pantalla,
                             lo que ayuda a centrar el contenido (como formularios) verticalmente si es corto.
                - flex items-center justify-center: Estas clases son para centrar el 'children' (el contenido de la página)
                                                   vertical y horizontalmente dentro de este 'main'.
            */}
            <main className="pt-16 w-full flex-grow flex items-center justify-center">
                {children}
            </main>
        </div>
    );
}
