import React from 'react'; // Importa React
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react'; // Importa Head, usePage y Link

// --- Reutilizamos el Helper ProfileImage (sin cambios necesarios aquí) ---
const ProfileImage = ({ src, alt, placeholderClass, imageClass }) => {
    // Nota: Mantenemos el cache buster por consistencia, aunque menos crítico aquí.
    const imageUrl = src ? `/storage/${src}?t=${Date.now()}` : null;
    const uniqueKey = src ? `img-${src}` : 'placeholder'; // Clave más estable para Index

    return (
        <>
            {imageUrl ? (
                <img key={uniqueKey} src={imageUrl} alt={alt} className={imageClass} />
            ) : (
                <div key={uniqueKey} className={placeholderClass}>
                    {/* Placeholder visual (puede contener iniciales si se adapta) */}
                </div>
            )}
        </>
    );
};
// --- Fin Helper ProfileImage ---

export default function Index() { // Cambiado nombre a Index
    const { auth } = usePage().props; // Obtenemos solo auth que contiene user
    const user = auth.user;

    // Función simple para obtener iniciales (opcional, para placeholder)
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        const initials = names.map(n => n.charAt(0)).join('');
        return initials.toUpperCase().slice(0, 2); // Max 2 iniciales
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                     <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Profile
                     </h2>
                     {/* Enlace opcional para ir a la página de edición */}
                     <Link
                        href={route('profile.edit')}
                        className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                    >
                        Edit Profile
                    </Link>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    {/* --- Sección de Banner y Foto de Perfil (Solo Display) --- */}
                    <div className="relative mb-16 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        {/* Banner (Display) */}
                        <div className="relative"> {/* Añadido relative para posicionar placeholder text */}
                            <ProfileImage
                                src={user.banner_perfil}
                                alt="Profile banner"
                                imageClass="w-full h-48 sm:h-64 object-cover rounded-t-lg"
                                placeholderClass="w-full h-48 sm:h-64 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center text-gray-200" // Placeholder con texto
                            />
                             {!user.banner_perfil && (
                                <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-100 pointer-events-none">
                                    No banner set
                                </span>
                             )}
                        </div>

                        {/* Contenedor Foto de Perfil (Display) */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                             <div className="relative"> {/* Necesario para posicionar las iniciales */}
                                <ProfileImage
                                    src={user.foto_perfil}
                                    alt={`${user.name}'s profile picture`}
                                    imageClass="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-white dark:bg-gray-700" // Añadido bg por si la imagen tiene transparencia
                                    placeholderClass="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg"
                                />
                                {/* Iniciales en Placeholder (si no hay foto) */}
                                {!user.foto_perfil && (
                                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-semibold pointer-events-none rounded-full">
                                        {getInitials(user.name)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* --- Fin Sección Display --- */}

                    {/* --- Información del Usuario (Solo Texto) --- */}
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg mt-8 sm:mt-16"> {/* Añadido margen superior */}
                        <div className="max-w-xl mx-auto text-center sm:text-left"> {/* Centrado en móvil, izquierda en escritorio */}
                             {/* Espacio para compensar la foto de perfil superpuesta */}
                             <div className="pt-12 sm:pt-16"></div>

                             <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                 {user.name}
                             </h3>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                 {user.email}
                             </p>

                             {/* Puedes añadir más información aquí si está disponible en user */}
                             {/* Ejemplo: Miembro desde... */}
                             {/* <p className="text-sm text-gray-500 dark:text-gray-500">
                                 Member since: {new Date(user.created_at).toLocaleDateString()}
                             </p> */}

                             {/* Puedes añadir una sección de Biografía si existe en tu modelo User */}
                             {/* {user.bio && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">About Me</h4>
                                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{user.bio}</p>
                                </div>
                             )} */}

                        </div>
                    </div>
                    {/* --- Fin Información del Usuario --- */}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}