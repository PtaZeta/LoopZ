import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans pt-6 sm:pt-0">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md shadow-lg text-white">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                        LoopZ
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
                            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                            Registrarse
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-20 w-full">
                {children}
            </main>
        </div>
    );
}
