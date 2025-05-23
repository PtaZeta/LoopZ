import React, { useState, Fragment, useRef, useEffect } from 'react';
import { usePage, Link, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PencilIcon,
    ArrowUturnLeftIcon,
    MusicalNoteIcon,
    PlayIcon,
    PauseIcon,
    SparklesIcon,
    EyeIcon,
    ClockIcon,
    UsersIcon,
    ScaleIcon,
    EllipsisVerticalIcon,
    TrashIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { usePlayer } from '@/contexts/PlayerContext';
import ContextMenu from '@/Components/ContextMenu';

export default function Mostrar() {
    const { cancion, auth } = usePage().props;
    const { cargarColaYIniciar, cancionActual, Reproduciendo, pause, play } = usePlayer();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const formatearDuracion = (segundos) => {
        if (isNaN(segundos) || segundos < 0) return 'N/A';
        const minutes = Math.floor(segundos / 60);
        const secondsRestantes = String(Math.floor(segundos % 60)).padStart(2, '0');
        return `${minutes}:${secondsRestantes}`;
    };

    const currentSongPhotoUrl = cancion.foto_url?.startsWith('http')
        ? cancion.foto_url
        : cancion.foto_url ? `/storage/${cancion.foto_url}` : null;

    const originalSongPhotoUrl = cancion.remix && cancion.cancion_original?.foto_url
        ? (cancion.cancion_original.foto_url.startsWith('http')
            ? cancion.cancion_original.foto_url
            : `/storage/${cancion.cancion_original.foto_url}`)
        : null;

    const displayPhotoUrl = originalSongPhotoUrl || currentSongPhotoUrl;
    const audioFileAvailable = !!cancion.archivo_url;
    const isThisSongCurrent = cancionActual && cancionActual.id === cancion.id;

    const artistas = cancion.usuarios_mapeados && cancion.usuarios_mapeados.length > 0
        ? cancion.usuarios_mapeados.map((user, index, arr) => (
            <Fragment key={user.id}>
                <Link
                    href={route('profile.show', user.id)}
                    className="text-purple-300 hover:text-purple-200 transition-colors duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
                    aria-label={`Ver perfil de ${user.name}`}
                >
                    {user.name}
                </Link>
                {index < arr.length - 1 && ', '}
            </Fragment>
        ))
        : <span className="italic">Desconocido</span>;

    const handlePlayPause = () => {
        if (!audioFileAvailable) return;
        if (isThisSongCurrent && Reproduciendo) pause();
        else if (isThisSongCurrent && !Reproduciendo) play();
        else cargarColaYIniciar([cancion], { iniciar: 0, clickDirecto: true });
    };

    const canEdit = auth.user && cancion.usuarios_mapeados.some(
        user => user.id === auth.user.id && user.es_propietario
    );

    const handleDelete = () => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta canción? Esta acción no se puede deshacer.')) {
            router.delete(route('canciones.destroy', cancion.id), {
                preserveScroll: true,
                onSuccess: () => {
                    router.visit(route('dashboard'));
                },
                onError: (errors) => {
                    console.error('Error al eliminar la canción:', errors);
                    alert('Error al eliminar la canción. Por favor, inténtalo de nuevo.');
                }
            });
        }
        setDropdownOpen(false);
    };

    const handleOpenMenu = (event) => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let xPos = rect.left + window.scrollX;
            let yPos = rect.bottom + window.scrollY + 2;

            if (xPos + 200 > window.innerWidth) {
                xPos = window.innerWidth - 200 - 10;
            }

            setMenuPosition({
                x: xPos,
                y: yPos,
            });
        }
        setDropdownOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);


    const menuOptions = [
        {
            label: 'Editar Canción',
            icon: <PencilIcon className="h-5 w-5 text-purple-400" aria-hidden="true" />,
            action: () => {
                setDropdownOpen(false);
                router.visit(route('canciones.edit', cancion.id));
            },
        },
        {
            label: 'Eliminar Canción',
            icon: <TrashIcon className="h-5 w-5 text-red-400" aria-hidden="true" />,
            action: handleDelete,
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Detalles de Canción</h2>}
        >
            <Head title={cancion.titulo || 'Detalles de Canción'} />

            <div aria-live="polite" aria-atomic="true" className="sr-only">
                Mostrando detalles de la canción: {cancion.titulo}
            </div>

            <div className="pt-20 pb-12 min-h-screen text-gray-100 bg-gradient-to-br from-slate-900 to-gray-950">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-start md:space-x-12 p-4 sm:p-8 md:p-12 bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-4xl overflow-hidden border border-slate-700">
                        <div className="flex-shrink-0 w-full sm:w-60 md:w-1/3 lg:w-80 mx-auto md:mx-0 mb-6 md:mb-0">
                           <div className="aspect-square w-full max-w-xs sm:max-w-none mx-auto sm:w-60 h-auto lg:w-80 shadow-2xl rounded-xl overflow-hidden border-4 border-purple-600 transform hover:scale-105 transition-transform duration-300 ease-in-out">
                                {displayPhotoUrl ? (
                                    <img
                                        src={displayPhotoUrl}
                                        alt={`Cover de ${cancion.titulo}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400" role="img" aria-label="Sin imagen de cover">
                                        <MusicalNoteIcon className="h-24 w-24 sm:h-32 sm:h-32" aria-hidden="true"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Alineación a la izquierda en móvil */}
                        <div className="flex-grow text-left mt-6 md:mt-0">
                            <p className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-1 sm:mb-2">Canción</p>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-5 text-white drop-shadow-lg leading-tight">
                                {cancion.titulo}
                            </h1>

                            <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-4 mb-6 sm:mb-8 text-sm text-gray-300">
                                {/* Artistas */}
                                <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg flex items-start gap-x-2 sm:gap-x-3 shadow-inner border border-slate-600">
                                    <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" aria-hidden="true" />
                                    <div>
                                        <p className="font-semibold text-gray-400 text-xs sm:text-sm">Artistas</p>
                                        <div className="text-purple-300 text-sm sm:text-base break-words">{artistas}</div>
                                    </div>
                                </div>
                                {/* Duración */}
                                <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg flex items-start gap-x-2 sm:gap-x-3 shadow-inner border border-slate-600">
                                    <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 flex-shrink-0" aria-hidden="true" /> {/* Color ajustado */}
                                    <div>
                                        <p className="font-semibold text-gray-400 text-xs sm:text-sm">Duración</p>
                                        <p className="text-slate-300 text-sm sm:text-base">{formatearDuracion(cancion.duracion)}</p> {/* Color ajustado */}
                                    </div>
                                </div>
                                {cancion.generos_mapeados && (
                                    <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg flex items-start gap-x-2 sm:gap-x-3 shadow-inner border border-slate-600">
                                        <MusicalNoteIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0" aria-hidden="true" /> {/* Color ajustado */}
                                        <div>
                                            <p className="font-semibold text-gray-400 text-xs sm:text-sm">Género</p>
                                            <p className="text-purple-300 text-sm sm:text-base break-words">{cancion.generos_mapeados}</p> {/* Color ajustado */}
                                        </div>
                                    </div>
                                )}
                                {cancion.licencia && (
                                    <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg flex items-start gap-x-2 sm:gap-x-3 shadow-inner border border-slate-600">
                                        <ScaleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 flex-shrink-0" aria-hidden="true" /> {/* Color ajustado */}
                                        <div>
                                            <p className="font-semibold text-gray-400 text-xs sm:text-sm">Licencia</p>
                                            <p className="text-slate-300 text-sm sm:text-base break-words">{cancion.licencia.nombre}</p> {/* Color ajustado */}
                                        </div>
                                    </div>
                                )}
                                {cancion.visualizaciones !== undefined && cancion.visualizaciones !== null && (
                                    <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg flex items-start gap-x-2 sm:gap-x-3 shadow-inner border border-slate-600">
                                        <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 flex-shrink-0" aria-hidden="true" /> {/* Color ajustado */}
                                        <div>
                                            <p className="font-semibold text-gray-400 text-xs sm:text-sm">Visualizaciones</p>
                                            <p className="text-slate-300 text-sm sm:text-base">{cancion.visualizaciones.toLocaleString()}</p> {/* Color ajustado */}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {cancion.remix && cancion.cancion_original && (
                                <div role="status" className="mb-6 sm:mb-8 text-sm sm:text-base text-gray-300 flex items-start gap-x-2 sm:gap-x-3 bg-purple-900/40 p-3 sm:p-4 rounded-lg border border-purple-700 shadow-lg">
                                    <SparklesIcon className="h-6 w-6 text-purple-300 flex-shrink-0" aria-hidden="true"/>
                                    <span>
                                        ¡Este es un <strong>remix</strong> de{' '}
                                        <Link href={route('canciones.show', cancion.cancion_original.id)} className="font-bold text-purple-200 hover:text-white underline focus:outline-none focus:ring-1 focus:ring-purple-300 rounded transition-colors duration-200">
                                            {cancion.cancion_original.titulo}
                                        </Link>{' '}
                                        por{' '}
                                        <span className="font-bold text-purple-200">
                                            {cancion.cancion_original.usuarios_mapeados && cancion.cancion_original.usuarios_mapeados.length > 0
                                                ? cancion.cancion_original.usuarios_mapeados.map(u => u.name).join(', ')
                                                : 'Artista Desconocido'}
                                        </span>! Descubre la original.
                                    </span>
                                </div>
                            )}

                            {!audioFileAvailable && (
                                <div role="alert" className="text-sm sm:text-base text-red-300 mb-6 sm:mb-8 bg-red-900/30 p-3 sm:p-4 rounded-lg border border-red-700 shadow-inner flex items-start gap-x-2 sm:gap-x-3">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-red-300 flex-shrink-0" aria-hidden="true" />
                                    <div>
                                        <span className="font-bold block sm:inline">¡Atención!</span> <span className="block sm:inline">No hay archivo de audio disponible para esta canción.</span>
                                    </div>
                                </div>
                            )}

                            {/* Alineación a la izquierda en móvil para los botones */}
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-start gap-4 mt-6 sm:mt-8">
                                <button
                                    onClick={handlePlayPause}
                                    className="inline-flex items-center justify-center w-auto px-6 py-3 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full font-bold text-white text-lg sm:text-xl shadow-2xl hover:scale-105 transform transition duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label={isThisSongCurrent && Reproduciendo ? `Pausar reproducción de ${cancion.titulo}` : `Reproducir ${cancion.titulo}`}
                                    disabled={!audioFileAvailable}
                                >
                                    {isThisSongCurrent && Reproduciendo ? (
                                        <PauseIcon className="h-8 w-8 md:h-10 md:w-10" aria-hidden="true" />
                                    ) : (
                                        <PlayIcon className="h-8 w-8 md:h-10 md:w-10" aria-hidden="true" />
                                    )}
                                    <span className="sm:hidden ml-2">{isThisSongCurrent && Reproduciendo ? "Pausar" : "Reproducir"}</span>
                                </button>
                                <Link
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (window.history.length > 2) window.history.back();
                                        else router.visit(route('dashboard') || '/');
                                    }}
                                    className="inline-flex items-center justify-center w-auto px-4 py-2 sm:px-8 sm:py-4 border border-slate-600 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-wider shadow-lg bg-slate-700/40 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-25 transition ease-in-out duration-150"
                                    aria-label="Volver a la página anterior o al inicio"
                                >
                                    <ArrowUturnLeftIcon className="h-4 w-4 mr-1 sm:mr-3" aria-hidden="true" />
                                    Volver
                                </Link>

                                {canEdit && (
                                    <div className="relative inline-block text-left w-auto">
                                        <button
                                            ref={triggerRef}
                                            type="button"
                                            className="inline-flex items-center justify-center w-auto px-4 py-2 sm:px-4 sm:py-4 border border-slate-600 rounded-full font-semibold text-xs text-gray-300 uppercase tracking-wider shadow-lg bg-slate-700/40 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition ease-in-out duration-150"
                                            onClick={handleOpenMenu}
                                            aria-label="Más opciones para esta canción"
                                            aria-haspopup="true"
                                            aria-expanded={dropdownOpen}
                                        >
                                            <EllipsisVerticalIcon className="h-4 w-4 sm:mr-0" aria-hidden="true" />
                                            <span className="sm:hidden ml-2 text-sm">Opciones</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {dropdownOpen && canEdit && (
                        <div ref={menuRef}>
                           <ContextMenu
                                x={menuPosition.x}
                                y={menuPosition.y}
                                show={dropdownOpen}
                                onClose={() => setDropdownOpen(false)}
                                options={menuOptions}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
