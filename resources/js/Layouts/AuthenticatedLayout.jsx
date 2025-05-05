import React, { useState, useContext, memo, useEffect, useMemo, useRef, useCallback } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PlayerContext } from '@/contexts/PlayerContext';
import { MusicalNoteIcon, ArrowsRightLeftIcon, QueueListIcon, ArrowPathIcon as LoopIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon as LoadingIcon } from '@heroicons/react/20/solid';

const PlayIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" >
    <path d="M8 5V19L19 12L8 5Z" />
  </svg>
);
const PauseIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" />
  </svg>
);
const PreviousIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6H8V18H6V6ZM9.5 12L18 18V6L9.5 12Z" />
  </svg>
);
const NextIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 6H18V18H16V6ZM8 18V6L16.5 12L8 18Z" />
  </svg>
);
const VolumeIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);
const VolumeLowIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06Z" />
    </svg>
);
const VolumeMuteIcon = (props) => (
     <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
         <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M17.25 9.75 19.5 12M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06Z" />
     </svg>
);

const ShuffleIcon = ArrowsRightLeftIcon;

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const obtenerUrlImagenLayout = (item) => {
    if (!item) return null;
    if (item.imagen) {
        return item.imagen.startsWith('http') ? item.imagen : `/storage/${item.imagen}`;
    }
    if (item?.foto_url) return item.foto_url;
    if (item?.image_url) return item.image_url;
    if (item?.archivo_url && !item.imagen && !item.foto_url && !item.image_url) {
         return null;
    }
    return null;
};

const PlayerImagenItem = memo(({ url, titulo, className = "w-10 h-10", iconoFallback, isQueueItem = false }) => {
    const [src, setSrc] = useState(url);
    const [error, setError] = useState(false);

    useEffect(() => {
        setSrc(url);
        setError(false);
    }, [url]);

    const manejarErrorImagen = useCallback(() => {
        setError(true);
    }, []);

    const placeholderSizeClass = isQueueItem ? 'w-8 h-8' : className;
    const placeholderIconSize = isQueueItem ? 'h-4 w-4' : 'h-6 w-6';

    if (error || !src) {
        const finalClassName = `${className} ${placeholderSizeClass}`;
        return (
            <div className={`${finalClassName} bg-slate-700 flex items-center justify-center text-slate-500 rounded flex-shrink-0`}>
                {iconoFallback || <MusicalNoteIcon className={placeholderIconSize}/>}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy"
            onError={manejarErrorImagen}
        />
    );
});
PlayerImagenItem.displayName = 'PlayerImagenItem';

export default function AuthenticatedLayout({ children }) {
    const { auth } = usePage().props;
    const usuario = auth.user;
    const [showingMobileMenu, setShowingMobileMenu] = useState(false);
    const [isQueueVisible, setIsQueueVisible] = useState(false);

    const playerContextValue = useContext(PlayerContext);
    const {
        currentTrack,
        currentTrackIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffled,
        isLooping,
        isLoading,
        playerError,
        sourceId,
        play = () => {},
        pause = () => {},
        nextTrack = () => {},
        previousTrack = () => {},
        seek = () => {},
        setVolume = () => {},
        toggleShuffle = () => {},
        toggleLoop = () => {},
        playFromQueue = () => {},
        clearPlayerError = () => {},
        queue = []
    } = playerContextValue || {};

    const queueButtonRef = useRef(null);
    const queueDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (queueDropdownRef.current && !queueDropdownRef.current.contains(event.target) &&
                queueButtonRef.current && !queueButtonRef.current.contains(event.target)) {
                setIsQueueVisible(false);
            }
        }
        if (isQueueVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isQueueVisible]);

    const [seekValue, setSeekValue] = useState(currentTime);

    useEffect(() => {
      setSeekValue(currentTime);
    }, [currentTime]);

    const handleSeekChange = (e) => {
      setSeekValue(parseFloat(e.target.value));
    };

    const commitSeek = () => {
      seek(seekValue);
    };

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const togglePlayPause = () => {
        if(!currentTrack && queue.length > 0) {
            play();
        } else if (isPlaying) {
            pause();
        } else {
            play();
        }
    };

    const CurrentVolumeIcon = useMemo(() => {
        if (volume === 0) return VolumeMuteIcon;
        if (volume < 0.5) return VolumeLowIcon;
        return VolumeIcon;
    }, [volume]);

    const progressPercent = useMemo(() => {
        return duration > 0 ? (currentTime / duration) * 100 : 0;
    }, [currentTime, duration]);

    const progressBarStyle = useMemo(() => ({
      background: `linear-gradient(to right, #007FFF ${progressPercent}%, #4a5568 ${progressPercent}%)`
    }), [progressPercent]);

    const currentTrackImageUrl = obtenerUrlImagenLayout(currentTrack);

    const currentTrackArtist = useMemo(() => {
        if (!currentTrack) return 'Artista Desconocido';
        const artistsFromUsers = currentTrack.usuarios?.map(u => u.name).join(', ');
        if (artistsFromUsers) return artistsFromUsers;
        if (currentTrack.artista) return currentTrack.artista;
        return 'Artista Desconocido';
    }, [currentTrack]);

    const handlePlayFromQueueClick = (index) => {
        playFromQueue(index);
        setIsQueueVisible(false);
    };

    const hasQueue = queue.length > 0 || currentTrack;
    const mainPaddingBottom = hasQueue ? 'pb-24 md:pb-28' : 'pb-5';

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md shadow-lg text-white">
                 <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                     <div className="flex-1 flex justify-start">
                         <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                             <ApplicationLogo className="h-8 w-auto" />
                         </Link>
                     </div>
                     <div className="flex-none hidden md:flex justify-center">
                         <nav className="flex space-x-6 items-center">
                             <Link href={route('biblioteca')} className="hover:text-blue-400 transition-colors">Biblioteca</Link>
                             <Link href={route('canciones.index')} className="hover:text-blue-400 transition-colors">Canciones</Link>
                             <Link href={route('playlists.index')} className="hover:text-blue-400 transition-colors">Playlists</Link>
                             <Link href={route('albumes.index')} className="hover:text-blue-400 transition-colors">Álbumes</Link>
                             <Link href={route('eps.index')} className="hover:text-blue-400 transition-colors">Eps</Link>
                             <Link href={route('singles.index')} className="hover:text-blue-400 transition-colors">Singles</Link>
                         </nav>
                     </div>
                     <div className="flex-1 flex justify-end items-center space-x-4">
                        {usuario ? (
                             <div className="hidden sm:flex sm:items-center sm:ml-6">
                                 <div className="ml-3 relative">
                                     <Dropdown>
                                         <Dropdown.Trigger>
                                             <span className="inline-flex rounded-md">
                                                 <button
                                                     type="button"
                                                     className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-300 hover:text-blue-400 focus:outline-none transition ease-in-out duration-150"
                                                 >
                                                     {usuario.name}
                                                     <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                         <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                                                     </svg>
                                                 </button>
                                             </span>
                                         </Dropdown.Trigger>
                                         <Dropdown.Content>
                                             <Dropdown.Link href={route('profile.index')}>Perfil</Dropdown.Link>
                                             <Dropdown.Link href={route('logout')} method="post" as="button">Logout</Dropdown.Link>
                                         </Dropdown.Content>
                                     </Dropdown>
                                 </div>
                             </div>
                         ) : (
                             <div className="hidden sm:flex space-x-4">
                                 <Link href={route('login')} className="hover:text-blue-400 transition-colors text-sm">Iniciar Sesión</Link>
                                 <Link href={route('register')} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">Registrarse</Link>
                             </div>
                         )}
                         <div className="flex items-center md:hidden">
                             <button onClick={() => setShowingMobileMenu(!showingMobileMenu)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white transition duration-150 ease-in-out">
                                 <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                     <path className={!showingMobileMenu ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                     <path className={showingMobileMenu ? 'inline-flex' : 'hidden'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                 </svg>
                             </button>
                         </div>
                    </div>
                </div>

                 <div className={(showingMobileMenu ? 'block' : 'hidden') + ' md:hidden border-t border-gray-700'}>
                     <div className="pt-2 pb-3 space-y-1 px-2">
                        <Link href={route('biblioteca')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Biblioteca</Link>
                        <Link href={route('canciones.index')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Canciones</Link>
                        <Link href={route('playlists.index')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Playlists</Link>
                        <Link href={route('albumes.index')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Álbumes</Link>
                         <Link href={route('eps.index')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Eps</Link>
                         <Link href={route('singles.index')} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">Singles</Link>
                     </div>
                    {usuario ? (
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
                     ) : (
                         <div className="pt-4 pb-3 border-t border-gray-700 px-2 space-y-2">
                             <Link href={route('login')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
                                 Iniciar Sesión
                             </Link>
                             <Link href={route('register')} className="block w-full text-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                                 Registrarse
                             </Link>
                         </div>
                     )}
                 </div>
            </header>

            <main className={`pt-16 ${mainPaddingBottom}`}>
                {children}
            </main>

           {hasQueue && (
            <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-black via-gray-900/95 to-black backdrop-blur-lg border-t border-blue-500/30 text-white shadow-lg flex flex-col">
                {playerError && (
                    <div className="bg-red-800/80 text-white text-xs text-center py-1 px-4 flex justify-between items-center">
                        <span>{playerError}</span>
                        <button onClick={clearPlayerError} className="p-0.5 hover:bg-red-700 rounded-full focus:outline-none focus:ring-1 focus:ring-white" aria-label="Cerrar error">
                            <XCircleIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}

                 <div className="w-full px-2 pt-1 md:hidden">
                     <input
                         type="range"
                         min="0"
                         max={duration || 0}
                         value={seekValue}
                         onChange={handleSeekChange}
                         onMouseUp={commitSeek}
                         onTouchEnd={commitSeek}
                         disabled={!currentTrack || !duration || isLoading}
                         aria-label="Progreso de la canción"
                         className="w-full h-1 rounded-lg appearance-none cursor-pointer range-progress-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                         style={progressBarStyle}
                     />
                 </div>

                 <div className="container mx-auto w-full px-3 sm:px-4 py-2 flex items-center justify-between space-x-2 sm:space-x-3">
                     <div className="flex items-center space-x-2 flex-1 min-w-0 md:flex-initial md:w-1/4 lg:w-1/3 md:space-x-3">
                         <PlayerImagenItem
                             url={currentTrackImageUrl}
                             titulo={currentTrack?.titulo || ''}
                             className="w-10 h-10 md:w-12 md:h-12"
                         />
                         <div className="overflow-hidden hidden sm:block">
                             <p className="text-sm font-medium text-blue-400 truncate" title={currentTrack?.titulo || 'Ninguna Canción'}>
                                 {currentTrack?.titulo || 'Ninguna Canción'}
                             </p>
                             <p className="text-xs text-gray-400 truncate hidden md:block" title={currentTrackArtist}>
                                 {currentTrackArtist}
                             </p>
                         </div>
                     </div>

                     <div className="flex flex-col items-center md:flex-grow">
                         <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                             <button
                                 onClick={toggleShuffle}
                                 title={isShuffled ? "Desactivar aleatorio" : "Activar aleatorio"}
                                 aria-label={isShuffled ? "Desactivar aleatorio" : "Activar aleatorio"}
                                 className={`p-1 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 inline-flex ${isShuffled ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                             >
                                 <ShuffleIcon className="h-5 w-5"/>
                             </button>
                             <button
                                 onClick={previousTrack}
                                 disabled={queue.length <= 1 || isLoading}
                                 aria-label="Canción anterior"
                                 className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 p-1"
                             >
                                 <PreviousIcon className="h-5 w-5" />
                             </button>
                             <button
                                 onClick={togglePlayPause}
                                 disabled={(!currentTrack && queue.length === 0) || isLoading}
                                 aria-label={isPlaying ? "Pausar" : "Reproducir"}
                                 className="bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                             >
                                 {isLoading ? <LoadingIcon className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" /> : (isPlaying ? <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />)}
                             </button>
                             <button
                                 onClick={nextTrack}
                                 disabled={queue.length <= 1 || isLoading}
                                 aria-label="Siguiente canción"
                                 className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 p-1"
                             >
                                 <NextIcon className="h-5 w-5" />
                             </button>
                               <button
                                 onClick={toggleLoop}
                                 title={isLooping ? "Desactivar repetición" : "Activar repetición"}
                                 aria-label={isLooping ? "Desactivar repetición" : "Activar repetición"}
                                 className={`p-1 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 inline-flex ${isLooping ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                             >
                                 <LoopIcon className="h-5 w-5"/>
                             </button>
                         </div>

                         <div className="w-full max-w-xl hidden md:flex items-center space-x-2 mt-1">
                             <span className="text-xs text-gray-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                             <input
                                 type="range"
                                 min="0"
                                 max={duration || 0}
                                 value={seekValue}
                                 onChange={handleSeekChange}
                                 onMouseUp={commitSeek}
                                 onTouchEnd={commitSeek}
                                 disabled={!currentTrack || !duration || isLoading}
                                 aria-label="Progreso de la canción"
                                 className="w-full h-1.5 rounded-lg appearance-none cursor-pointer range-progress-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                                 style={progressBarStyle}
                             />
                             <span className="text-xs text-gray-500 font-mono w-10 text-left">{formatTime(duration)}</span>
                         </div>
                     </div>

                     <div className="flex items-center justify-end space-x-2 flex-1 md:flex-initial md:w-1/4 lg:w-1/3">
                         <div className="hidden lg:flex items-center space-x-2">
                             <button className="text-gray-400 hover:text-blue-400 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900" aria-label="Volumen">
                                 <CurrentVolumeIcon className="h-5 w-5" />
                             </button>
                             <input
                                 type="range"
                                 min="0"
                                 max="1"
                                 step="0.01"
                                 value={volume}
                                 onChange={handleVolumeChange}
                                 aria-label="Control de volumen"
                                 className="w-20 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-blue-500 hover:accent-blue-400"
                                />
                         </div>
                         <button
                             ref={queueButtonRef}
                             onClick={() => setIsQueueVisible(!isQueueVisible)}
                             title="Mostrar cola de reproducción"
                             aria-label="Mostrar cola de reproducción"
                             className="text-gray-400 hover:text-blue-400 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                         >
                             <QueueListIcon className="h-5 w-5" />
                         </button>

                           {isQueueVisible && (
                               <div
                                   ref={queueDropdownRef}
                                   className="absolute bottom-full right-0 mb-2 w-64 sm:w-80 max-h-80 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-2"
                               >
                                   <h4 className="text-sm font-semibold text-gray-300 px-2 pb-2 border-b border-slate-600 mb-2">Cola de Reproducción</h4>
                                   {queue.length > 0 ? (
                                       <ul className="space-y-1">
                                           {queue.map((song, index) => (
                                               <li key={`${song.id}-${index}`}
                                                   className={`flex items-center justify-between p-2 rounded cursor-pointer group ${index === currentTrackIndex ? 'bg-blue-900/50' : 'hover:bg-slate-700/70'}`}
                                                   onClick={() => handlePlayFromQueueClick(index)}
                                               >
                                                   <div className="flex items-center space-x-2 overflow-hidden">
                                                       <PlayerImagenItem
                                                           url={obtenerUrlImagenLayout(song)}
                                                           titulo={song.titulo}
                                                           className="w-8 h-8"
                                                           iconoFallback={<MusicalNoteIcon className="h-4 w-4"/>}
                                                           isQueueItem={true}
                                                       />
                                                       <div className="overflow-hidden">
                                                           <p className={`text-xs truncate ${index === currentTrackIndex ? 'text-blue-300 font-semibold' : 'text-gray-200 group-hover:text-white'}`} title={song.titulo}>
                                                               {song.titulo}
                                                           </p>
                                                           <p className={`text-xs truncate ${index === currentTrackIndex ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`} title={song.usuarios?.map(u => u.name).join(', ') || song.artista || ''}>
                                                                {song.usuarios?.map(u => u.name).join(', ') || song.artista || 'Artista Desconocido'}
                                                           </p>
                                                       </div>
                                                   </div>
                                                   {isPlaying && index === currentTrackIndex && (
                                                       <PauseIcon className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2"/>
                                                   )}
                                                   {!isPlaying && index === currentTrackIndex && (
                                                       <PlayIcon className="h-4 w-4 text-blue-400 flex-shrink-0 ml-2"/>
                                                   )}
                                               </li>
                                           ))}
                                       </ul>
                                   ) : (
                                       <p className="text-xs text-gray-400 italic px-2 py-1">La cola está vacía.</p>
                                   )}
                               </div>
                           )}
                     </div>
                 </div>
            </footer>
           )}
        </div>
    );
}
