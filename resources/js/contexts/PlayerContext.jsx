import React, { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';
import { obtenerCancionesRecomendadas } from '@/hooks/useRecomendaciones';

const DEBUG = true;
const getAudioUrl = (song) => {
  if (!song?.archivo_url) return null;
  return song.archivo_url.startsWith('http') ? song.archivo_url : `/storage/${song.archivo_url}`;
};
const shuffleArray = (array) => {
  let currentIndex = array.length;
  const newArray = [...array];
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
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
    const vol = sessionStorage.getItem('player_volume');
    const shf = sessionStorage.getItem('player_isShuffled');
    const lop = sessionStorage.getItem('player_isLooping');
    if (vol !== null) setVolume(Number(vol));
    if (shf !== null) setIsShuffled(shf === 'true');
    if (lop !== null) setIsLooping(lop === 'true');
  }, []);
  useEffect(() => sessionStorage.setItem('player_volume', volume), [volume]);
  useEffect(() => sessionStorage.setItem('player_isShuffled', isShuffled), [isShuffled]);
  useEffect(() => sessionStorage.setItem('player_isLooping', isLooping), [isLooping]);

  const activeQueue = isShuffled ? shuffledQueue : originalQueue;
  const currentTrack = activeQueue[currentTrackIndex] || null;
  const clearPlayerError = useCallback(() => setPlayerError(null), []);

  const resetPlayer = useCallback(() => {
    if (DEBUG) console.log('[Player] resetPlayer()');
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
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        setIsLoading(true);
        promise.then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
          setPlayerError(`No se pudo reproducir: ${currentTrack.titulo}.`);
        });
      } else setIsPlaying(true);
    } else if (activeQueue.length > 0) {
      setIsLoading(true);
      setCurrentTrackIndex((i) => (i === -1 ? 0 : i));
      setIsPlaying(true);
    }
  }, [currentTrack, activeQueue, clearPlayerError]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && isFinite(time) && duration > 0) {
      clearPlayerError();
      const newTime = Math.max(0, Math.min(time, duration));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration, clearPlayerError]);

  const setVolumeCallback = useCallback((v) => setVolume(Math.max(0, Math.min(1, v))), []);

  const fetchMore = useCallback(async () => {
    if (!currentTrack) return;
    if (DEBUG) console.log('[Player] fetchMore() - semilla:', currentTrack.id);
    const more = await obtenerCancionesRecomendadas(currentTrack.id);
    if (DEBUG) console.log('[Player] recomendaciones recibidas:', more.length);
    const filtered = more.filter(s => !originalQueue.some(o => o.id === s.id));
    if (DEBUG) console.log('[Player] filtradas (nuevas):', filtered.length);
    if (!filtered.length) return;
    setOriginalQueue(orig => {
      const updated = [...orig, ...filtered];
      if (isShuffled) setShuffledQueue(shuffleArray(updated));
      return updated;
    });
  }, [currentTrack, originalQueue, isShuffled]);

  const nextTrack = useCallback(async () => {
    if (DEBUG) console.log('[Player] nextTrack()', currentTrackIndex, 'de', activeQueue.length);
    if (!activeQueue.length) return;
    clearPlayerError();
    const nextIndex = currentTrackIndex + 1;
    if (nextIndex < activeQueue.length) {
      if (DEBUG) console.log('[Player] Avanzando a pista', nextIndex);
      setIsLoading(true);
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
      return;
    }
    if (isLooping) {
      if (DEBUG) console.log('[Player] Loop activo, reiniciando a 0');
      setIsLoading(true);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      return;
    }
    if (DEBUG) console.log('[Player] Cola terminada, solicitando más');
    setIsLoading(true);
    const more = await obtenerCancionesRecomendadas(currentTrack.id);
    if (DEBUG) console.log('[Player] recomendaciones tras cola:', more.length);
    const toAdd = more.filter(s => !originalQueue.some(o => o.id === s.id));
    if (DEBUG) console.log('[Player] nuevas a añadir:', toAdd.length);
    if (toAdd.length) {
      setOriginalQueue(orig => {
        const updated = [...orig, ...toAdd];
        if (isShuffled) setShuffledQueue(shuffleArray(updated));
        return updated;
      });
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
    } else {
      if (DEBUG) console.log('[Player] Sin más recomendaciones, reset');
      resetPlayer();
    }
  }, [activeQueue.length, clearPlayerError, currentTrack, currentTrackIndex, isLooping, isShuffled, originalQueue, resetPlayer]);

  const previousTrack = useCallback(() => {
    if (!activeQueue.length) return;
    clearPlayerError();
    setIsLoading(true);
    setCurrentTrackIndex((prev) => (prev - 1 + activeQueue.length) % activeQueue.length);
    setIsPlaying(true);
  }, [activeQueue, clearPlayerError]);

  const loadQueueAndPlay = useCallback((songs, options = {}) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(0);
    setDuration(0);
    clearPlayerError();
    const validSongs = songs.filter(s => s.id && s.titulo && getAudioUrl(s));
    if (!validSongs.length) return resetPlayer();
    setIsLoading(true);
    setOriginalQueue(validSongs);
    setSourceId(options.id || null);
    let queueToUse, startIdx;
    if (isShuffled) {
      const reqIdx = options.startIndex;
      const direct = options.isDirectClick === true;
      if (direct && Number.isInteger(reqIdx) && reqIdx >= 0 && reqIdx < validSongs.length) {
        const clicked = validSongs[reqIdx];
        const rest = validSongs.filter((_, i) => i !== reqIdx);
        const shuffledRest = shuffleArray(rest);
        queueToUse = [clicked, ...shuffledRest];
      } else queueToUse = shuffleArray(validSongs);
      setShuffledQueue(queueToUse);
      startIdx = 0;
    } else {
      setShuffledQueue([]);
      queueToUse = validSongs;
      startIdx = options.startIndex ?? 0;
    }
    const finalStart = Math.max(0, Math.min(startIdx, queueToUse.length - 1));
    setCurrentTrackIndex(finalStart);
    setIsPlaying(true);
  }, [isShuffled, clearPlayerError, resetPlayer]);

  const toggleShuffle = useCallback(() => {
    clearPlayerError();
    const next = !isShuffled;
    setIsShuffled(next);
    if (originalQueue.length) {
      const currentId = currentTrack?.id;
      if (next) {
        const shuffled = shuffleArray(originalQueue);
        setShuffledQueue(shuffled);
        setCurrentTrackIndex(shuffled.findIndex(t => t.id === currentId) || 0);
      } else {
        setShuffledQueue([]);
        setCurrentTrackIndex(originalQueue.findIndex(t => t.id === currentId) || 0);
      }
    } else setCurrentTrackIndex(-1);
  }, [originalQueue, currentTrack, isShuffled, clearPlayerError]);

  const toggleLoop = useCallback(() => { clearPlayerError(); setIsLooping(l => !l); }, [clearPlayerError]);
  const playFromQueue = useCallback(i => { clearPlayerError(); setCurrentTrackIndex(i); setIsPlaying(true); }, [clearPlayerError]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = currentTrack;
    if (track) {
      const url = getAudioUrl(track);
      if (audio.src !== url) {
        setIsLoading(true);
        audio.src = url;
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);
        if (isPlaying) audio.play().catch(() => {
          setPlayerError(`Error al reanudar: ${track.titulo}.`);
          setIsPlaying(false);
          setIsLoading(false);
        });
      } else if (isPlaying && audio.paused) audio.play();
      else if (!isPlaying && !audio.paused) audio.pause();
    } else {
      audio.pause();
      if (audio.src) { audio.removeAttribute('src'); audio.load(); }
      setIsLoading(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onCanPlay = () => setIsLoading(false);
    const onPlaying = () => setIsLoading(false);
    const onWaiting = () => setIsLoading(true);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', e => {
      setIsLoading(false);
      setIsPlaying(false);
      let msg = 'Error en reproducción.';
      switch (e.target.error?.code) {
        case e.target.error.MEDIA_ERR_ABORTED: msg = 'Reproducción abortada.'; break;
        case e.target.error.MEDIA_ERR_NETWORK: msg = 'Error de red.'; break;
        case e.target.error.MEDIA_ERR_DECODE: msg = 'Error de decodificación.'; break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: msg = 'Formato no soportado.'; break;
      }
      setPlayerError(msg);
    });
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('ended', nextTrack);
    };
  }, [nextTrack]);

  useEffect(() => { if (currentTrackIndex >= activeQueue.length - 2) fetchMore(); }, [currentTrackIndex, activeQueue.length, fetchMore]);

  return (
    <PlayerContext.Provider value={{
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
    }}>
      {children}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
    </PlayerContext.Provider>
  );
};

export { PlayerContext };
