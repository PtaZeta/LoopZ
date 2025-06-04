import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function GuestLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans pt-6 sm:pt-0">

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

            <main className="pt-16 w-full flex-grow flex items-center justify-center">
                {children}
            </main>
        </div>
    );
}
