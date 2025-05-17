import React, { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';
import { obtenerCancionesRecomendadas } from '@/hooks/useRecomendaciones';

const getAudioUrl = (cancion) => {
  const url = cancion?.archivo_url || null;
  console.log('[PlayerContext] URL de audio generada:', url);
  return url;
};

const arrayAleatorio = (array) => {
  let actual = array.length;
  const nuevoArray = [...array];
  while (actual !== 0) {
    const aleatorio = Math.floor(Math.random() * actual);
    actual--;
    [nuevoArray[actual], nuevoArray[aleatorio]] = [nuevoArray[aleatorio], nuevoArray[actual]];
  }
  return nuevoArray;
};

const PlayerContext = createContext();
export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [colaOriginal, setColaOriginal] = useState([]);
  const [reservasRecomendadas, setReservasRecomendadas] = useState([]);
  const [colaAleatoria, setColaAleatoria] = useState([]);
  const [cancionActualIndex, setCancionActualIndex] = useState(() => {
    const saved = sessionStorage.getItem('cancionActualIndex_player');
    console.log('[PlayerContext] Índice de canción inicial (sessionStorage):', saved);
    return saved !== null ? Number(saved) : -1;
  });
  const [Reproduciendo, setReproduciendo] = useState(false);
  const [tiempoActual, setTiempoActual] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumen, setVolumen] = useState(0.5);
  const [aleatorio, setAleatorio] = useState(false);
  const [looping, setLooping] = useState(false);
  const [sourceId, setSourceId] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const audioRef = useRef(null);
  const preloadAudioRef = useRef(null);
  const [preloadedSongIndex, setPreloadedSongIndex] = useState(null);

  useEffect(() => {
    const vol = sessionStorage.getItem('volumen_player');
    const shf = sessionStorage.getItem('aleatorio_player');
    const lop = sessionStorage.getItem('looping_player');
    console.log('[PlayerContext] Recuperando settings (vol, shf, lop):', vol, shf, lop);
    if (vol !== null) setVolumen(Number(vol));
    if (shf !== null) setAleatorio(shf === 'true');
    if (lop !== null) setLooping(lop === 'true');
  }, []);

  useEffect(() => {
    sessionStorage.setItem('volumen_player', String(volumen));
    console.log('[PlayerContext] Guardando volumen:', volumen);
  }, [volumen]);
  useEffect(() => {
    sessionStorage.setItem('aleatorio_player', String(aleatorio));
    console.log('[PlayerContext] Guardando aleatorio:', aleatorio);
  }, [aleatorio]);
  useEffect(() => {
    sessionStorage.setItem('looping_player', String(looping));
    console.log('[PlayerContext] Guardando looping:', looping);
  }, [looping]);
  useEffect(() => {
    if (cancionActualIndex >= 0) {
      sessionStorage.setItem('cancionActualIndex_player', String(cancionActualIndex));
      console.log('[PlayerContext] Guardando índice de canción actual:', cancionActualIndex);
    } else {
      sessionStorage.removeItem('cancionActualIndex_player');
      console.log('[PlayerContext] Limpiando índice de canción actual.');
    }
  }, [cancionActualIndex]);

  const limpiarErrores = useCallback(() => {
    console.log('[PlayerContext] Limpiando errores.');
    setPlayerError(null);
  }, []);

  const reiniciarPlayer = useCallback(() => {
    console.log('[PlayerContext] Reiniciando reproductor.');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (preloadAudioRef.current) {
      preloadAudioRef.current.src = '';
    }
    setColaOriginal([]);
    setReservasRecomendadas([]);
    setColaAleatoria([]);
    setCancionActualIndex(-1);
    setPreloadedSongIndex(null);
    setReproduciendo(false);
    setTiempoActual(0);
    setDuration(0);
    setSourceId(null);
    setCargando(false);
    limpiarErrores();
    sessionStorage.removeItem('cancionActualIndex_player');
  }, [limpiarErrores]);

  const colaActual = aleatorio ? colaAleatoria : colaOriginal;
  const cancionActual = colaActual[cancionActualIndex] || null;

  const play = useCallback(() => {
    console.log('[PlayerContext] Llamada a play()');
    limpiarErrores();
    const audio = audioRef.current;
    if (audio && cancionActual) {
      console.log(`[PlayerContext] Intentando reproducir: ${cancionActual.titulo}`);
      const promise = audio.play();
      if (promise !== undefined) {
        setCargando(true);
        promise
          .then(() => {
            console.log('[PlayerContext] play() Promise resuelta.');
            setReproduciendo(true);
            setCargando(false);
          })
          .catch((e) => {
            console.error('[PlayerContext] play() Promise rechazada:', e);
            setReproduciendo(false);
            setCargando(false);
            setPlayerError(`No se pudo reproducir: ${cancionActual.titulo}. Permita la reproducción automática en su navegador.`);
          });
      } else {
        console.log('[PlayerContext] play() no retornó Promise (ya estaba reproduciendo o similar).');
        setReproduciendo(true);
        if (cargando) {
              setCargando(false);
        }
      }
    } else if (colaActual.length > 0) {
      console.log('[PlayerContext] Llamada a play() sin cancionActual, estableciendo primer índice.');
      setCargando(true);
      const initialIndex = cancionActualIndex === -1 ? 0 : cancionActualIndex;
      setCancionActualIndex(initialIndex);
      setReproduciendo(true);
    } else {
        console.log('[PlayerContext] Llamada a play() sin cola ni canción actual.');
    }
  }, [cancionActual, colaActual, limpiarErrores, cargando]);

  const pause = useCallback(() => {
    console.log('[PlayerContext] Llamada a pause()');
    audioRef.current?.pause();
    setReproduciendo(false);
    setCargando(false);
  }, []);

  const seek = useCallback((time) => {
    console.log(`[PlayerContext] Llamada a seek(${time})`);
    const audio = audioRef.current;
    if (audio && isFinite(time) && duration > 0) {
      limpiarErrores();
      const newTime = Math.max(0, Math.min(time, duration));
      console.log(`[PlayerContext] Aplicando seek: ${newTime} (original: ${time}, duration: ${duration})`);
      audio.currentTime = newTime;
      setTiempoActual(newTime);
    } else {
        console.warn(`[PlayerContext] seek(${time}) no se aplicó. Audio readyState: ${audio?.readyState}, isFinite(time): ${isFinite(time)}, duration: ${duration}`);
    }
  }, [duration, limpiarErrores]);

  const setVolumenCallback = useCallback((v) => {
    console.log('[PlayerContext] Estableciendo volumen:', v);
    const newVol = Math.max(0, Math.min(1, v));
    setVolumen(newVol);
  }, [volumen]);

  const fetchReservas = useCallback(async () => {
    console.log('[PlayerContext] Intentando obtener recomendaciones...');
    if (!cancionActual) {
        console.log('[PlayerContext] No hay canción actual para obtener recomendaciones.');
        return;
    }
    try {
      const recomendaciones = await obtenerCancionesRecomendadas(cancionActual.id);
      console.log('[PlayerContext] Recomendaciones obtenidas:', recomendaciones);
      const nuevas = recomendaciones.filter(s => !colaOriginal.some(o => o.id === s.id) && getAudioUrl(s));
      console.log('[PlayerContext] Recomendaciones nuevas válidas:', nuevas);
      setReservasRecomendadas(nuevas);
    } catch (error) {
      console.error('[PlayerContext] Error fetching recommendations:', error);
    }
  }, [cancionActual, colaOriginal]);

  useEffect(() => {
    if (colaOriginal.length > 0 && cancionActualIndex === colaOriginal.length - 1 && reservasRecomendadas.length === 0) {
      console.log('[PlayerContext] Última canción original en cola, intentando obtener recomendaciones.');
      fetchReservas();
    } else {
        console.log(`[PlayerContext] Condición no cumplida para fetchReservas. Index: ${cancionActualIndex}, Original length: ${colaOriginal.length}, Reservas length: ${reservasRecomendadas.length}`);
    }
  }, [cancionActualIndex, colaOriginal.length, fetchReservas, reservasRecomendadas.length]);

  const siguienteCancion = useCallback(async () => {
    console.log('[PlayerContext] Llamada a siguienteCancion()');
    if (colaActual.length === 0) {
      console.log('[PlayerContext] Cola vacía, no hay siguiente canción.');
      return;
    }

    limpiarErrores();
    let nextIndex = cancionActualIndex + 1;
    let targetQueue = colaActual;

    const isLastInQueue = nextIndex >= colaActual.length;
    const isSingleTrack = colaActual.length === 1;

    if (isLastInQueue) {
        console.log('[PlayerContext] Última canción en la cola.');
        if (looping) {
            console.log('[PlayerContext] Looping activado, volviendo al inicio.');
            nextIndex = 0;
            if (aleatorio) {
                console.log('[PlayerContext] Looping y aleatorio, re-mezclando cola original + reservas.');
                const allSongs = colaOriginal.concat(reservasRecomendadas.filter(r => !colaOriginal.some(o => o.id === r.id))); // Ensure no duplicates if reservas were partially added
                const nuevaColaAleatoria = arrayAleatorio(allSongs);
                setColaAleatoria(nuevaColaAleatoria);
                targetQueue = nuevaColaAleatoria;
                nextIndex = 0;
                setReservasRecomendadas([]); // Clear reservations after adding them to colaOriginal
            }
        } else if (isSingleTrack && !looping && reservasRecomendadas.length === 0) {
             console.log('[PlayerContext] Single track, no looping, no reservas. Reiniciando canción.');
             seek(0);
             return;
        } else if (!aleatorio && reservasRecomendadas.length > 0) {
             console.log('[PlayerContext] Fin de cola no aleatoria, hay reservas. Añadiendo reservas a cola original.');
             const updatedColaOriginal = [...colaOriginal, ...reservasRecomendadas];
             setColaOriginal(updatedColaOriginal);
             setCargando(true);
             setCancionActualIndex(colaActual.length); // Index of the first new song
             setReproduciendo(true);
             setReservasRecomendadas([]); // Clear reservations after adding
             return;
        } else if (aleatorio && reservasRecomendadas.length > 0) {
             console.log('[PlayerContext] Fin de cola aleatoria, hay reservas. Añadiendo reservas y re-mezclando.');
             const originalWithReservas = [...colaOriginal, ...reservasRecomendadas]; // Add to original first for consistency
             setColaOriginal(originalWithReservas); // Update original
             const currentSong = colaActual[cancionActualIndex];
             const remainingQueue = colaActual.slice(cancionActualIndex + 1);
             const recommendationsToAdd = reservasRecomendadas.filter(r => !remainingQueue.some(s => s.id === r.id) && !colaOriginal.some(o => o.id === r.id)); // Filter again for safety
             const combinedForShuffle = [...remainingQueue, ...recommendationsToAdd];
             const shuffledRemaining = arrayAleatorio(combinedForShuffle);
             const newAleatoria = [...colaAleatoria.slice(0, cancionActualIndex + 1), ...shuffledRemaining];
             setColaAleatoria(newAleatoria);
             setCargando(true);
             setCancionActualIndex(cancionActualIndex + 1);
             setReproduciendo(true);
             setReservasRecomendadas([]); // Clear reservations after adding
             return;

        }
        else {
            console.log('[PlayerContext] Fin de cola, no looping, no reservas (o ya añadidas). Reiniciando reproductor.');
            reiniciarPlayer();
            return;
        }
    } else {
        console.log(`[PlayerContext] Siguiente canción en índice: ${nextIndex}`);
    }

    const targetIndex = nextIndex; // No need for modulo here if handled by isLastInQueue
    const targetSong = targetQueue[targetIndex];
    const preloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;

    console.log(`[PlayerContext] Intentando cargar canción en índice ${targetIndex}: ${targetSong?.titulo}`);

    if (preloadedSong && preloadedSong.id === targetSong.id && preloadAudioRef.current && audioRef.current) {
        console.log('[PlayerContext] Usando canción precargada.');
        const mainAudio = audioRef.current;
        const preloadAudio = preloadAudioRef.current;

        mainAudio.src = preloadAudio.src;
        mainAudio.currentTime = 0;
        setTiempoActual(0);
        mainAudio.volume = preloadAudio.volume;
          if (preloadAudio.duration && isFinite(preloadAudio.duration)) {
              console.log('[PlayerContext] Usando duración de precarga:', preloadAudio.duration);
              setDuration(preloadAudio.duration);
        } else {
            console.log('[PlayerContext] Duración de precarga no disponible, escuchando loadedmetadata en audio principal.');
              const onLoadedMetadata = () => {
                console.log('[PlayerContext] Evento loadedmetadata en audio principal (después de swap), duración:', mainAudio.duration);
                setDuration(mainAudio.duration || 0);
                mainAudio.removeEventListener('loadedmetadata', onLoadedMetadata);
              };
              mainAudio.addEventListener('loadedmetadata', onLoadedMetadata);
        }

        preloadAudio.removeAttribute('src');
        preloadAudio.load();
        setPreloadedSongIndex(null);

        setCargando(true);
        setCancionActualIndex(targetIndex);
        if (Reproduciendo) {
            console.log('[PlayerContext] Reproduciendo después del swap de precarga.');
            mainAudio.play().catch(e => {
                console.error('[PlayerContext] Error playing preloaded song after swap:', e);
                setPlayerError(`Error al reproducir (precargada): ${targetSong.titulo}.`);
                setReproduciendo(false);
                setCargando(false);
            });
        } else {
              console.log('[PlayerContext] No reproduciendo después del swap de precarga.');
              setCargando(false);
        }

    } else {
        console.log('[PlayerContext] Cargando canción sin precarga.');
        setCargando(true);
        setCancionActualIndex(targetIndex);
        setReproduciendo(true);
    }

  }, [
    cancionActualIndex,
    colaOriginal,
    colaAleatoria,
    colaActual,
    reservasRecomendadas,
    aleatorio,
    looping,
    fetchReservas,
    limpiarErrores,
    reiniciarPlayer,
    Reproduciendo,
    preloadedSongIndex,
    seek
  ]);


  const anteriorCancion = useCallback(() => {
    console.log('[PlayerContext] Llamada a anteriorCancion()');
    if (colaActual.length === 0) {
        console.log('[PlayerContext] Cola vacía, no hay canción anterior.');
        return;
    }
    limpiarErrores();

    let prevIndex = cancionActualIndex - 1;
    if (prevIndex < 0) {
        console.log('[PlayerContext] Es la primera canción.');
        if (looping) {
            console.log('[PlayerContext] Looping activado, volviendo al final.');
            prevIndex = colaActual.length - 1;
        } else {
            console.log('[PlayerContext] No looping, reiniciando canción actual.');
            seek(0);
            return;
        }
    }

    const targetIndex = prevIndex;
    const targetSong = colaActual[targetIndex];
    const preloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;

    console.log(`[PlayerContext] Intentando cargar canción anterior en índice ${targetIndex}: ${targetSong?.titulo}`);


    if (preloadedSong && preloadedSong.id === targetSong.id && preloadAudioRef.current && audioRef.current) {
        console.log('[PlayerContext] Usando canción precargada (anterior).');
        const mainAudio = audioRef.current;
        const preloadAudio = preloadAudioRef.current;

        mainAudio.src = preloadAudio.src;
        mainAudio.currentTime = 0;
        setTiempoActual(0);
        mainAudio.volume = preloadAudio.volume;
          if (preloadAudio.duration && isFinite(preloadAudio.duration)) {
              console.log('[PlayerContext] Usando duración de precarga (anterior):', preloadAudio.duration);
              setDuration(preloadAudio.duration);
        } else {
             console.log('[PlayerContext] Duración de precarga no disponible (anterior), escuchando loadedmetadata en audio principal.');
              const onLoadedMetadata = () => {
                console.log('[PlayerContext] Evento loadedmetadata en audio principal (después de swap anterior), duración:', mainAudio.duration);
                setDuration(mainAudio.duration || 0);
                mainAudio.removeEventListener('loadedmetadata', onLoadedMetadata);
              };
              mainAudio.addEventListener('loadedmetadata', onLoadedMetadata);
        }

        preloadAudio.removeAttribute('src');
        preloadAudio.load();
        setPreloadedSongIndex(null);

        setCargando(true);
        setCancionActualIndex(targetIndex);
        if (Reproduciendo) {
             console.log('[PlayerContext] Reproduciendo después del swap de precarga (anterior).');
            mainAudio.play().catch(e => {
                console.error('[PlayerContext] Error playing preloaded song after swap (previous):', e);
                setPlayerError(`Error al reproducir (precargada anterior): ${targetSong.titulo}.`);
                setReproduciendo(false);
                setCargando(false);
            });
        } else {
             console.log('[PlayerContext] No reproduciendo después del swap de precarga (anterior).');
              setCargando(false);
        }

    } else {
        console.log('[PlayerContext] Cargando canción anterior sin precarga.');
        setCargando(true);
        setCancionActualIndex(targetIndex);
        setReproduciendo(true);
    }

  }, [colaActual, cancionActualIndex, looping, limpiarErrores, seek, Reproduciendo, preloadedSongIndex]);


  const cargarColaYIniciar = useCallback((canciones, opciones = {}) => {
    console.log('[PlayerContext] Llamada a cargarColaYIniciar() con', canciones, opciones);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      console.log('[PlayerContext] Limpiando audio principal.');
    }
      if (preloadAudioRef.current) {
          preloadAudioRef.current.src = '';
          setPreloadedSongIndex(null);
          console.log('[PlayerContext] Limpiando audio de precarga.');
      }
    limpiarErrores();
    setReproduciendo(false);
    setCargando(false);
    setTiempoActual(0);
    setDuration(0);

    const validas = canciones.filter(s => s.id && s.titulo && getAudioUrl(s));
    console.log('[PlayerContext] Canciones válidas filtradas:', validas);
    if (validas.length === 0) {
        console.log('[PlayerContext] No hay canciones válidas, reiniciando.');
        return reiniciarPlayer();
    }

    setCargando(true);
    setSourceId(opciones.id ?? null);
    setReservasRecomendadas([]);
    console.log('[PlayerContext] SourceId establecido:', opciones.id);

    let startIndex = opciones.iniciar ?? 0;
    let nuevaAleatoria = [];
    if (aleatorio) {
      console.log('[PlayerContext] Modo aleatorio activado. Mezclando...');
      const clickDirecto = opciones.clickDirecto === true;
      if (clickDirecto && Number.isInteger(startIndex) && startIndex >= 0 && startIndex < validas.length) {
        const clicked = validas[startIndex];
        const restantes = validas.filter((_, i) => i !== startIndex);
        nuevaAleatoria = [clicked, ...arrayAleatorio(restantes)];
        console.log('[PlayerContext] Click directo en índice aleatorio:', startIndex, ' -> Nueva cola aleatoria:', nuevaAleatoria);
      } else {
        nuevaAleatoria = arrayAleatorio(validas);
        console.log('[PlayerContext] Nueva cola aleatoria:', nuevaAleatoria);
      }
      setColaAleatoria(nuevaAleatoria);
      startIndex = 0;
    } else {
      console.log('[PlayerContext] Modo aleatorio desactivado. Cola aleatoria vacía.');
      setColaAleatoria([]);
    }

    setColaOriginal(validas);
    console.log('[PlayerContext] Cola original establecida:', validas);
    const finalStartIndex = Math.max(0, Math.min(startIndex, validas.length - 1));
    console.log('[PlayerContext] Índice de inicio final:', finalStartIndex);
    setCancionActualIndex(finalStartIndex);
    setReproduciendo(true);
  }, [aleatorio, reiniciarPlayer, limpiarErrores]);


  const toggleAleatorio = useCallback(() => {
    console.log('[PlayerContext] Llamada a toggleAleatorio()');
    limpiarErrores();
    const next = !aleatorio;
    setAleatorio(next);
    if (colaOriginal.length > 0) {
      const actualId = cancionActual?.id;
      console.log(`[PlayerContext] Toggle aleatorio a ${next}. Canción actual ID: ${actualId}`);
      if (next) {
        const shuffled = arrayAleatorio(colaOriginal);
        setColaAleatoria(shuffled);
        const newIndex = shuffled.findIndex(t => t.id === actualId);
        console.log('[PlayerContext] Cola original mezclada:', shuffled, ' Nuevo índice:', newIndex);
        setCancionActualIndex(newIndex);
      } else {
        setColaAleatoria([]);
        const newIndex = colaOriginal.findIndex(t => t.id === actualId);
         console.log('[PlayerContext] Desactivando aleatorio. Cola aleatoria vacía. Nuevo índice en original:', newIndex);
        setCancionActualIndex(newIndex);
      }
    } else {
       console.log('[PlayerContext] Toggle aleatorio sin cola original.');
      setCancionActualIndex(-1);
    }
  }, [aleatorio, colaOriginal, cancionActual, limpiarErrores]);

  const toggleLoop = useCallback(() => {
      console.log('[PlayerContext] Llamada a toggleLoop()');
      limpiarErrores();
      setLooping(l => !l);
      console.log('[PlayerContext] Looping ahora:', !looping);
    }, [limpiarErrores, looping]);

  const playCola = useCallback((i) => {
      console.log('[PlayerContext] Llamada a playCola() con índice:', i);
      limpiarErrores();
      if (i >= 0 && i < colaActual.length) {
          console.log(`[PlayerContext] Reproduciendo canción en índice ${i}: ${colaActual[i]?.titulo}`);
          setCargando(true);
          setCancionActualIndex(i);
          setReproduciendo(true);
      } else {
          console.warn('[PlayerContext] Índice de playCola() fuera de rango:', i);
      }
    }, [limpiarErrores, colaActual.length, colaActual]);

  useEffect(() => {
      if (audioRef.current) {
           audioRef.current.volume = volumen;
           console.log('[PlayerContext] Volumen del audio principal actualizado:', volumen);
      }
        if (preloadAudioRef.current) {
            preloadAudioRef.current.volume = volumen;
            console.log('[PlayerContext] Volumen del audio de precarga actualizado:', volumen);
        }
    }, [volumen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
        console.log('[PlayerContext] audioRef.current no disponible.');
        return;
    }

    console.log('[PlayerContext] Efecto cancionActual/Reproduciendo. Canción actual:', cancionActual?.titulo, ' Reproduciendo:', Reproduciendo, ' Cargando:', cargando);

    if (cancionActual) {
      const url = getAudioUrl(cancionActual);
      if (audio.src !== url) {
        console.log('[PlayerContext] Cambiando source del audio principal a:', url);
        setCargando(true);
        audio.src = url;
        audio.currentTime = 0;
        setTiempoActual(0);
        setDuration(0);
        audio.load();

        if (Reproduciendo) {
            console.log('[PlayerContext] Intentando reproducir automáticamente después de cambiar source.');
            audio.play().catch((e) => {
                console.error('[PlayerContext] Error al reproducir después de cambiar source:', e);
                  setPlayerError(`Error al reanudar: ${cancionActual.titulo}.`);
                  setReproduciendo(false);
                  setCargando(false);
            });
        } else {
            console.log('[PlayerContext] Reproducción pausada, no reproduciendo automáticamente después de cambiar source.');
            setCargando(false);
        }
      } else {
           console.log('[PlayerContext] Source del audio principal ya es correcto.');
           if (Reproduciendo && audio.paused) {
             console.log('[PlayerContext] Estado: Reproduciendo=true, audio.paused=true. Intentando reanudar.');
             audio.play().catch((e) => {
                 console.error('[PlayerContext] Error al reanudar:', e);
                 setPlayerError(`Error al reanudar: ${cancionActual.titulo}.`);
                 setReproduciendo(false);
                 setCargando(false);
             });
           } else if (!Reproduciendo && !audio.paused) {
             console.log('[PlayerContext] Estado: Reproduciendo=false, audio.paused=false. Pausando audio.');
             audio.pause();
             setCargando(false);
           } else {
              console.log('[PlayerContext] Estado de reproducción/pausa ya consistente.');
              if (cargando) {
                  console.log('[PlayerContext] Marcando cargando como false (si estaba true sin play/pause).');
                  setCargando(false);
              }
           }
      }
    } else {
      console.log('[PlayerContext] No hay cancionActual. Pausando y limpiando audio.');
      audio.pause();
      if (audio.src) {
            audio.removeAttribute('src');
            audio.load();
      }
      setCargando(false);
      setTiempoActual(0);
      setDuration(0);
    }
    return () => {};
  }, [cancionActual, Reproduciendo, cargando, getAudioUrl]);

    useEffect(() => {
        const preloadAudio = preloadAudioRef.current;
        if (!preloadAudio) {
            console.log('[PlayerContext] preloadAudioRef.current no disponible.');
            return;
        }

        let nextSongIndexToPreload = -1;

        if (colaActual.length > 0) {
             const potentialNextIndex = cancionActualIndex + 1;

             if (potentialNextIndex < colaActual.length) {
                 nextSongIndexToPreload = potentialNextIndex;
             } else if (looping && colaActual.length > 0) {
                 nextSongIndexToPreload = 0;
             } else {
                 nextSongIndexToPreload = -1;
             }
        }
         console.log('[PlayerContext] Índice potencial para precargar:', nextSongIndexToPreload);


        const songToPreload = nextSongIndexToPreload !== -1 ? colaActual[nextSongIndexToPreload] : null;
        const currentlyPreloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;
        const preloadUrl = songToPreload ? getAudioUrl(songToPreload) : null;

        console.log('[PlayerContext] Canción a precargar:', songToPreload?.titulo, ' URL:', preloadUrl, ' Actualmente precargada:', currentlyPreloadedSong?.titulo);


        if (songToPreload && songToPreload.id !== cancionActual?.id && preloadUrl && preloadAudio.src !== preloadUrl) {
             console.log('[PlayerContext] Estableciendo source en precarga:', preloadUrl);
            preloadAudio.src = preloadUrl;
            preloadAudio.load();
            setPreloadedSongIndex(nextSongIndexToPreload);
        } else if (!songToPreload && preloadAudio.src) {
             console.log('[PlayerContext] No hay canción para precargar, limpiando precarga.');
            preloadAudio.removeAttribute('src');
            preloadAudio.load();
            setPreloadedSongIndex(null);
        } else if (songToPreload && songToPreload.id === currentlyPreloadedSong?.id && preloadAudio.src === preloadUrl) {
             console.log('[PlayerContext] Precarga ya correcta para la siguiente canción.');
        } else {
             console.log('[PlayerContext] No se necesita cambiar la precarga.');
        }
        return () => {};

    }, [cancionActualIndex, colaActual, looping, aleatorio, reservasRecomendadas, cancionActual, preloadedSongIndex, getAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    const preloadAudio = preloadAudioRef.current;
    if (!audio || !preloadAudio) return;

    console.log('[PlayerContext] Configurando event listeners del audio.');

    const onMainTimeUpdate = () => {
        setTiempoActual(audio.currentTime);
    };
    const onMainLoadedMetadata = () => {
        console.log('[PlayerContext] Evento loadedmetadata. Duración detectada:', audio.duration);
        if (isFinite(audio.duration) && audio.duration > 0) {
             setDuration(audio.duration);
        } else {
             console.warn('[PlayerContext] loadedmetadata: Duración no válida detectada:', audio.duration);
             setDuration(0);
        }
    };
    const onMainCanPlay = () => {
        console.log('[PlayerContext] Evento canplay. Marcando cargando = false.');
        setCargando(false);
    };
      const onMainPlaying = () => {
          console.log('[PlayerContext] Evento playing. Marcando cargando = false.');
           setCargando(false);
      };
      const onMainWaiting = () => {
           console.log('[PlayerContext] Evento waiting. Marcando cargando = true.');
           setCargando(true);
      };
    const onMainEnded = () => {
        console.log('[PlayerContext] Evento ended. Llamando a siguienteCancion.');
        siguienteCancion();
    };
    const onMainError = (e) => {
      console.error('[PlayerContext] Evento error en audio principal:', e.target.error);
      setCargando(false);
      setReproduciendo(false);
      let mensaje = 'Error en reproducción.';
      switch (e.target.error?.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
          mensaje = 'Reproducción abortada.';
          break;
        case e.target.error.MEDIA_ERR_NETWORK:
          mensaje = 'Error de red.';
          break;
        case e.target.error.MEDIA_ERR_DECODE:
          mensaje = 'Error de decodificación.';
          break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          mensaje = 'Formato no soportado.';
          break;
        default:
            mensaje = `Error desconocido (${e.target.error?.code || '?'})`;
            break;
      }
      setPlayerError(mensaje);
    };
      const onMainLoadStart = () => {
          console.log('[PlayerContext] Evento loadstart.');
          setCargando(true);
      };
      const onMainDurationChange = () => {
          console.log('[PlayerContext] Evento durationchange. Nueva duración:', audio.duration);
          if (duration !== audio.duration && isFinite(audio.duration) && audio.duration > 0) {
              setDuration(audio.duration);
          } else if (!isFinite(audio.duration) || audio.duration <= 0) {
              console.warn('[PlayerContext] durationchange: Duración no válida detectada:', audio.duration);
              setDuration(0);
          }
      };
      const onMainSeeking = () => {
      };
      const onMainSeeked = () => {
      };
      const onMainPlay = () => { console.log('[PlayerContext] Evento play.'); setReproduciendo(true); };
      const onMainPause = () => { console.log('[PlayerContext] Evento pause.'); setReproduciendo(false); };


    const onPreloadLoadedMetadata = () => { console.log('[PlayerContext] Precarga: Evento loadedmetadata. Duración:', preloadAudio.duration); };
    const onPreloadCanPlay = () => { console.log('[PlayerContext] Precarga: Evento canplay.'); };
      const onPreloadLoadStart = () => { console.log('[PlayerContext] Precarga: Evento loadstart.'); };
    const onPreloadError = (e) => {
        console.error('[PlayerContext] Evento error en audio de precarga:', e.target.error);
          setPreloadedSongIndex(null);
    };


    audio.addEventListener('timeupdate', onMainTimeUpdate);
    audio.addEventListener('loadedmetadata', onMainLoadedMetadata);
    audio.addEventListener('canplay', onMainCanPlay);
      audio.addEventListener('playing', onMainPlaying);
      audio.addEventListener('waiting', onMainWaiting);
    audio.addEventListener('ended', onMainEnded);
    audio.addEventListener('error', onMainError);
      audio.addEventListener('loadstart', onMainLoadStart);
      audio.addEventListener('durationchange', onMainDurationChange);
      audio.addEventListener('seeking', onMainSeeking);
      audio.addEventListener('seeked', onMainSeeked);
      audio.addEventListener('play', onMainPlay);
      audio.addEventListener('pause', onMainPause);


    preloadAudio.addEventListener('loadedmetadata', onPreloadLoadedMetadata);
    preloadAudio.addEventListener('canplay', onPreloadCanPlay);
    preloadAudio.addEventListener('error', onPreloadError);
      preloadAudio.addEventListener('loadstart', onPreloadLoadStart);


    return () => {
        console.log('[PlayerContext] Limpiando event listeners del audio.');
      audio.removeEventListener('timeupdate', onMainTimeUpdate);
      audio.removeEventListener('loadedmetadata', onMainLoadedMetadata);
      audio.removeEventListener('canplay', onMainCanPlay);
        audio.removeEventListener('playing', onMainPlaying);
        audio.removeEventListener('waiting', onMainWaiting);
      audio.removeEventListener('ended', onMainEnded);
      audio.removeEventListener('error', onMainError);
        audio.removeEventListener('loadstart', onMainLoadStart);
        audio.removeEventListener('durationchange', onMainDurationChange);
        audio.removeEventListener('seeking', onMainSeeking);
        audio.removeEventListener('seeked', onMainSeeked);
        audio.removeEventListener('play', onMainPlay);
        audio.removeEventListener('pause', onMainPause);


      preloadAudio.removeEventListener('loadedmetadata', onPreloadLoadedMetadata);
      preloadAudio.removeEventListener('canplay', onPreloadCanPlay);
      preloadAudio.removeEventListener('error', onPreloadError);
        preloadAudio.removeEventListener('loadstart', onPreloadLoadStart);
    };
  }, [siguienteCancion, duration]);


  return (
    <PlayerContext.Provider
      value={{
        queue: colaActual,
        colaOriginal,
        cancionActualIndex,
        cancionActual,
        Reproduciendo,
        tiempoActual,
        duration,
        volumen,
        aleatorio,
        looping,
        sourceId,
        cargando,
        playerError,
        cargarColaYIniciar,
        play,
        pause,
        siguienteCancion,
        anteriorCancion,
        seek,
        setVolumen: setVolumenCallback,
        toggleAleatorio,
        toggleLoop,
        playCola,
        limpiarErrores,
      }}
    >
      {children}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      <audio ref={preloadAudioRef} preload="metadata" style={{ display: 'none' }} />
    </PlayerContext.Provider>
  );
};

export { PlayerContext };
