import React, { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';
import { obtenerCancionesRecomendadas } from '@/hooks/useRecomendaciones';

const getAudioUrl = (cancion) => {
    const url = cancion?.archivo_url || null;
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
        return saved !== null ? Number(saved) : -1;
    });
    const [Reproduciendo, setReproduciendo] = useState(false);
    const [tiempoActual, setTiempoActual] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volumen, setVolumen] = useState(0.5);
    const [aleatorio, setAleatorio] = useState(false);
    const [looping, setLooping] = useState(false);
    const [loopingOne, setLoopingOne] = useState(false);
    const [sourceId, setSourceId] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [playerError, setPlayerError] = useState(null);
    const audioRef = useRef(null);
    const preloadAudioRef = useRef(null);
    const [preloadedSongIndex, setPreloadedSongIndex] = useState(null);
    const userInitiatedPlayRef = useRef(false);
    const hasCountedRef = useRef(false);

    useEffect(() => {
        const vol = sessionStorage.getItem('volumen_player');
        const shf = sessionStorage.getItem('aleatorio_player');
        const lop = sessionStorage.getItem('looping_player');
        const lopOne = sessionStorage.getItem('loopingOne_player');
        if (vol !== null) setVolumen(Number(vol));
        if (shf !== null) setAleatorio(shf === 'true');
        if (lop !== null) setLooping(lop === 'true');
        if (lopOne !== null) setLoopingOne(lopOne === 'true');
    }, []);

    useEffect(() => {
        sessionStorage.setItem('volumen_player', String(volumen));
    }, [volumen]);

    useEffect(() => {
        sessionStorage.setItem('aleatorio_player', String(aleatorio));
    }, [aleatorio]);

    useEffect(() => {
        sessionStorage.setItem('looping_player', String(looping));
    }, [looping]);

    useEffect(() => {
        sessionStorage.setItem('loopingOne_player', String(loopingOne));
    }, [loopingOne]);

    useEffect(() => {
        if (cancionActualIndex >= 0) {
            sessionStorage.setItem('cancionActualIndex_player', String(cancionActualIndex));
        } else {
            sessionStorage.removeItem('cancionActualIndex_player');
        }
    }, [cancionActualIndex]);

    const limpiarErrores = useCallback(() => {
        setPlayerError(null);
    }, []);

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
        userInitiatedPlayRef.current = false;
    }, [limpiarErrores]);

    const colaActual = aleatorio ? colaAleatoria : colaOriginal;
    const cancionActual = colaActual[cancionActualIndex] || null;

    const pause = useCallback(() => {
        audioRef.current?.pause();
        setReproduciendo(false);
        setCargando(false);
        userInitiatedPlayRef.current = false;
    }, []);

    const play = useCallback(() => {
        limpiarErrores();
        const audio = audioRef.current;
        if (!audio) {
            setPlayerError("Player not ready.");
            return;
        }
        if (cancionActual) {
            if (Reproduciendo) {
                pause();
            } else {
                userInitiatedPlayRef.current = true;
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        userInitiatedPlayRef.current = false;
                    })
                    .catch((e) => {
                        setReproduciendo(false);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    });
            }
        } else if (colaActual.length > 0) {
            const initialIndex = cancionActualIndex === -1 ? 0 : cancionActualIndex;
            setCancionActualIndex(initialIndex);
            setReproduciendo(true);
            userInitiatedPlayRef.current = true;
        } else {
            reiniciarPlayer();
        }
    }, [cancionActual, colaActual, Reproduciendo, pause, limpiarErrores, reiniciarPlayer, cancionActualIndex]);

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
    }, []);

    const fetchReservas = useCallback(async () => {
        if (!cancionActual) {
            return;
        }
        try {
            const recomendaciones = await obtenerCancionesRecomendadas(cancionActual.id);
            const nuevas = recomendaciones.filter(s => !colaOriginal.some(o => o.id === s.id) && getAudioUrl(s));
            setReservasRecomendadas(nuevas);
        } catch (error) {}
    }, [cancionActual, colaOriginal]);

    useEffect(() => {
        if (!looping && colaOriginal.length > 0 && cancionActualIndex === colaOriginal.length - 1 && reservasRecomendadas.length === 0) {
            fetchReservas();
        }
    }, [cancionActualIndex, colaOriginal.length, fetchReservas, reservasRecomendadas.length, looping]);

    const siguienteCancion = useCallback(async () => {
        if (colaActual.length === 0) return;
        limpiarErrores();

        if (loopingOne) {
            seek(0);
            if (!Reproduciendo) {
                play();
            }
            return;
        }

        let nextIndex = cancionActualIndex + 1;
        while (
            nextIndex < colaActual.length &&
            colaActual[nextIndex]?.id === cancionActual?.id
        ) {
            nextIndex++;
        }
        const isLastInQueue = nextIndex >= colaActual.length;
        const isSingleTrack = colaActual.length === 1;
        if (isLastInQueue) {
            if (looping) {
                nextIndex = 0;
                if (aleatorio) {
                    const allSongs = colaOriginal.concat(
                        reservasRecomendadas.filter(r => !colaOriginal.some(o => o.id === r.id))
                    );
                    const nuevaColaAleatoria = arrayAleatorio(allSongs);
                    setColaAleatoria(nuevaColaAleatoria);
                    nextIndex = 0;
                    setReservasRecomendadas([]);
                }
            } else if (isSingleTrack && !looping && reservasRecomendadas.length === 0) {
                seek(0);
                return;
            } else if (!aleatorio && !looping && reservasRecomendadas.length > 0) {
                const updatedColaOriginal = [...colaOriginal, ...reservasRecomendadas];
                setColaOriginal(updatedColaOriginal);
                setCargando(true);
                setCancionActualIndex(colaActual.length);
                setReproduciendo(true);
                setReservasRecomendadas([]);
                setSourceId(null);
                return;
            } else if (aleatorio && !looping && reservasRecomendadas.length > 0) {
                const originalWithReservas = [...colaOriginal, ...reservasRecomendadas];
                setColaOriginal(originalWithReservas);
                const remainingQueue = colaActual.slice(cancionActualIndex + 1);
                const recommendationsToAdd = reservasRecomendadas.filter(r =>
                    !remainingQueue.some(s => s.id === r.id) &&
                    !colaOriginal.some(o => o.id === r.id)
                );
                const combinedForShuffle = [...remainingQueue, ...recommendationsToAdd];
                const shuffledRemaining = arrayAleatorio(combinedForShuffle);
                const newAleatoria = [...colaAleatoria.slice(0, cancionActualIndex + 1), ...shuffledRemaining];
                setColaAleatoria(newAleatoria);
                setCargando(true);
                setCancionActualIndex(cancionActualIndex + 1);
                setReproduciendo(true);
                setReservasRecomendadas([]);
                setSourceId(null);
                return;
            } else {
                reiniciarPlayer();
                return;
            }
        }
        const targetIndex = nextIndex;
        const targetSong = colaActual[targetIndex];
        const preloadedSong = preloadedSongIndex !== null && preloadedSongIndex < colaActual.length ? colaActual[preloadedSongIndex] : null;
        if (
            preloadedSong &&
            preloadedSong.id === targetSong.id &&
            preloadAudioRef.current &&
            audioRef.current
        ) {
            const mainAudio = audioRef.current;
            const preloadAudio = preloadAudioRef.current;
            mainAudio.src = preloadAudio.src;
            mainAudio.currentTime = 0;
            setTiempoActual(0);
            mainAudio.volume = preloadAudio.volume;
            if (preloadAudio.duration && isFinite(preloadAudio.duration)) {
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
            if (Reproduciendo) {} else {
                setCargando(false);
            }
            userInitiatedPlayRef.current = true;
            setTimeout(() => {
                mainAudio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    })
                    .catch((e) => {
                        console.error("Playback error:", e);
                        setPlayerError("No se pudo reproducir automáticamente.");
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    });
            }, 50);
        } else {
            setCargando(true);
            setCancionActualIndex(targetIndex);
        }
    }, [
        cancionActualIndex,
        colaOriginal,
        colaAleatoria,
        colaActual,
        reservasRecomendadas,
        aleatorio,
        looping,
        loopingOne,
        fetchReservas,
        limpiarErrores,
        reiniciarPlayer,
        Reproduciendo,
        preloadedSongIndex,
        seek,
        getAudioUrl,
        cancionActual,
        play
    ]);

    const anteriorCancion = useCallback(() => {
        if (colaActual.length === 0) return;
        limpiarErrores();

        if (loopingOne) {
            seek(0);
            if (!Reproduciendo) {
                play();
            }
            return;
        }

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
            if (preloadAudio.duration && isFinite(preloadAudio.duration)) {
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
            if (Reproduciendo) {} else {
                setCargando(false);
            }
            userInitiatedPlayRef.current = true;
            setTimeout(() => {
                mainAudio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    })
                    .catch((e) => {
                        console.error("Playback error:", e);
                        setPlayerError("No se pudo reproducir automáticamente.");
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    });
            }, 50);
        } else {
            setCargando(true);
            setCancionActualIndex(targetIndex);
        }
    }, [colaActual, cancionActualIndex, looping, loopingOne, limpiarErrores, seek, Reproduciendo, preloadedSongIndex, getAudioUrl, play]); // Añadido loopingOne y play

    const cargarColaYIniciar = useCallback((canciones, opciones = {}) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        if (preloadAudioRef.current) {
            preloadAudioRef.current.src = '';
        }
        limpiarErrores();
        setReproduciendo(false);
        setCargando(false);
        setTiempoActual(0);
        setDuration(0);
        const validas = canciones.filter(s => s.id && s.titulo && getAudioUrl(s));
        if (validas.length === 0) {
            setPlayerError("No se encontraron canciones válidas en la cola.");
            return reiniciarPlayer();
        }
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
        userInitiatedPlayRef.current = true;
    }, [aleatorio, reiniciarPlayer, limpiarErrores, getAudioUrl]);

    const añadirSiguiente = useCallback((song) => {
        limpiarErrores();
        if (!song || !song.id || !song.titulo || !getAudioUrl(song)) {
            setPlayerError("No se puede añadir una canción inválida.");
            return;
        }
        if (cancionActualIndex === -1) {
            setPlayerError("Selecciona una canción para empezar antes de usar 'añadir siguiente'.");
            return;
        }
        const insertIndex = cancionActualIndex + 1;
        if (aleatorio) {
            setColaAleatoria(prevColaAleatoria => {
                const newColaAleatoria = [...prevColaAleatoria];
                if (insertIndex <= newColaAleatoria.length) {
                    newColaAleatoria.splice(insertIndex, 0, song);
                } else {
                    return prevColaAleatoria;
                }
                return newColaAleatoria;
            });
            setColaOriginal(prevColaOriginal => {
                if (!prevColaOriginal.some(s => s.id === song.id)) {
                    return [...prevColaOriginal, song];
                }
                return prevColaOriginal;
            });
        } else {
            setColaOriginal(prevColaOriginal => {
                const newColaOriginal = [...prevColaOriginal];
                if (insertIndex <= newColaOriginal.length) {
                    newColaOriginal.splice(insertIndex, 0, song);
                } else {
                    console.error(`Calculated insertIndex (${insertIndex}) out of bounds for colaOriginal length (${newColaOriginal.length}). Current index was ${cancionActualIndex}.`);
                    return prevColaOriginal;
                }
                return newColaOriginal;
            });
        }
        setPreloadedSongIndex(null);
    }, [cancionActualIndex, aleatorio, limpiarErrores, getAudioUrl]);

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
                setCancionActualIndex(newIndex !== -1 ? newIndex : 0);
            } else {
                setColaAleatoria([]);
                const newIndex = colaOriginal.findIndex(t => t.id === actualId);
                setCancionActualIndex(newIndex !== -1 ? newIndex : 0);
            }
        } else {
            setCancionActualIndex(-1);
        }
    }, [aleatorio, colaOriginal, cancionActual, limpiarErrores]);

    const toggleLoop = useCallback(() => {
        limpiarErrores();
        setLooping(prevLooping => {
            if (prevLooping && !loopingOne) {
                setLoopingOne(true);
                return true;
            } else if (prevLooping && loopingOne) {
                setLoopingOne(false);
                return false;
            } else {
                setLoopingOne(false);
                return true;
            }
        });
    }, [limpiarErrores, loopingOne]);

    const playCola = useCallback((i) => {
        limpiarErrores();
        if (i >= 0 && i < colaActual.length) {
            setCancionActualIndex(i);
            setReproduciendo(true);
            userInitiatedPlayRef.current = true;
        }
    }, [limpiarErrores, colaActual.length, colaActual]);

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
        if (!audio) return;
        if (cancionActual && getAudioUrl(cancionActual)) {
            const url = getAudioUrl(cancionActual);
            setCargando(true);
            audio.src = url;
            audio.currentTime = 0;
            setTiempoActual(0);
            setDuration(0);
            audio.load();
        } else {
            audio.pause();
            if (audio.src) {
                audio.removeAttribute('src');
                audio.load();
            }
            setReproduciendo(false);
            setCargando(false);
            setTiempoActual(0);
            setDuration(0);
            userInitiatedPlayRef.current = false;
        }
    }, [cancionActual, getAudioUrl]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const attemptPlay = () => {
            if (audio.readyState < 3) {
                setCargando(true);
            }
            audio.play()
                .then(() => {
                    setReproduciendo(true);
                    setCargando(false);
                    userInitiatedPlayRef.current = false;
                })
                .catch((e) => {
                    console.error("Playback error:", e);
                    setReproduciendo(false);
                    setCargando(false);
                    userInitiatedPlayRef.current = false;
                });
        };
        if (Reproduciendo) {
            if (audio.paused) {
                attemptPlay();
            }
        } else {
            if (!audio.paused) {
                audio.pause();
                setCargando(false);
                userInitiatedPlayRef.current = false;
            }
        }
    }, [Reproduciendo, cancionActual, limpiarErrores]);

    useEffect(() => {
        const audio = audioRef.current;
        const preloadAudioElement = preloadAudioRef.current;
        if (!audio) return;
        const onMainTimeUpdate = () => {
            setTiempoActual(audio.currentTime);
            if (audio.currentTime >= 10 && !hasCountedRef.current && cancionActual) {
                hasCountedRef.current = true;
                fetch(`/canciones/${cancionActual.id}/incrementar-visualizacion`, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                })
                .then(response => {
                    if (!response.ok) throw new Error('Error en la respuesta');
                    return response.json();
                })
                .catch(err => {
                    console.error('Error al contar visualización:', err);
                });
            }
        };
        const onMainLoadedMetadata = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
            } else {
                setDuration(0);
            }
            if (userInitiatedPlayRef.current && Reproduciendo) {
                if (audio.readyState < 3) {
                    setCargando(true);
                }
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    })
                    .catch((e) => {
                        console.error("Playback error:", e);
                        setPlayerError(`Error al reproducir: ${cancionActual?.titulo || 'canción'}. Permita la reproducción automática en su navegador.`);
                        setReproduciendo(false);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    });
            }
        };
        const onMainCanPlay = () => {
            setCargando(false);
            if (userInitiatedPlayRef.current && Reproduciendo && audio.paused) {
                if (audio.readyState < 3) {
                    setCargando(true);
                }
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    })
                    .catch((e) => {
                        console.error("Playback error:", e);
                        setPlayerError(`Error al reproducir: ${cancionActual?.titulo || 'canción'}. Permita la reproducción automática en su navegador.`);
                        setReproduciendo(false);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    });
            }
        };
        const onMainPlaying = () => {
            setCargando(false);
            setReproduciendo(true);
            userInitiatedPlayRef.current = false;
        };
        const onMainWaiting = () => {
            setCargando(true);
        };
        const onMainEnded = () => {
            if (loopingOne) {
                seek(0);
                if (!Reproduciendo) {
                    play();
                }
            } else {
                siguienteCancion();
            }
        };
        const onMainError = (e) => {
            setCargando(false);
            setReproduciendo(false);
            userInitiatedPlayRef.current = false;
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
        };
        const onMainLoadStart = () => {
            setCargando(true);
        };
        const onMainDurationChange = () => {
            if (duration !== audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                setDuration(audio.duration);
            } else if (!isFinite(audio.duration) || audio.duration <= 0) {
                setDuration(0);
            }
        };
        const onMainSeeking = () => {};
        const onMainSeeked = () => {
            if (Reproduciendo && audio.paused) {
                if (audio.readyState < 3) {
                    setCargando(true);
                }
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    })
                    .catch((e) => {
                        console.error("Playback error:", e);
                        setPlayerError(`Error al reproducir: ${cancionActual?.titulo || 'canción'}. Permita la reproducción automática en su navegador.`);
                        setReproduciendo(false);
                        setCargando(false);
                        userInitiatedPlayRef.current = false;
                    });
            }
        };
        const onMainPlay = () => {
            setReproduciendo(true);
            setCargando(false);
        };
        const onMainPause = () => {
            setReproduciendo(false);
            setCargando(false);
            userInitiatedPlayRef.current = false;
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
        if (preloadAudioElement) {
            let nextSongIndexToPreload = -1;
            if (colaActual.length > 0) {
                const potentialNextIndex = cancionActualIndex !== -1 ? cancionActualIndex + 1 : 0;
                if (loopingOne) {
                    nextSongIndexToPreload = -1;
                } else if (potentialNextIndex < colaActual.length) {
                    nextSongIndexToPreload = potentialNextIndex;
                } else if (looping && colaActual.length > 0 && cancionActualIndex !== -1) {
                    nextSongIndexToPreload = 0;
                } else if (colaActual.length > 0 && cancionActualIndex === -1 && !looping) {
                    nextSongIndexToPreload = 0;
                } else {
                    nextSongIndexToPreload = -1;
                }
            }
            const songToPreload = nextSongIndexToPreload !== -1 ? colaActual[nextSongIndexToPreload] : null;
            const preloadUrl = songToPreload ? getAudioUrl(songToPreload) : null;
            const currentAudioUrl = cancionActual ? getAudioUrl(cancionActual) : null;
            if (songToPreload && nextSongIndexToPreload !== cancionActualIndex && preloadUrl && preloadAudioElement.src !== preloadUrl) {
                preloadAudioElement.src = preloadUrl;
                preloadAudioElement.load();
                setPreloadedSongIndex(nextSongIndexToPreload);
            } else if ((!songToPreload || nextSongIndexToPreload === cancionActualIndex) && preloadAudioElement.src) {
                preloadAudioElement.removeAttribute('src');
                preloadAudioElement.load();
                setPreloadedSongIndex(null);
            }
            const onPreloadLoadedMetadata = () => {};
            const onPreloadCanPlay = () => {};
            const onPreloadLoadStart = () => {};
            const onPreloadError = (e) => {
                console.error("Preload error:", e);
                setPreloadedSongIndex(null);
            };
            preloadAudioElement.addEventListener('loadedmetadata', onPreloadLoadedMetadata);
            preloadAudioElement.addEventListener('canplay', onPreloadCanPlay);
            preloadAudioElement.addEventListener('error', onPreloadError);
            preloadAudioElement.addEventListener('loadstart', onPreloadLoadStart);
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
                audio.removeEventListener('play', onMainPlay);
                audio.removeEventListener('pause', onMainPause);
                preloadAudioElement.removeEventListener('loadedmetadata', onPreloadLoadedMetadata);
                preloadAudioElement.removeEventListener('canplay', onPreloadCanPlay);
                preloadAudioElement.removeEventListener('error', onPreloadError);
                preloadAudioElement.removeEventListener('loadstart', onPreloadLoadStart);
            };
        } else {
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
                audio.removeEventListener('play', onMainPlay);
                audio.removeEventListener('pause', onMainPause);
            };
        }
    }, [
        siguienteCancion,
        duration,
        limpiarErrores,
        getAudioUrl,
        colaActual,
        looping,
        loopingOne, // Añadido
        cancionActualIndex,
        preloadedSongIndex,
        Reproduciendo,
        userInitiatedPlayRef,
        cancionActual,
        play, // Añadido
        seek // Añadido
    ]);

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
                loopingOne,
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
                añadirSiguiente,
            }}
        >
            {children}
            <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
            <audio ref={preloadAudioRef} preload="metadata" style={{ display: 'none' }} />
        </PlayerContext.Provider>
    );
};

export { PlayerContext };
