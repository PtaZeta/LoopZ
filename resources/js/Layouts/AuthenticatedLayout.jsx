import React, { useState, useContext, memo, useEffect, useMemo, useRef, useCallback } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PlayerContext } from '@/contexts/PlayerContext';
import { MusicalNoteIcon, ArrowsRightLeftIcon, ArrowPathIcon as LoopIcon, QueueListIcon } from '@heroicons/react/24/outline';

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
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9v6h3.75l5.25 5.25V3.75L7.5 9H3.75zm11.04 3c0-1.1-.6-2.1-1.54-2.6v5.2c.94-.5 1.54-1.5 1.54-2.6z" />
    </svg>
);
const VolumeMuteIcon = (props) => (
     <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M17.25 9.75 19.5 12M3.75 9v6h3.75l5.25 5.25V3.75L7.5 9H3.75Z" />
     </svg>
);
const VolumeLowIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 6.75v10.5M3.75 9v6h3.75l5.25 5.25V3.75L7.5 9H3.75Z" />
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

const PlayerImagenItem = memo(({ url, titulo, className = "w-12 h-12", iconoFallback, isQueueItem = false }) => {
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
        return (
            <div className={`${placeholderSizeClass} bg-slate-700 flex items-center justify-center text-slate-500 rounded flex-shrink-0`}>
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
        play = () => {},
        pause = () => {},
        nextTrack = () => {},
        previousTrack = () => {},
        seek = () => {},
        setVolume = () => {},
        toggleShuffle = () => {},
        toggleLoop = () => {},
        playFromQueue = () => {},
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


    const handleSeek = (e) => {
        seek(parseFloat(e.target.value));
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

    const CurrentVolumeIcon = volume === 0 ? VolumeMuteIcon : volume < 0.5 ? VolumeLowIcon : VolumeIcon;

    const progressPercent = useMemo(() => {
        return duration > 0 ? (currentTime / duration) * 100 : 0;
    }, [currentTime, duration]);

    const progressBarStyle = useMemo(() => ({
        background: `linear-gradient(to right, #007FFF ${progressPercent}%, #FF007F ${progressPercent}%, #4a5568 ${progressPercent}%)`
    }), [progressPercent]);

    const currentTrackImageUrl = obtenerUrlImagenLayout(currentTrack);
    const currentTrackArtist = currentTrack?.usuarios?.[0]?.name || currentTrack?.artista || 'Artista Desconocido';

    const handlePlayFromQueueClick = (index) => {
        playFromQueue(index);
        setIsQueueVisible(false);
    }

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

            <main className={`pt-16 ${queue.length > 0 ? 'pb-24' : 'pb-5'}`}>
                {children}
            </main>

           {queue.length > 0 && (
            <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-black via-gray-900/90 to-black backdrop-blur-lg border-t border-blue-500/30 text-white shadow-lg">
                <div className="container mx-auto px-6 py-3 flex items-center justify-between space-x-4 h-20 relative">
                    <div className="flex items-center space-x-3 w-1/4 flex-shrink-0">
                         <PlayerImagenItem url={currentTrackImageUrl} titulo={currentTrack?.titulo || ''} />
                         <div className="overflow-hidden">
                             <p className="text-sm font-semibold text-blue-400 truncate" title={currentTrack?.titulo || 'Ninguna Canción'}>{currentTrack?.titulo || 'Ninguna Canción'}</p>
                             <p className="text-xs text-gray-400 truncate" title={currentTrackArtist}>{currentTrackArtist}</p>
                         </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-grow px-4">
                        <div className="flex items-center space-x-5 mb-2">
                            <button
                                onClick={toggleShuffle}
                                title={isShuffled ? "Desactivar aleatorio" : "Activar aleatorio"}
                                className={`p-1 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isShuffled ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                            >
                                <ShuffleIcon className="h-5 w-5"/>
                            </button>
                            <button
                                onClick={previousTrack}
                                disabled={queue.length <= 1}
                                className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <PreviousIcon className="h-5 w-5" />
                            </button>
                            <button
                                onClick={togglePlayPause}
                                disabled={!currentTrack && queue.length === 0}
                                className="bg-blue-600 hover:bg-blue-500 rounded-full p-2.5 text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                            </button>
                            <button
                                onClick={nextTrack}
                                disabled={queue.length <= 1}
                                className="text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <NextIcon className="h-5 w-5" />
                            </button>
                             <button
                                onClick={toggleLoop}
                                title={isLooping ? "Desactivar repetición" : "Activar repetición"}
                                className={`p-1 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isLooping ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                            >
                                <LoopIcon className="h-5 w-5"/>
                            </button>
                        </div>
                        <div className="w-full max-w-xl flex items-center space-x-2">
                             <span className="text-xs text-gray-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                             <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek} // Changed from onInput
                                disabled={!currentTrack || !duration}
                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer range-progress-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                                style={progressBarStyle}
                             />
                             <span className="text-xs text-gray-500 font-mono w-10 text-left">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 w-1/4 flex-shrink-0 relative">
                         <button className="text-gray-400 hover:text-blue-400 transition-colors p-1">
                            <CurrentVolumeIcon className="h-5 w-5" />
                         </button>
                         <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-blue-500 hover:accent-blue-400"
                           />
                         <button
                            ref={queueButtonRef}
                            onClick={() => setIsQueueVisible(!isQueueVisible)}
                            title="Mostrar cola de reproducción"
                            className="text-gray-400 hover:text-blue-400 transition-colors p-1 ml-2"
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
                                                        <p className={`text-xs truncate ${index === currentTrackIndex ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`} title={song.usuarios?.[0]?.name || song.artista || ''}>
                                                            {song.usuarios?.[0]?.name || song.artista || 'Artista Desconocido'}
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
