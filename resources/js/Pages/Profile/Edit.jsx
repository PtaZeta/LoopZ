import React, { useRef, useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm, Link } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import InputError from '@/Components/InputError';
import { router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import {
    UserCircleIcon,
    PhotoIcon,
    MusicalNoteIcon as MusicalNoteIconSolid,
} from '@heroicons/react/24/solid';


const ImagenPerfilEdit = ({ fuente, textoAlternativo, clasesImagen, clasesPlaceholder, tipo = 'perfil', nombre = '' }) => {
    const [errorCarga, setErrorCarga] = useState(false);
    const cacheBuster = '';
    let urlFinal = null;

    if (fuente) {
        if (fuente.startsWith('blob:') || fuente.startsWith('http://') || fuente.startsWith('https://')) {
            urlFinal = fuente;
        } else {
            urlFinal = `/storage/${fuente}${cacheBuster}`;
        }
    }

    const manejarErrorImagen = useCallback(() => {
        setErrorCarga(true);
    }, []);

    useEffect(() => {
        setErrorCarga(false);
    }, [fuente]);

    const obtenerIniciales = useCallback((nombreCompleto) => {
        if (!nombreCompleto) return '';
        const nombres = nombreCompleto.split(' ');
        const iniciales = nombres.map(n => n.charAt(0)).join('');
        return iniciales.toUpperCase().slice(0, 2);
    }, []);

    const IconoPlaceholder = useCallback(() => {
        switch (tipo) {
            case 'perfil': return <UserCircleIcon className="w-1/2 h-1/2 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />;
            case 'banner': return <PhotoIcon className="w-1/3 h-1/3 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />;
            default: return <PhotoIcon className="w-1/3 h-1/3 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />;
        }
    }, [tipo]);

    const ContenidoPlaceholder = useCallback(() => {
        if (tipo === 'perfil' && !fuente && nombre) {
            return <span className="text-gray-200 text-4xl font-semibold pointer-events-none group-hover:text-fuchsia-400 transition-colors duration-300">{obtenerIniciales(nombre)}</span>;
        }
        return <IconoPlaceholder />;
    }, [tipo, fuente, nombre, obtenerIniciales, IconoPlaceholder]);

    const claveParaImagen = urlFinal ? `img-${urlFinal}` : null;
    const claveParaPlaceholderWrapper = `ph-wrapper-${tipo}-${textoAlternativo ? textoAlternativo.replace(/\s+/g, '-') : 'sin-alt'}-${nombre || 'no-nombre'}`;


    return (
        <div className={`${clasesPlaceholder} flex items-center justify-center overflow-hidden relative`}>
            {urlFinal && !errorCarga ? (
                <img
                    key={claveParaImagen}
                    src={urlFinal}
                    alt={textoAlternativo}
                    className={`${clasesImagen}`}
                    onError={manejarErrorImagen}
                />
            ) : (
                <div key={claveParaPlaceholderWrapper} className="w-full h-full flex items-center justify-center">
                    <ContenidoPlaceholder />
                </div>
            )}
        </div>
    );
};


export default function Edit({ mustVerifyEmail, status }) {
    const pageProps = usePage().props;
    const user = pageProps.auth.user;

    const photoInputRef = useRef();
    const bannerInputRef = useRef();

    const [photoPreview, setPhotoPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    const { data, setData, post, errors, processing, reset, recentlySuccessful, transform } = useForm({
        foto_perfil: null,
        banner_perfil: null,
        name: user.name,
        email: user.email,
        _method: 'patch',
    });

    const handlePhotoAreaClick = () => {
        if (!processing) {
            photoInputRef.current.click();
        }
    };

    const handleBannerAreaClick = () => {
        if (!processing) {
            bannerInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const nameField = e.target.name;

        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (nameField === 'foto_perfil') {
                setPhotoPreview(previewUrl);
                setData('foto_perfil', file);
            } else if (nameField === 'banner_perfil') {
                setBannerPreview(previewUrl);
                setData('banner_perfil', file);
            }
        }
        if (photoInputRef.current) photoInputRef.current.value = null;
        if (bannerInputRef.current) bannerInputRef.current.value = null;
    };

    const handleImageUpload = (imageType) => {
        if (!data[imageType]) return;

        const dataToSend = new FormData();
        dataToSend.append('_method', 'patch');
        dataToSend.append('name', data.name);
        dataToSend.append('email', data.email);
        dataToSend.append(imageType, data[imageType]);

        router.post(route('profile.update'), dataToSend, {
            preserveScroll: true,
            preserveState: true,
            forceFormData: true,
            onSuccess: () => {
                if (imageType === 'foto_perfil') setPhotoPreview(null);
                if (imageType === 'banner_perfil') setBannerPreview(null);
                setData(imageType, null);
                if (photoInputRef.current) photoInputRef.current.value = null;
                if (bannerInputRef.current) bannerInputRef.current.value = null;
            },
            onError: (errors) => {
                if (photoInputRef.current) photoInputRef.current.value = null;
                if (bannerInputRef.current) bannerInputRef.current.value = null;
            },
            onFinish: () => {
            },
        });
    };

    const cancelPreview = (imageType) => {
        if (imageType === 'foto_perfil') {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
            setPhotoPreview(null);
            setData('foto_perfil', null);
            if (photoInputRef.current) photoInputRef.current.value = null;
        } else if (imageType === 'banner_perfil') {
            if (bannerPreview) URL.revokeObjectURL(bannerPreview);
            setBannerPreview(null);
            setData('banner_perfil', null);
            if (bannerInputRef.current) bannerInputRef.current.value = null;
        }
    };


    const [showSuccess, setShowSuccess] = useState(false);
    useEffect(() => {
        if (recentlySuccessful) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [recentlySuccessful]);

    useEffect(() => {
        return () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
            if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        };
    }, [photoPreview, bannerPreview]);


    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        const initials = names.map(n => n.charAt(0)).join('');
        return initials.toUpperCase().slice(0, 2);
    }

    return (
        <AuthenticatedLayout>
            <Head title="Editar Perfil" />

            <input
                type="file"
                ref={photoInputRef}
                name="foto_perfil"
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            />
            <input
                type="file"
                ref={bannerInputRef}
                name="banner_perfil"
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
            />


            <div className="py-12 pt-20">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">

                    {showSuccess && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-teal-600 to-cyan-700 border border-teal-500 text-white rounded shadow-lg">
                            ¡Perfil actualizado exitosamente!
                        </div>
                    )}

                    <div className="relative mb-16 bg-gray-900 shadow-xl sm:rounded-lg border border-gray-700">
                        <div className="relative group">
                            <div
                                className={`cursor-pointer ${processing ? 'opacity-75 pointer-events-none' : ''}`}
                                onClick={handleBannerAreaClick}
                                title="Click para cambiar el banner"
                            >
                                <ImagenPerfilEdit
                                    fuente={bannerPreview || user.banner_perfil}
                                    textoAlternativo="Banner del perfil"
                                    clasesImagen="w-full h-48 sm:h-64 object-cover rounded-t-lg"
                                    clasesPlaceholder="w-full h-48 sm:h-64 bg-gray-800 rounded-t-lg flex items-center justify-center text-gray-500"
                                    tipo="banner"
                                />
                                {(!user.banner_perfil && !bannerPreview) && <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 group-hover:text-cyan-400 transition-colors duration-300 pointer-events-none">Click para añadir banner</span>}

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-60 flex items-center justify-center transition-opacity duration-300 rounded-t-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                            <InputError message={errors.banner_perfil} className="absolute bottom-2 right-2 bg-red-800 text-red-100 px-2 py-1 rounded text-xs z-10" />
                            {bannerPreview && (
                                <div className="absolute top-2 right-2 z-10 flex gap-2">
                                    <PrimaryButton
                                        onClick={() => handleImageUpload('banner_perfil')}
                                        disabled={processing}
                                        size="sm"
                                        className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition ease-in-out duration-150"
                                    >
                                        {processing ? 'Subiendo...' : 'Actualizar Banner'}
                                    </PrimaryButton>
                                    <DangerButton
                                        onClick={() => cancelPreview('banner_perfil')}
                                        disabled={processing}
                                        size="sm"
                                        title="Cancelar selección"
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 focus:bg-red-700 active:bg-red-800"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </DangerButton>
                                </div>
                            )}
                        </div>

                        <div
                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2"
                        >
                            <div className="relative group">
                                <div
                                    className={`cursor-pointer ${processing ? 'opacity-75 pointer-events-none' : ''}`}
                                    onClick={handlePhotoAreaClick}
                                    title="Click para cambiar la foto de perfil"
                                >
                                    <ImagenPerfilEdit
                                        fuente={photoPreview || user.foto_perfil}
                                        textoAlternativo={`Foto de perfil de ${user.name}`}
                                        clasesImagen="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-700 object-cover shadow-lg bg-gray-800"
                                        clasesPlaceholder="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-700 bg-gray-700 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-lg"
                                        tipo="perfil"
                                        nombre={user.name}
                                    />
                                    {(!user.foto_perfil && !photoPreview) && (
                                        <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-semibold pointer-events-none rounded-full">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity duration-300 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400 opacity-0 group-hover:opacity-75 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                </div>
                                {photoPreview && (
                                    <div className="absolute bottom-0 right-0 -mb-4 z-10 flex gap-2">
                                        <PrimaryButton
                                            onClick={() => handleImageUpload('foto_perfil')}
                                            disabled={processing}
                                            size="sm"
                                            className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition ease-in-out duration-150"
                                        >
                                            {processing ? '...' : 'Actualizar'}
                                        </PrimaryButton>
                                        <DangerButton
                                            onClick={() => cancelPreview('foto_perfil')}
                                            disabled={processing}
                                            size="sm"
                                            title="Cancelar selección"
                                            className="p-1 bg-red-600 hover:bg-red-700 focus:bg-red-700 active:bg-red-800"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </DangerButton>
                                    </div>
                                )}
                                <InputError message={errors.foto_perfil} className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-red-800 text-red-100 px-2 py-1 rounded text-xs z-10" />
                            </div>
                        </div>
                    </div>


                    <div className="p-4 sm:p-8 bg-gray-900 shadow-xl sm:rounded-lg border border-gray-700">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                            user={user}
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-gray-900 shadow-xl sm:rounded-lg border border-gray-700">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-gray-900 shadow-xl sm:rounded-lg border border-gray-700">
                        <DeleteUserForm className="max-w-xl" />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
