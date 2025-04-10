import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
// Añade useForm y useRef de React
import { Head, usePage, useForm, Link } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react'; // Importa useRef y hooks de estado/efecto
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import InputError from '@/Components/InputError'; // Para mostrar errores de subida
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton'; // Podríamos necesitarlo para reintentar
import SecondaryButton from '@/Components/SecondaryButton'; // Para un botón de cancelar/cambiar

// --- Helper ProfileImage (con key y cache buster) ---
const ProfileImage = ({ src, alt, placeholderClass, imageClass, isUploading = false }) => {
    const imageUrl = src ? `/storage/${src}` : null;
    const uniqueKey = src ? `img-${src}-${Date.now()}` : 'placeholder';

    return (
        <div className="relative"> {/* Envolvemos en relativo para el overlay */}
            {imageUrl ? (
                <img key={uniqueKey} src={`${imageUrl}?t=${Date.now()}`} alt={alt} className={imageClass} />
            ) : (
                <div key={uniqueKey} className={placeholderClass}></div>
            )}
            {/* Overlay simple de "subiendo" */}
            {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </div>
    );
};
// --- Fin Helper ProfileImage ---

export default function Edit({ mustVerifyEmail, status }) {
    const pageProps = usePage().props; // Obtenemos todas las props
    const user = pageProps.auth.user;
    const pageErrors = pageProps.errors; // Errores generales de la página

    // --- Refs para los inputs de archivo ocultos ---
    const photoInputRef = useRef();
    const bannerInputRef = useRef();

    // Estado local para saber qué imagen se está subiendo
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // --- useForm para subir las imágenes individualmente ---
    const { setData, post, errors, processing, reset, recentlySuccessful } = useForm({
        // No necesitamos estado aquí, enviaremos el archivo directamente
        // _method: 'PUT' // Laravel necesita saber que es un update parcial
    });

    // --- Manejador para clic en la zona de la foto de perfil ---
    const handlePhotoAreaClick = () => {
        // Solo permite cambiar si no se está subiendo ya
        if (!uploadingPhoto) {
            photoInputRef.current.click();
        }
    };

    // --- Manejador para clic en la zona del banner ---
    const handleBannerAreaClick = () => {
         if (!uploadingBanner) {
            bannerInputRef.current.click();
        }
    };

    // --- Manejador onChange para los inputs de archivo ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const nameField = e.target.name; // 'foto_perfil' o 'banner_perfil'
    
        if (file) {
            // Indicar visualmente que se está subiendo
            if (nameField === 'foto_perfil') setUploadingPhoto(true);
            if (nameField === 'banner_perfil') setUploadingBanner(true);
    
            // Incluye también los campos name y email requeridos
            const dataToSend = {
                _method: 'patch',
                [nameField]: file,
                name: user.name,
                email: user.email,
            };
    
            const options = {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (photoInputRef.current) photoInputRef.current.value = null;
                    if (bannerInputRef.current) bannerInputRef.current.value = null;
                    reset();
                },
                onError: (errors) => {
                    console.error("Upload Error:", errors);
                    if (photoInputRef.current) photoInputRef.current.value = null;
                    if (bannerInputRef.current) bannerInputRef.current.value = null;
                },
                onFinish: () => {
                    if (nameField === 'foto_perfil') setUploadingPhoto(false);
                    if (nameField === 'banner_perfil') setUploadingBanner(false);
                },
            };
            console.log('File selected:', file); // Mira si esto es un objeto File con name, size, type, etc.
            console.log('Data being sent:', dataToSend); // Mira si contiene foto_perfil: [Object File]
            
            // Realizar la petición PATCH
            router.patch(route('profile.update'), dataToSend, options);
        }
    };     // Mostrar mensaje de éxito temporalmente
    const [showSuccess, setShowSuccess] = useState(false);
    useEffect(() => {
        if (recentlySuccessful) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000); // Ocultar después de 3s
            return () => clearTimeout(timer);
        }
    }, [recentlySuccessful]);


    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            {/* --- Inputs de Archivo Ocultos --- */}
            <input
                type="file"
                ref={photoInputRef}
                name="foto_perfil" // Coincide con el backend y state
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            />
            <input
                type="file"
                ref={bannerInputRef}
                name="banner_perfil" // Coincide con el backend y state
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            />
            {/* --- Fin Inputs Ocultos --- */}


            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                     {/* Mensaje de éxito para subida de imagen */}
                     {showSuccess && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                            Image updated successfully!
                        </div>
                     )}

                    {/* --- Sección de Banner y Foto de Perfil (Display y Clickable) --- */}
                    <div className="relative mb-16 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        {/* Banner (Clickable) */}
                        <div
                           className={`cursor-pointer ${uploadingBanner ? 'opacity-75' : ''}`}
                           onClick={handleBannerAreaClick}
                           title="Click to change banner"
                        >
                            <ProfileImage
                                src={user.banner_perfil}
                                alt="Profile banner"
                                imageClass="w-full h-48 sm:h-64 object-cover rounded-t-lg"
                                placeholderClass="w-full h-48 sm:h-64 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 rounded-t-lg flex items-center justify-center text-gray-200" // Placeholder con texto
                                isUploading={uploadingBanner}
                            >
                                {!user.banner_perfil && <span className="text-sm">Click to add banner</span>}
                            </ProfileImage>
                             {/* Mostrar error específico del banner */}
                            <InputError message={errors.banner_perfil} className="absolute bottom-2 right-2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs" />
                        </div>

                        {/* Contenedor Foto de Perfil (Clickable) */}
                        <div
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 cursor-pointer"
                            onClick={handlePhotoAreaClick}
                            title="Click to change profile photo"
                        >
                             <ProfileImage
                                src={user.foto_perfil}
                                alt={`${user.name}'s profile picture`}
                                imageClass="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-white"
                                placeholderClass="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg"
                                isUploading={uploadingPhoto}
                            />
                             {/* Iniciales en Placeholder */}
                            {!user.foto_perfil && user.name && !uploadingPhoto && (
                                <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-semibold pointer-events-none">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                             {/* Mostrar error específico de la foto */}
                            <InputError message={errors.foto_perfil} className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs" />
                        </div>
                    </div>
                    {/* --- Fin Sección Display --- */}


                    {/* --- Formularios --- */}
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        {/* Este formulario ahora NO necesita manejar los inputs de archivo */}
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status} // Status general (ej: 'profile-updated')
                            className="max-w-xl"
                            user={user}
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                    {/* --- Fin Formularios --- */}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}