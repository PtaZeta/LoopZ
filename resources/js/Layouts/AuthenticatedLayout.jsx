import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const usuario = auth.user;

    const [showingMobileMenu, setShowingMobileMenu] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans">

            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md shadow-lg text-white">
                <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                        LoopZ
                    </Link>

                    <nav className="hidden md:flex space-x-6 items-center">
                        <Link href={route('canciones.index')} className="hover:text-blue-400 transition-colors">Canciones</Link>
                        <Link href={route('playlists.index')} className="hover:text-blue-400 transition-colors">Playlists</Link>
                        <Link href={route('albumes.index')} className="hover:text-blue-400 transition-colors">Álbumes</Link>
                        <Link href={route('eps.index')} className="hover:text-blue-400 transition-colors">Eps</Link>
                        <Link href={route('singles.index')} className="hover:text-blue-400 transition-colors">Singles</Link>
                    </nav>

                    <div className="flex items-center space-x-4">
                        {usuario ? (
                            <div className="ml-3 relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-300 hover:text-blue-400 focus:outline-none transition ease-in-out duration-150"
                                            >
                                                {usuario.name}

                                                <svg
                                                    className="ml-2 -mr-0.5 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={route('profile.index')}>
                                            Perfil
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('logout')} method="post" as="button">
                                            Logout
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}

                         <div className="md:hidden flex items-center">
                              <button onClick={() => setShowingMobileMenu(!showingMobileMenu)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white transition duration-150 ease-in-out">
                                 <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                     <path className={!showingMobileMenu ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                     <path className={showingMobileMenu ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                 </svg>
                             </button>
                         </div>
                    </div>
                </div>

                 <div className={(showingMobileMenu ? 'block' : 'hidden') + ' md:hidden'}>
                     <div className="pt-2 pb-3 space-y-1 px-2">
                         <Link href="#explore" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Explorar</Link>
                         <Link href="#genres" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Géneros</Link>
                         {usuario && (
                            <Link href={route('canciones.index')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Canciones</Link>
                         )}
                     </div>
                     {usuario && (
                         <div className="pt-4 pb-1 border-t border-gray-700">
                             <div className="px-5">
                                 <div className="font-medium text-base text-white">{usuario.name}</div>
                                 <div className="font-medium text-sm text-gray-400">{usuario.email}</div>
                             </div>
                             <div className="mt-3 px-2 space-y-1">
                                 <Link href={route('profile.edit')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">Perfil</Link>
                                 <Link href={route('logout')} method="post" as="button" className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                                     Logout
                                 </Link>
                             </div>
                         </div>
                     )}
                 </div>

            </header>

            <main className="pt-20">
                {children}
            </main>
        </div>
    );
}
