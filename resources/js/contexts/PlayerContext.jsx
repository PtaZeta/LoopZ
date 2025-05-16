import React, { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';
import { obtenerCancionesRecomendadas } from '@/hooks/useRecomendaciones'; // Asegúrate de que la importación sea correcta

const DEBUG = true; // Mantener DEBUG a true si quieres otros logs del PlayerProvider

const getAudioUrl = (cancion) => {
  if (!cancion?.archivo_url) return null;
  return cancion.archivo_url.startsWith('http')
    ? cancion.archivo_url
    : `/storage/${cancion.archivo_url}`;
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
    if (vol !== null) setVolumen(Number(vol));
    if (shf !== null) setAleatorio(shf === 'true');
    if (lop !== null) setLooping(lop === 'true');
  }, []);

  useEffect(() => sessionStorage.setItem('volumen_player', String(volumen)), [volumen]);
  useEffect(() => sessionStorage.setItem('aleatorio_player', String(aleatorio)), [aleatorio]);
  useEffect(() => sessionStorage.setItem('looping_player', String(looping)), [looping]);
  useEffect(() => {
    if (cancionActualIndex >= 0) {
      sessionStorage.setItem('cancionActualIndex_player', String(cancionActualIndex));
    } else {
      sessionStorage.removeItem('cancionActualIndex_player');
    }
  }, [cancionActualIndex]);

  const limpiarErrores = useCallback(() => setPlayerError(null), []);

  const reiniciarPlayer = useCallback(() => {
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
    limpiarErrores();
    const audio = audioRef.current;
    if (audio && cancionActual) {
      const promise = audio.play();
      if (promise !== undefined) {
        setCargando(true);
        promise
          .then(() => {
            setReproduciendo(true);
            setCargando(false);
          })
          .catch(() => {
            setReproduciendo(false);
            setCargando(false);
            setPlayerError(`No se pudo reproducir: ${cancionActual.titulo}. Permita la reproducción automática en su navegador.`);
          });
      } else {
        setReproduciendo(true);
        if (cargando) {
             setCargando(false);
        }
      }
    } else if (colaActual.length > 0) {
      setCargando(true);
      const initialIndex = cancionActualIndex === -1 ? 0 : cancionActualIndex;
      setCancionActualIndex(initialIndex);
      setReproduciendo(true);
    }
  }, [cancionActual, colaActual, limpiarErrores, cargando]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setReproduciendo(false);
    setCargando(false);
  }, []);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (audio && isFinite(time) && duration > 0) {
      limpiarErrores();
      const newTime = Math.max(0, Math.min(time, duration));
      audio.currentTime = newTime;
      setTiempoActual(newTime);
    }
  }, [duration, limpiarErrores]);

  const setVolumenCallback = useCallback((v) => {
    const newVol = Math.max(0, Math.min(1, v));
    setVolumen(newVol);
  }, [volumen]);

  const fetchReservas = useCallback(async () => {
    if (!cancionActual) return;
    try {
      const recomendaciones = await obtenerCancionesRecomendadas(cancionActual.id);
      const nuevas = recomendaciones.filter(s => !colaOriginal.some(o => o.id === s.id) && getAudioUrl(s));
      setReservasRecomendadas(nuevas);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }, [cancionActual, colaOriginal]);

  useEffect(() => {
    if (colaOriginal.length > 0 && cancionActualIndex === colaOriginal.length - 1 && reservasRecomendadas.length === 0) {
      fetchReservas();
    }
  }, [cancionActualIndex, colaOriginal.length, fetchReservas, reservasRecomendadas.length]);

  const siguienteCancion = useCallback(async () => {
    if (colaActual.length === 0) {
      return;
    }

    limpiarErrores();
    let nextIndex = cancionActualIndex + 1;
    let targetQueue = colaActual;

    const isLastOriginal = !aleatorio && nextIndex >= colaOriginal.length;
    const isLastInQueue = nextIndex >= colaActual.length;

    if (isLastOriginal && !looping && reservasRecomendadas.length === 0) {
        await fetchReservas();
        if (reservasRecomendadas.length === 0) {
             reiniciarPlayer();
             return;
        }
    }

    if (isLastInQueue) {
        if (looping) {
            nextIndex = 0;
            if (aleatorio) {
                 const nuevaColaAleatoria = arrayAleatorio(colaOriginal.concat(reservasRecomendadas));
                 setColaAleatoria(nuevaColaAleatoria);
                 targetQueue = nuevaColaAleatoria;
                 nextIndex = 0;
                 setReservasRecomendadas([]);
            }
        } else if (reservasRecomendadas.length > 0) {
             setColaOriginal(orig => {
                 const updated = [...orig, ...reservasRecomendadas];
                 if (aleatorio) {
                     const currentSong = colaActual[cancionActualIndex];
                     const remainingQueue = colaActual.slice(cancionActualIndex + 1);
                     const recommendationsToAdd = reservasRecomendadas.filter(r => !remainingQueue.some(s => s.id === r.id));
                     const combinedForShuffle = [...remainingQueue, ...recommendationsToAdd];
                     const shuffledRemaining = arrayAleatorio(combinedForShuffle);
                     const newAleatoria = [...colaAleatoria.slice(0, cancionActualIndex + 1), ...shuffledRemaining];
                     setColaAleatoria(newAleatoria);
                     nextIndex = cancionActualIndex + 1;

                 } else {
                     nextIndex = colaActual.length;
                 }
                 setReservasRecomendadas([]);
                 return updated;
             });

             setCargando(true);
             setCancionActualIndex(nextIndex);
             setReproduciendo(true);
             return;

        } else {
            reiniciarPlayer();
            return;
        }
    }

    const targetIndex = nextIndex % targetQueue.length;
    const targetSong = targetQueue[targetIndex];
    const preloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;


    if (preloadedSong && preloadedSong.id === targetSong.id && preloadAudioRef.current && audioRef.current) {
        const mainAudio = audioRef.current;
        const preloadAudio = preloadAudioRef.current;

        mainAudio.src = preloadAudio.src;
        mainAudio.currentTime = 0;
        setTiempoActual(0);
        mainAudio.volume = preloadAudio.volume;
        if (preloadAudio.duration) {
             setDuration(preloadAudio.duration);
        } else {
             const onLoadedMetadata = () => {
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
            mainAudio.play().catch(e => {
                 console.error('Error playing preloaded song after swap:', e);
                 setPlayerError(`Error al reproducir (precargada): ${targetSong.titulo}.`);
                 setReproduciendo(false);
                 setCargando(false);
            });
        } else {
             setCargando(false);
        }

    } else {
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
    preloadedSongIndex
  ]);


  const anteriorCancion = useCallback(() => {
    if (colaActual.length === 0) return;
    limpiarErrores();

    let prevIndex = cancionActualIndex - 1;
    if (prevIndex < 0) {
        if (looping) {
            prevIndex = colaActual.length - 1;
        } else {
            seek(0);
            return;
        }
    }

    const targetIndex = prevIndex;
    const targetSong = colaActual[targetIndex];
    const preloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;


    if (preloadedSong && preloadedSong.id === targetSong.id && preloadAudioRef.current && audioRef.current) {
        const mainAudio = audioRef.current;
        const preloadAudio = preloadAudioRef.current;

        mainAudio.src = preloadAudio.src;
        mainAudio.currentTime = 0;
        setTiempoActual(0);
        mainAudio.volume = preloadAudio.volume;
         if (preloadAudio.duration) {
             setDuration(preloadAudio.duration);
        } else {
             const onLoadedMetadata = () => {
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
            mainAudio.play().catch(e => {
                 console.error('Error playing preloaded song after swap (previous):', e);
                 setPlayerError(`Error al reproducir (precargada anterior): ${targetSong.titulo}.`);
                 setReproduciendo(false);
                 setCargando(false);
            });
        } else {
             setCargando(false);
        }

    } else {
        setCargando(true);
        setCancionActualIndex(targetIndex);
        setReproduciendo(true);
    }

  }, [colaActual, cancionActualIndex, looping, limpiarErrores, seek, Reproduciendo, preloadedSongIndex]);


  const cargarColaYIniciar = useCallback((canciones, opciones = {}) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
     if (preloadAudioRef.current) {
        preloadAudioRef.current.src = '';
        setPreloadedSongIndex(null);
     }
    limpiarErrores();
    setReproduciendo(false);
    setCargando(false);
    setTiempoActual(0);
    setDuration(0);

    const validas = canciones.filter(s => s.id && s.titulo && getAudioUrl(s));
    if (validas.length === 0) return reiniciarPlayer();

    setCargando(true);
    setSourceId(opciones.id ?? null);
    setReservasRecomendadas([]);

    let startIndex = opciones.iniciar ?? 0;
    let nuevaAleatoria = [];
    if (aleatorio) {
      const clickDirecto = opciones.clickDirecto === true;
      if (clickDirecto && Number.isInteger(startIndex) && startIndex >= 0 && startIndex < validas.length) {
        const clicked = validas[startIndex];
        const restantes = validas.filter((_, i) => i !== startIndex);
        nuevaAleatoria = [clicked, ...arrayAleatorio(restantes)];
      } else {
        nuevaAleatoria = arrayAleatorio(validas);
      }
      setColaAleatoria(nuevaAleatoria);
      startIndex = 0;
    } else {
      setColaAleatoria([]);
    }

    setColaOriginal(validas);
    const finalStartIndex = Math.max(0, Math.min(startIndex, validas.length - 1));
    setCancionActualIndex(finalStartIndex);
    setReproduciendo(true);
  }, [aleatorio, reiniciarPlayer, limpiarErrores]);


  const toggleAleatorio = useCallback(() => {
    limpiarErrores();
    const next = !aleatorio;
    setAleatorio(next);
    if (colaOriginal.length > 0) {
      const actualId = cancionActual?.id;
      if (next) {
        const shuffled = arrayAleatorio(colaOriginal);
        setColaAleatoria(shuffled);
        const newIndex = shuffled.findIndex(t => t.id === actualId);
        setCancionActualIndex(newIndex);
      } else {
        setColaAleatoria([]);
        const newIndex = colaOriginal.findIndex(t => t.id === actualId);
        setCancionActualIndex(newIndex);
      }
    } else {
      setCancionActualIndex(-1);
    }
  }, [aleatorio, colaOriginal, cancionActual, limpiarErrores]);

  const toggleLoop = useCallback(() => {
      limpiarErrores();
      setLooping(l => !l);
    }, [limpiarErrores]);

  const playCola = useCallback((i) => {
      limpiarErrores();
      if (i >= 0 && i < colaActual.length) {
         setCargando(true);
         setCancionActualIndex(i);
         setReproduciendo(true);
      }
    }, [limpiarErrores, colaActual.length]);

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volumen;
      }
       if (preloadAudioRef.current) {
           preloadAudioRef.current.volume = volumen;
       }
    }, [volumen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
        return;
    }

    /* Log current song and its genres
    if (DEBUG && cancionActual) {
        console.log(`[Player] Now Playing: ${cancionActual.titulo}`);
        if (cancionActual.generos && Array.isArray(cancionActual.generos)) {
            const genreNames = cancionActual.generos.map(g => g.nombre).join(', ');
            console.log(`[Player] Genres: ${genreNames || 'None'}`);
        } else {
            console.log('[Player] Genres: None or not available');
        }
    }*/


    if (cancionActual) {
      const url = getAudioUrl(cancionActual);
      if (audio.src !== url) {
        setCargando(true);
        audio.src = url;
        audio.currentTime = 0;
        setTiempoActual(0);
        setDuration(0);
        if (Reproduciendo) {
            audio.play().catch(() => {
                 setPlayerError(`Error al reanudar: ${cancionActual.titulo}.`);
                 setReproduciendo(false);
                 setCargando(false);
            });
        }
      } else {
          if (Reproduciendo && audio.paused) {
            audio.play().catch(() => {
                setPlayerError(`Error al reanudar: ${cancionActual.titulo}.`);
                setReproduciendo(false);
                setCargando(false);
            });
          } else if (!Reproduciendo && !audio.paused) {
            audio.pause();
            setCargando(false);
          } else {
              if (cargando) {
                  setCargando(false);
              }
          }
      }
    } else {
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
  }, [cancionActual, Reproduciendo, cargando]);

    useEffect(() => {
        const preloadAudio = preloadAudioRef.current;
        if (!preloadAudio) {
            return;
        }

        let nextSongIndexToPreload = -1;

        if (colaActual.length > 0) {
             const potentialNextIndex = cancionActualIndex + 1;

             if (potentialNextIndex < colaActual.length) {
                 nextSongIndexToPreload = potentialNextIndex;
             } else if (looping) {
                  nextSongIndexToPreload = 0;
             } else {
                 if (aleatorio && colaAleatoria.length > cancionActualIndex + 1) {
                      nextSongIndexToPreload = potentialNextIndex;
                 } else if (!aleatorio && colaOriginal.length > cancionActualIndex + 1) {
                      nextSongIndexToLoad = potentialNextIndex;
                 } else {
                     nextSongIndexToPreload = -1;
                 }
             }
        }

        const songToPreload = nextSongIndexToPreload !== -1 ? colaActual[nextSongIndexToPreload] : null;
        const currentlyPreloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;
        const preloadUrl = songToPreload ? getAudioUrl(songToPreload) : null;

        if (songToPreload && songToPreload.id !== cancionActual?.id && preloadUrl && preloadAudio.src !== preloadUrl) {
            preloadAudio.src = preloadUrl;
            preloadAudio.load();
            setPreloadedSongIndex(nextSongIndexToPreload);
        } else if (!songToPreload && preloadAudio.src) {
            preloadAudio.removeAttribute('src');
            preloadAudio.load();
            setPreloadedSongIndex(null);
        } else if (songToPreload && songToPreload.id === currentlyPreloadedSong?.id && preloadAudio.src === preloadUrl) {
        } else {
        }
        return () => {};

    }, [cancionActualIndex, colaActual, looping, aleatorio, reservasRecomendadas, cancionActual, preloadedSongIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    const preloadAudio = preloadAudioRef.current;
    if (!audio || !preloadAudio) return;

    const onMainTimeUpdate = () => setTiempoActual(audio.currentTime);
    const onMainLoadedMetadata = () => {
        setDuration(audio.duration || 0);
    };
    const onMainCanPlay = () => {
        setCargando(false);
    };
     const onMainPlaying = () => {
          setCargando(false);
     };
     const onMainWaiting = () => {
         setCargando(true);
     };
    const onMainEnded = siguienteCancion;
    const onMainError = (e) => {
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
            mensaje = `Error desconocido (${e.target.error?.code})`;
            break;
      }
      setPlayerError(mensaje);
      console.error('Main Audio error:', e.target.error);
    };
     const onMainLoadStart = () => {};
      const onMainDurationChange = () => {
         if (duration !== audio.duration) {
             setDuration(audio.duration || 0);
         }
      };
      const onMainSeeking = () => {};
      const onMainSeeked = () => {};


    const onPreloadLoadedMetadata = () => {};
    const onPreloadCanPlay = () => {};
     const onPreloadLoadStart = () => {};
    const onPreloadError = (e) => {
        console.error('Preload Audio error:', e.target.error);
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


    preloadAudio.addEventListener('loadedmetadata', onPreloadLoadedMetadata);
    preloadAudio.addEventListener('canplay', onPreloadCanPlay);
    preloadAudio.addEventListener('error', onPreloadError);
    preloadAudio.addEventListener('loadstart', onPreloadLoadStart);


    return () => {
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
