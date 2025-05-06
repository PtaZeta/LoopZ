import React, { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';

const getAudioUrl = (song) => {
    if (!song?.archivo_url) return null;
    return song.archivo_url.startsWith('http')
        ? song.archivo_url
        : `/storage/${song.archivo_url}`;
};

const shuffleArray = (array) => {
    let currentIndex = array.length;
    let randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex],
            newArray[currentIndex],
        ];
    }
    return newArray;
};

const PlayerContext = createContext();
export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
    const [originalQueue, setOriginalQueue] = useState([]);
    const [shuffledQueue, setShuffledQueue] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [sourceId, setSourceId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [playerError, setPlayerError] = useState(null);

    const audioRef = useRef(null);

    useEffect(() => {
        const storedVolume = sessionStorage.getItem('player_volume');
        const storedShuffle = sessionStorage.getItem('player_isShuffled');
        const storedLoop = sessionStorage.getItem('player_isLooping');
        if (storedVolume !== null) setVolume(Number(storedVolume));
        if (storedShuffle !== null) setIsShuffled(storedShuffle === 'true');
        if (storedLoop !== null) setIsLooping(storedLoop === 'true');
    }, []);

    useEffect(() => {
        sessionStorage.setItem('player_volume', volume);
    }, [volume]);

    useEffect(() => {
        sessionStorage.setItem('player_isShuffled', isShuffled);
    }, [isShuffled]);

    useEffect(() => {
        sessionStorage.setItem('player_isLooping', isLooping);
    }, [isLooping]);

    const activeQueue = isShuffled ? shuffledQueue : originalQueue;
    const currentTrack = activeQueue[currentTrackIndex] || null;

    const clearPlayerError = useCallback(() => setPlayerError(null), []);

    const resetPlayer = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setOriginalQueue([]);
        setShuffledQueue([]);
        setCurrentTrackIndex(-1);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setSourceId(null);
        setIsLoading(false);
        clearPlayerError();
        sessionStorage.removeItem('player_currentTrackIndex');
    }, [clearPlayerError]);

    const play = useCallback(() => {
        clearPlayerError();
        if (audioRef.current && currentTrack) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                setIsLoading(true);
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        // Confiamos en el evento 'onPlaying' o 'onCanPlay' para setIsLoading(false)
                    })
                    .catch(() => {
                        setIsPlaying(false);
                        setIsLoading(false);
                        setPlayerError(`No se pudo reproducir: ${currentTrack.titulo}.`);
                    });
            } else {
                setIsPlaying(true);
                // Para navegadores antiguos, también confiamos en eventos de audio.
            }
        } else if (activeQueue.length > 0) {
            setIsLoading(true);
            setCurrentTrackIndex((i) => (i === -1 ? 0 : i));
            setIsPlaying(true);
        }
    }, [currentTrack, activeQueue, clearPlayerError, isPlaying]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
        setIsPlaying(false);
        setIsLoading(false);
    }, []);

    const nextTrack = useCallback(() => {
        if (!activeQueue.length) return;
        clearPlayerError();
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex >= activeQueue.length) {
            if (isLooping) {
                setIsLoading(true);
                setCurrentTrackIndex(0);
                setIsPlaying(true);
            } else resetPlayer();
        } else {
            setIsLoading(true);
            setCurrentTrackIndex(nextIndex);
            setIsPlaying(true);
        }
    }, [activeQueue, currentTrackIndex, isLooping, clearPlayerError, resetPlayer]);

    const previousTrack = useCallback(() => {
        if (!activeQueue.length) return;
        clearPlayerError();
        setIsLoading(true);
        setCurrentTrackIndex((prev) => (prev - 1 + activeQueue.length) % activeQueue.length);
        setIsPlaying(true);
    }, [activeQueue, clearPlayerError]);

    const seek = useCallback(
        (time) => {
            if (audioRef.current && isFinite(time) && duration > 0) {
                clearPlayerError();
                const newTime = Math.max(0, Math.min(time, duration));
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
            }
        },
        [duration, clearPlayerError]
    );

    const setVolumeCallback = useCallback((v) => setVolume(Math.max(0, Math.min(1, v))), []);

    const loadQueueAndPlay = useCallback(
        (songs, options = {}) => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            setIsPlaying(false);
            setIsLoading(false);
            setCurrentTime(0);
            setDuration(0);
            clearPlayerError();

            const validSongs = songs.filter((s) => s.id && s.titulo && getAudioUrl(s));

            if (!validSongs.length) {
                return resetPlayer();
            }

            setIsLoading(true);
            setOriginalQueue(validSongs);
            setSourceId(options.id || null);

            let queueToUse;
            let startIdx;

            if (isShuffled) {
                const requestedStartIndex = options.startIndex;
                const isDirectClick = options.isDirectClick === true;

                if (isDirectClick && typeof requestedStartIndex === 'number' && requestedStartIndex >= 0 && requestedStartIndex < validSongs.length) {
                    const clickedSong = validSongs[requestedStartIndex];
                    const songsToShuffle = validSongs.filter((song, index) => index !== requestedStartIndex);
                    const shuffledRest = shuffleArray(songsToShuffle);
                    const newShuffledQueue = [clickedSong, ...shuffledRest];
                    setShuffledQueue(newShuffledQueue);
                    queueToUse = newShuffledQueue;
                    startIdx = 0;
                } else {
                    const shuffled = shuffleArray(validSongs);
                    setShuffledQueue(shuffled);
                    queueToUse = shuffled;
                    startIdx = 0;
                }
            } else {
                setShuffledQueue([]);
                queueToUse = validSongs;
                startIdx = options.startIndex ?? 0;
            }

            const finalStartIndex = Math.max(0, Math.min(startIdx, queueToUse.length - 1));
            setCurrentTrackIndex(finalStartIndex);
            setIsPlaying(true);
        },
        [isShuffled, clearPlayerError, resetPlayer]
    );


    const toggleShuffle = useCallback(() => {
        clearPlayerError();
        const next = !isShuffled;
        setIsShuffled(next);
        if (originalQueue.length) {
            const currentId = currentTrack?.id;
            if (next) {
                const shuffled = shuffleArray(originalQueue);
                setShuffledQueue(shuffled);
                setCurrentTrackIndex(shuffled.findIndex((t) => t.id === currentId) ?? 0);
            } else {
                setShuffledQueue([]);
                setCurrentTrackIndex(originalQueue.findIndex((t) => t.id === currentId) ?? 0);
            }
        } else setCurrentTrackIndex(-1);
    },[originalQueue, currentTrack, isShuffled, clearPlayerError]);

    const toggleLoop = useCallback(() => { clearPlayerError(); setIsLooping((l) => !l); },[clearPlayerError]);
    const playFromQueue = useCallback((i) => { clearPlayerError(); setCurrentTrackIndex(i); setIsPlaying(true); },[clearPlayerError]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const track = currentTrack;
        if (track) {
            const url = getAudioUrl(track);
            if (!audio.src || audio.src !== url) {
                setIsLoading(true);
                audio.src = url;
                audio.currentTime = 0;
                setCurrentTime(0);
                setDuration(0);
                if (isPlaying) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch((err) => {
                            if (track.id === (activeQueue[currentTrackIndex]?.id)) {
                                setPlayerError(`No se pudo reproducir: ${track.titulo}.`);
                                setIsPlaying(false);
                                setIsLoading(false);
                            }
                        });
                    }
                } else {
                    // Si no está reproduciendo, solo se carga.
                    // El evento 'canplay' se encargará de setIsLoading(false).
                    // audio.pause(); // Cambiar src ya detiene la reproducción.
                }
            } else if (isPlaying && audio.paused) {
                 audio.play().catch((err) => {
                    if (track.id === (activeQueue[currentTrackIndex]?.id)) {
                        setPlayerError(`Error al reanudar: ${track.titulo}.`);
                        setIsPlaying(false);
                        setIsLoading(false);
                    }
                 });
            } else if (!isPlaying && !audio.paused) {
                 audio.pause();
            }
        } else {
            audio.pause();
            if (audio.src) {
                audio.removeAttribute('src');
                audio.load();
            }
            setIsLoading(false);
            setCurrentTime(0);
            setDuration(0);
        }
    },[currentTrack, isPlaying, activeQueue, currentTrackIndex]);


    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        const onTimeUpdate = () => {
            if (isFinite(audio.currentTime)) {
                setCurrentTime(audio.currentTime);
            }
        };
        const onLoaded = () => {
            if (!isNaN(audio.duration) && isFinite(audio.duration)) {
               setDuration(audio.duration);
            } else {
               setDuration(0);
            }
        };
        const onCanPlay = () => setIsLoading(false);
        const onPlaying = () => setIsLoading(false); // AÑADIDO: handler para 'playing'
        const onWaiting = () => setIsLoading(true);
        const onEnded = () => nextTrack();
        const onError = (e) => {
            setIsLoading(false);
            setIsPlaying(false);
            if (audio.src && audio.src === getAudioUrl(currentTrack)) {
                let errorMsg = 'Error en reproducción.';
                if (e?.target?.error?.code) {
                    switch (e.target.error.code) {
                        case e.target.error.MEDIA_ERR_ABORTED: errorMsg = 'Reproducción abortada.'; break;
                        case e.target.error.MEDIA_ERR_NETWORK: errorMsg = 'Error de red.'; break;
                        case e.target.error.MEDIA_ERR_DECODE: errorMsg = 'Error de decodificación.'; break;
                        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMsg = 'Formato no soportado.'; break;
                        default: errorMsg = `Error desconocido (${e.target.error.code}).`; break;
                    }
                }
                setPlayerError(errorMsg);
            }
       };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('playing', onPlaying); // AÑADIDO: listener para 'playing'
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('playing', onPlaying); // AÑADIDO: remover listener
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
        };
    },[nextTrack, currentTrack]);

    const value = {
        queue: activeQueue,
        originalQueue,
        currentTrackIndex,
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffled,
        isLooping,
        sourceId,
        isLoading,
        playerError,
        loadQueueAndPlay,
        play,
        pause,
        nextTrack,
        previousTrack,
        seek,
        setVolume: setVolumeCallback,
        toggleShuffle,
        toggleLoop,
        playFromQueue,
        clearPlayerError,
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
            <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
        </PlayerContext.Provider>
    );
};

export { PlayerContext };
