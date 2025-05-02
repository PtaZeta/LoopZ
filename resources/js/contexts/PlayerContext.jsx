import React, { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';

const getAudioUrl = (song) => {
    if (!song?.archivo_url) return null;
    return song.archivo_url.startsWith('http')
        ? song.archivo_url
        : `/storage/${song.archivo_url}`;
}

const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
}

export const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
    const [originalQueue, setOriginalQueue] = useState([]);
    const [shuffledQueue, setShuffledQueue] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [sourceId, setSourceId] = useState(null);

    const audioRef = useRef(null);

    const activeQueue = isShuffled ? shuffledQueue : originalQueue;
    const currentTrack = activeQueue[currentTrackIndex] || null;

    useEffect(() => {
        if (audioRef.current && currentTrack) {
            const audioUrl = getAudioUrl(currentTrack);
            if (audioUrl && audioRef.current.src !== audioUrl) {
                audioRef.current.src = audioUrl;
                setCurrentTime(0);
                setDuration(0);
                 // Autoplay only if src changed and isPlaying is true
                 if (isPlaying) {
                    audioRef.current.play().catch(e => {
                        console.error("Error playing audio after src change:", e);
                        setIsPlaying(false);
                    });
                 }
            } else if (audioRef.current.src && isPlaying && audioRef.current.paused) {
                 // If src is same but paused, play
                 audioRef.current.play().catch(e => {
                     console.error("Error resuming audio:", e);
                     setIsPlaying(false);
                 });
            } else if (!isPlaying && !audioRef.current.paused) {
                 audioRef.current.pause();
            }
        } else if (!currentTrack && activeQueue.length === 0) {
            if(audioRef.current) audioRef.current.src = "";
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            setCurrentTrackIndex(-1);
            setSourceId(null);
        }
    }, [currentTrack, isPlaying]); // Depend on currentTrack and isPlaying

     useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const play = useCallback(() => {
        if (audioRef.current && currentTrack) {
            setIsPlaying(true);
        } else if (activeQueue.length > 0 && currentTrackIndex === -1) {
            setCurrentTrackIndex(0);
            setIsPlaying(true);
        } else if (activeQueue.length > 0 && currentTrackIndex >= 0) {
             // If a track is selected but paused
             setIsPlaying(true);
        }
    }, [currentTrack, activeQueue, currentTrackIndex]);

    const pause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const nextTrack = useCallback(() => {
        if (activeQueue.length === 0) return;
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex >= activeQueue.length) {
            if (isLooping) {
                setCurrentTrackIndex(0);
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
                // Don't reset index here, keep it at the end until explicitly changed
                // setCurrentTrackIndex(-1);
                setCurrentTime(0);
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.pause(); // Ensure it stops
                }
            }
        } else {
            setCurrentTrackIndex(nextIndex);
            setIsPlaying(true);
        }
    }, [activeQueue, currentTrackIndex, isLooping]);

    const previousTrack = useCallback(() => {
         if (activeQueue.length === 0) return;
         const prevIndex = (currentTrackIndex - 1 + activeQueue.length) % activeQueue.length;
         setCurrentTrackIndex(prevIndex);
         setIsPlaying(true);
    }, [activeQueue, currentTrackIndex]);

    const seek = useCallback((time) => {
        if (audioRef.current && isFinite(time) && duration > 0) {
             const newTime = Math.max(0, Math.min(time, duration));
             audioRef.current.currentTime = newTime;
             setCurrentTime(newTime);
        }
    }, [duration]);

    const setVolumeCallback = useCallback((newVolume) => {
        setVolume(Math.max(0, Math.min(1, newVolume)));
    }, []);

    const loadQueueAndPlay = useCallback((songs, options = {}) => {
        const { startIndex = 0, id = null } = options;
        const validSongs = songs.filter(s => s && s.id && s.titulo && getAudioUrl(s));

         if (validSongs.length > 0) {
             const wasPlaying = isPlaying; // Store if it was playing before load
             const wasShuffled = isShuffled; // Store shuffle state

             setOriginalQueue(validSongs);
             setSourceId(id);
             const validStartIndex = Math.max(0, Math.min(startIndex, validSongs.length - 1));

             if (wasShuffled) {
                 const shuffled = shuffleArray(validSongs);
                 setShuffledQueue(shuffled);
                 const startSongId = validSongs[validStartIndex]?.id;
                 const shuffledIndex = shuffled.findIndex(s => s.id === startSongId);
                 setCurrentTrackIndex(shuffledIndex !== -1 ? shuffledIndex : 0);
             } else {
                 setShuffledQueue([]);
                 setCurrentTrackIndex(validStartIndex);
             }
             // Only set isPlaying if it wasn't already playing OR if the source changes
             // Or simply always start playing when loading a new queue
             setIsPlaying(true);
         } else {
             setOriginalQueue([]);
             setShuffledQueue([]);
             setCurrentTrackIndex(-1);
             setIsPlaying(false);
             setSourceId(null);
             // Keep shuffle state as is? Or reset? Resetting seems safer.
             // setIsShuffled(false);
             if (audioRef.current) audioRef.current.src = '';
             console.warn("Attempted to load an empty or invalid song queue.");
         }
    }, [isShuffled, isPlaying]); // isPlaying dependency removed to avoid loops, isShuffled added

    const toggleShuffle = useCallback(() => {
        const currentTrackId = activeQueue[currentTrackIndex]?.id; // Get ID before state change

        setIsShuffled(prevIsShuffled => {
            const nextIsShuffled = !prevIsShuffled;
            let newIndex = currentTrackIndex; // Default to current index

            if (nextIsShuffled) {
                // Shuffle the original queue
                const newShuffledQueue = shuffleArray(originalQueue);
                setShuffledQueue(newShuffledQueue);
                // Find the current song in the new shuffled queue
                newIndex = newShuffledQueue.findIndex(track => track.id === currentTrackId);
            } else {
                // Find the current song in the original queue
                newIndex = originalQueue.findIndex(track => track.id === currentTrackId);
                setShuffledQueue([]); // Clear shuffled queue when turning off
            }

            // Update index only if the song was found in the new queue structure
            // If not found (e.g., queue was empty or song removed), reset or handle appropriately
            if (newIndex !== -1) {
                setCurrentTrackIndex(newIndex);
            } else if (originalQueue.length > 0) {
                 // If current track wasn't found but queue exists, maybe go to 0?
                 setCurrentTrackIndex(0);
            } else {
                 setCurrentTrackIndex(-1); // If queue is empty
            }

            return nextIsShuffled;
        });
    }, [originalQueue, activeQueue, currentTrackIndex]); // Depend on activeQueue and index

    const toggleLoop = useCallback(() => {
        setIsLooping(prev => !prev);
    }, []);

    const playFromQueue = useCallback((index) => {
        if (index >= 0 && index < activeQueue.length) {
            setCurrentTrackIndex(index);
            setIsPlaying(true);
        }
    }, [activeQueue]);

    const handleTimeUpdate = useCallback(() => {
         if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
         }
    }, []);
    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    }, []);
    const handleEnded = useCallback(() => {
        nextTrack();
    }, [nextTrack]);
    const handleError = useCallback((e) => {
        console.error("Audio Error:", e);
        setIsPlaying(false);
    }, []);

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
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={handleError}
                style={{ display: 'none' }}
            />
        </PlayerContext.Provider>
    );
};
