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
    const [colaOriginal, setColaOriginal] = useState(() => {
        try {
            const saved = sessionStorage.getItem('colaOriginal_player');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [reservasRecomendadas, setReservasRecomendadas] = useState([]);
    const [colaAleatoria, setColaAleatoria] = useState(() => {
        try {
            const saved = sessionStorage.getItem('colaAleatoria_player');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [cancionActualIndex, setCancionActualIndex] = useState(() => {
        const saved = sessionStorage.getItem('cancionActualIndex_player');
        return saved !== null ? Number(saved) : -1;
    });
    const [Reproduciendo, setReproduciendo] = useState(false);
    const [tiempoActual, setTiempoActual] = useState(0);
    const [duration, setDuracion] = useState(0);
    const [volumen, setVolumen] = useState(0.5);
    const [aleatorio, setAleatorio] = useState(false);
    const [looping, setLooping] = useState(false);
    const [loopingOne, setLoopingOne] = useState(false);
    const [sourceId, setSourceId] = useState(() => sessionStorage.getItem('sourceId_player') || null);
    const [cargando, setCargando] = useState(false);
    const [playerError, setPlayerError] = useState(null);
    const audioRef = useRef(null);
    const precargarAudioRef = useRef(null);
    const [cancionPrecargadaIndex, setcancionPrecargadaIndex] = useState(null);
    const usuarioInicioPlayRef = useRef(false);
    const conteoRef = useRef(false);

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

    useEffect(() => {
        try {
            sessionStorage.setItem('colaOriginal_player', JSON.stringify(colaOriginal));
        } catch (e) {
        }
    }, [colaOriginal]);

    useEffect(() => {
        try {
            sessionStorage.setItem('colaAleatoria_player', JSON.stringify(colaAleatoria));
        } catch (e) {
        }
    }, [colaAleatoria]);

    useEffect(() => {
        if (sourceId !== null) {
            sessionStorage.setItem('sourceId_player', sourceId);
        } else {
            sessionStorage.removeItem('sourceId_player');
        }
    }, [sourceId]);

    const limpiarErrores = useCallback(() => {
        setPlayerError(null);
    }, []);

    const reiniciarPlayer = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        if (precargarAudioRef.current) {
            precargarAudioRef.current.src = '';
        }
        setColaOriginal([]);
        setReservasRecomendadas([]);
        setColaAleatoria([]);
        setCancionActualIndex(-1);
        setcancionPrecargadaIndex(null);
        setReproduciendo(false);
        setTiempoActual(0);
        setDuracion(0);
        setSourceId(null);
        setCargando(false);
        limpiarErrores();
        sessionStorage.removeItem('cancionActualIndex_player');
        sessionStorage.removeItem('colaOriginal_player');
        sessionStorage.removeItem('colaAleatoria_player');
        sessionStorage.removeItem('sourceId_player');
        usuarioInicioPlayRef.current = false;
    }, [limpiarErrores]);

    const colaActual = aleatorio ? colaAleatoria : colaOriginal;
    const cancionActual = colaActual[cancionActualIndex] || null;

    const pause = useCallback(() => {
        audioRef.current?.pause();
        setReproduciendo(false);
        setCargando(false);
        usuarioInicioPlayRef.current = false;
    }, []);

    const play = useCallback(() => {
        limpiarErrores();
        const audio = audioRef.current;
        if (!audio) {
            return;
        }
        if (cancionActual) {
            if (Reproduciendo) {
                pause();
            } else {
                usuarioInicioPlayRef.current = true;
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        usuarioInicioPlayRef.current = false;
                    })
                    .catch((e) => {
                        setReproduciendo(false);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    });
            }
        } else if (colaActual.length > 0) {
            const valorInicial = cancionActualIndex === -1 ? 0 : cancionActualIndex;
            setCancionActualIndex(valorInicial);
            setReproduciendo(true);
            usuarioInicioPlayRef.current = true;
        } else {
            reiniciarPlayer();
        }
    }, [cancionActual, colaActual, Reproduciendo, pause, limpiarErrores, reiniciarPlayer, cancionActualIndex]);

    const busqueda = useCallback((time) => {
        const audio = audioRef.current;
        if (audio && isFinite(time) && duration > 0) {
            limpiarErrores();
            const nuevoTiempo = Math.max(0, Math.min(time, duration));
            audio.currentTime = nuevoTiempo;
            setTiempoActual(nuevoTiempo);
        }
    }, [duration, limpiarErrores]);

    const setVolumenCallback = useCallback((v) => {
        const nuevoVolumen = Math.max(0, Math.min(1, v));
        setVolumen(nuevoVolumen);
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

        if (loopingOne || (looping && colaActual.length === 1)) {
            busqueda(0);
            if (!Reproduciendo) {
                play();
            }
            return;
        }

        let siguienteIndex = cancionActualIndex + 1;
        while (
            siguienteIndex < colaActual.length &&
            colaActual[siguienteIndex]?.id === cancionActual?.id
        ) {
            siguienteIndex++;
        }
        const ultimoEnCola = siguienteIndex >= colaActual.length;
        const cancionUnica = colaActual.length === 1;
        if (ultimoEnCola) {
            if (looping) {
                siguienteIndex = 0;
                if (aleatorio) {
                    const todasCanciones = colaOriginal.concat(
                        reservasRecomendadas.filter(r => !colaOriginal.some(o => o.id === r.id))
                    );
                    const nuevaColaAleatoria = arrayAleatorio(todasCanciones);
                    setColaAleatoria(nuevaColaAleatoria);
                    siguienteIndex = 0;
                    setReservasRecomendadas([]);
                }
            } else if (cancionUnica && !looping && reservasRecomendadas.length === 0) {
                busqueda(0);
                return;
            } else if (!aleatorio && !looping && reservasRecomendadas.length > 0) {
                const actualizarColaOriginal = [...colaOriginal, ...reservasRecomendadas];
                setColaOriginal(actualizarColaOriginal);
                setCargando(true);
                setCancionActualIndex(colaActual.length);
                setReproduciendo(true);
                setReservasRecomendadas([]);
                setSourceId(null);
                return;
            } else if (aleatorio && !looping && reservasRecomendadas.length > 0) {
                const originalConReservadas = [...colaOriginal, ...reservasRecomendadas];
                setColaOriginal(originalConReservadas);
                const colaRestante = colaActual.slice(cancionActualIndex + 1);
                const recommendationsToAdd = reservasRecomendadas.filter(r =>
                    !colaRestante.some(s => s.id === r.id) &&
                    !colaOriginal.some(o => o.id === r.id)
                );
                const combinarAleatorio = [...colaRestante, ...recommendationsToAdd];
                const aleatorioRestante = arrayAleatorio(combinarAleatorio);
                const nuevoAleatorio = [...colaAleatoria.slice(0, cancionActualIndex + 1), ...aleatorioRestante];
                setColaAleatoria(nuevoAleatorio);
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
        const objetivoIndex = siguienteIndex;
        const cancionObjetivo = colaActual[objetivoIndex];
        const cancionPrecargada = cancionPrecargadaIndex !== null && cancionPrecargadaIndex < colaActual.length ? colaActual[cancionPrecargadaIndex] : null;
        if (
            cancionPrecargada &&
            cancionPrecargada.id === cancionObjetivo.id &&
            precargarAudioRef.current &&
            audioRef.current
        ) {
            const audioPrincipal = audioRef.current;
            const precargarAudio = precargarAudioRef.current;
            audioPrincipal.src = precargarAudio.src;
            audioPrincipal.currentTime = 0;
            setTiempoActual(0);
            audioPrincipal.volume = precargarAudio.volume;
            if (precargarAudio.duration && isFinite(precargarAudio.duration)) {
                setDuracion(precargarAudio.duration);
            } else {
                const onLoadedMetadata = () => {
                    setDuracion(audioPrincipal.duration || 0);
                    audioPrincipal.removeEventListener('loadedmetadata', onLoadedMetadata);
                };
                audioPrincipal.addEventListener('loadedmetadata', onLoadedMetadata);
            }
            precargarAudio.removeAttribute('src');
            precargarAudio.load();
            setcancionPrecargadaIndex(null);
            setCargando(true);
            setCancionActualIndex(objetivoIndex);
            if (Reproduciendo) {} else {
                setCargando(false);
            }
            usuarioInicioPlayRef.current = true;
            setTimeout(() => {
                audioPrincipal.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    })
                    .catch((e) => {
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    });
            }, 50);
        } else {
            setCargando(true);
            setCancionActualIndex(objetivoIndex);
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
        cancionPrecargadaIndex,
        busqueda,
        getAudioUrl,
        cancionActual,
        play
    ]);

    const anteriorCancion = useCallback(() => {
        if (colaActual.length === 0) return;
        limpiarErrores();

        if (loopingOne) {
            busqueda(0);
            if (!Reproduciendo) {
                play();
            }
            return;
        }

        let anteriorIndex = cancionActualIndex - 1;
        if (anteriorIndex < 0) {
            if (looping) {
                anteriorIndex = colaActual.length - 1;
            } else {
                busqueda(0);
                return;
            }
        }
        const objetivoIndex = anteriorIndex;
        const cancionObjetivo = colaActual[objetivoIndex];
        const cancionPrecargada = cancionPrecargadaIndex !== null && cancionPrecargadaIndex < colaActual.length ? colaActual[cancionPrecargadaIndex] : null;
        if (cancionPrecargada && cancionPrecargada.id === cancionObjetivo.id && precargarAudioRef.current && audioRef.current) {
            const audioPrincipal = audioRef.current;
            const precargarAudio = precargarAudioRef.current;
            audioPrincipal.src = precargarAudio.src;
            audioPrincipal.currentTime = 0;
            setTiempoActual(0);
            audioPrincipal.volume = precargarAudio.volume;
            if (precargarAudio.duration && isFinite(precargarAudio.duration)) {
                setDuracion(precargarAudio.duration);
            } else {
                const onLoadedMetadata = () => {
                    setDuracion(audioPrincipal.duration || 0);
                    audioPrincipal.removeEventListener('loadedmetadata', onLoadedMetadata);
                };
                audioPrincipal.addEventListener('loadedmetadata', onLoadedMetadata);
            }
            precargarAudio.removeAttribute('src');
            precargarAudio.load();
            setcancionPrecargadaIndex(null);
            setCargando(true);
            setCancionActualIndex(objetivoIndex);
            if (Reproduciendo) {} else {
                setCargando(false);
            }
            usuarioInicioPlayRef.current = true;
            setTimeout(() => {
                audioPrincipal.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    })
                    .catch((e) => {
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    });
            }, 50);
        } else {
            setCargando(true);
            setCancionActualIndex(objetivoIndex);
        }
    }, [colaActual, cancionActualIndex, looping, loopingOne, limpiarErrores, busqueda, Reproduciendo, cancionPrecargadaIndex, getAudioUrl, play]);

    const cargarColaYIniciar = useCallback((canciones, opciones = {}) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        if (precargarAudioRef.current) {
            precargarAudioRef.current.src = '';
        }
        limpiarErrores();
        setReproduciendo(false);
        setCargando(false);
        setTiempoActual(0);
        setDuracion(0);
        const validas = canciones.filter(s => s.id && s.titulo && getAudioUrl(s));
        if (validas.length === 0) {
            return reiniciarPlayer();
        }
        setSourceId(opciones.id ?? null);
        setReservasRecomendadas([]);
        let inicioIndex = opciones.iniciar ?? 0;
        let nuevaAleatoria = [];
        if (aleatorio) {
            const clickDirecto = opciones.clickDirecto === true;
            if (clickDirecto && Number.isInteger(inicioIndex) && inicioIndex >= 0 && inicioIndex < validas.length) {
                const clickado = validas[inicioIndex];
                const restantes = validas.filter((_, i) => i !== inicioIndex);
                nuevaAleatoria = [clickado, ...arrayAleatorio(restantes)];
            } else {
                nuevaAleatoria = arrayAleatorio(validas);
            }
            setColaAleatoria(nuevaAleatoria);
            inicioIndex = 0;
        } else {
            setColaAleatoria([]);
        }
        setColaOriginal(validas);
        const inicioValidoIndex = Math.max(0, Math.min(inicioIndex, validas.length - 1));
        setCancionActualIndex(inicioValidoIndex);
        setReproduciendo(true);
        usuarioInicioPlayRef.current = true;
    }, [aleatorio, reiniciarPlayer, limpiarErrores, getAudioUrl]);

    const añadirSiguiente = useCallback((song) => {
        limpiarErrores();
        if (!song || !song.id || !song.titulo || !getAudioUrl(song)) {
            return;
        }
        if (cancionActualIndex === -1) {
            return;
        }
        const insertarIndex = cancionActualIndex + 1;
        if (aleatorio) {
            setColaAleatoria(anteriorColaAleatoria => {
                const nuevaColaAleatoria = [...anteriorColaAleatoria];
                if (insertarIndex <= nuevaColaAleatoria.length) {
                    nuevaColaAleatoria.splice(insertarIndex, 0, song);
                } else {
                    return anteriorColaAleatoria;
                }
                return nuevaColaAleatoria;
            });
            setColaOriginal(anteriorColaOriginal => {
                if (!anteriorColaOriginal.some(s => s.id === song.id)) {
                    return [...anteriorColaOriginal, song];
                }
                return anteriorColaOriginal;
            });
        } else {
            setColaOriginal(anteriorColaOriginal => {
                const nuevaColaOriginal = [...anteriorColaOriginal];
                if (insertarIndex <= nuevaColaOriginal.length) {
                    nuevaColaOriginal.splice(insertarIndex, 0, song);
                } else {
                    return anteriorColaOriginal;
                }
                return nuevaColaOriginal;
            });
        }
        setcancionPrecargadaIndex(null);
    }, [cancionActualIndex, aleatorio, limpiarErrores, getAudioUrl]);

    const toggleAleatorio = useCallback(() => {
        limpiarErrores();
        const siguiente = !aleatorio;
        setAleatorio(siguiente);
        if (colaOriginal.length > 0) {
            const actualId = cancionActual?.id;
            if (siguiente) {
                const colaBarajada = arrayAleatorio(colaOriginal);
                setColaAleatoria(colaBarajada);
                const nuevoIndex = colaBarajada.findIndex(t => t.id === actualId);
                setCancionActualIndex(nuevoIndex !== -1 ? nuevoIndex : 0);
            } else {
                setColaAleatoria([]);
                const nuevoIndex = colaOriginal.findIndex(t => t.id === actualId);
                setCancionActualIndex(nuevoIndex !== -1 ? nuevoIndex : 0);
            }
        } else {
            setCancionActualIndex(-1);
        }
    }, [aleatorio, colaOriginal, cancionActual, limpiarErrores]);

    const toggleLoop = useCallback(() => {
        limpiarErrores();
        setLooping(anteriorLooping => {
            if (anteriorLooping && !loopingOne) {
                setLoopingOne(true);
                return true;
            } else if (anteriorLooping && loopingOne) {
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
            usuarioInicioPlayRef.current = true;
        }
    }, [limpiarErrores, colaActual.length, colaActual]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volumen;
        }
        if (precargarAudioRef.current) {
            precargarAudioRef.current.volume = volumen;
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
            setDuracion(0);
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
            setDuracion(0);
            usuarioInicioPlayRef.current = false;
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
                    usuarioInicioPlayRef.current = false;
                })
                .catch((e) => {
                    setReproduciendo(false);
                    setCargando(false);
                    usuarioInicioPlayRef.current = false;
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
                usuarioInicioPlayRef.current = false;
            }
        }
    }, [Reproduciendo, cancionActual, limpiarErrores]);

    useEffect(() => {
        const audio = audioRef.current;
        const cancionPrecargada = precargarAudioRef.current;
        if (!audio) return;
        const establecerTiempoReproduccion = () => {
            setTiempoActual(audio.currentTime);
            if (audio.currentTime >= 10 && !conteoRef.current && cancionActual) {
                conteoRef.current = true;

                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

                if (!csrfToken) {
                    return;
                }

                fetch(`/canciones/${cancionActual.id}/incrementar-visualizacion`, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                })
                .then(response => {
                    if (!response.ok) {
                    }
                    return response.json();
                })
                .then(data => {
                })
                .catch(err => {
                });
            }
        };
        const cargarMetadataCancion = () => {
            if (isFinite(audio.duration) && audio.duration > 0) {
                setDuracion(audio.duration);
            } else {
                setDuracion(0);
            }
            if (usuarioInicioPlayRef.current && Reproduciendo) {
                if (audio.readyState < 3) {
                    setCargando(true);
                }
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    })
                    .catch((e) => {
                        setReproduciendo(false);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    });
            }
        };
        const puedeReproducir = () => {
            setCargando(false);
            if (usuarioInicioPlayRef.current && Reproduciendo && audio.paused) {
                if (audio.readyState < 3) {
                    setCargando(true);
                }
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    })
                    .catch((e) => {
                        setReproduciendo(false);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    });
            }
        };
        const reproduciendo = () => {
            setCargando(false);
            setReproduciendo(true);
            usuarioInicioPlayRef.current = false;
        };
        const esperando = () => {
            setCargando(true);
        };
        const terminado = () => {
            if (loopingOne) {
                busqueda(0);
                if (!Reproduciendo) {
                    play();
                }
            } else {
                siguienteCancion();
            }
        };
        const errores = (e) => {
            setCargando(false);
            setReproduciendo(false);
            usuarioInicioPlayRef.current = false;
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
        const cargarInicio = () => {
            setCargando(true);
        };
        const cambiarDuracion = () => {
            if (duration !== audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                setDuracion(audio.duration);
            } else if (!isFinite(audio.duration) || audio.duration <= 0) {
                setDuracion(0);
            }
        };
        const busquedaPrincipal = () => {};
        const busquedaPrincipalHecha = () => {
            if (Reproduciendo && audio.paused) {
                if (audio.readyState < 3) {
                    setCargando(true);
                }
                audio.play()
                    .then(() => {
                        setReproduciendo(true);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    })
                    .catch((e) => {
                        setReproduciendo(false);
                        setCargando(false);
                        usuarioInicioPlayRef.current = false;
                    });
            }
        };
        const reproducir = () => {
            setReproduciendo(true);
            setCargando(false);
        };
        const pausar = () => {
            setReproduciendo(false);
            setCargando(false);
            usuarioInicioPlayRef.current = false;
        };
        audio.addEventListener('timeupdate', establecerTiempoReproduccion);
        audio.addEventListener('loadedmetadata', cargarMetadataCancion);
        audio.addEventListener('canplay', puedeReproducir);
        audio.addEventListener('playing', reproduciendo);
        audio.addEventListener('waiting', esperando);
        audio.addEventListener('ended', terminado);
        audio.addEventListener('error', errores);
        audio.addEventListener('loadstart', cargarInicio);
        audio.addEventListener('durationchange', cambiarDuracion);
        audio.addEventListener('seeking', busquedaPrincipal);
        audio.addEventListener('seeked', busquedaPrincipalHecha);
        audio.addEventListener('play', reproducir);
        audio.addEventListener('pause', pausar);
        if (cancionPrecargada) {
            let siguienteCancionPrecargar = -1;
            if (colaActual.length > 0) {
                const siguienteCancionPotencial = cancionActualIndex !== -1 ? cancionActualIndex + 1 : 0;
                if (loopingOne) {
                    siguienteCancionPrecargar = -1;
                } else if (siguienteCancionPotencial < colaActual.length) {
                    siguienteCancionPrecargar = siguienteCancionPotencial;
                } else if (looping && colaActual.length > 0 && cancionActualIndex !== -1) {
                    siguienteCancionPrecargar = 0;
                } else if (colaActual.length > 0 && cancionActualIndex === -1 && !looping) {
                    siguienteCancionPrecargar = 0;
                } else {
                    siguienteCancionPrecargar = -1;
                }
            }
            const cancionAPrecargar = siguienteCancionPrecargar !== -1 ? colaActual[siguienteCancionPrecargar] : null;
            const urlCancionPrecargada = cancionAPrecargar ? getAudioUrl(cancionAPrecargar) : null;
            if (cancionAPrecargar && siguienteCancionPrecargar !== cancionActualIndex && urlCancionPrecargada && cancionPrecargada.src !== urlCancionPrecargada) {
                cancionPrecargada.src = urlCancionPrecargada;
                cancionPrecargada.load();
                setcancionPrecargadaIndex(siguienteCancionPrecargar);
            } else if ((!cancionAPrecargar || siguienteCancionPrecargar === cancionActualIndex) && cancionPrecargada.src) {
                cancionPrecargada.removeAttribute('src');
                cancionPrecargada.load();
                setcancionPrecargadaIndex(null);
            }
            const cargarMetadataPrecargada = () => {};
            const precargadaReproducir = () => {};
            const precargadaCargarIniciar = () => {};
            const erroresPrecargada = (e) => {
                setcancionPrecargadaIndex(null);
            };
            cancionPrecargada.addEventListener('loadedmetadata', cargarMetadataPrecargada);
            cancionPrecargada.addEventListener('canplay', precargadaReproducir);
            cancionPrecargada.addEventListener('error', erroresPrecargada);
            cancionPrecargada.addEventListener('loadstart', precargadaCargarIniciar);
            return () => {
                audio.removeEventListener('timeupdate', establecerTiempoReproduccion);
                audio.removeEventListener('loadedmetadata', cargarMetadataCancion);
                audio.removeEventListener('canplay', puedeReproducir);
                audio.removeEventListener('playing', reproduciendo);
                audio.removeEventListener('waiting', esperando);
                audio.removeEventListener('ended', terminado);
                audio.removeEventListener('error', errores);
                audio.removeEventListener('loadstart', cargarInicio);
                audio.removeEventListener('durationchange', cambiarDuracion);
                audio.removeEventListener('seeking', busquedaPrincipal);
                audio.removeEventListener('seeked', busquedaPrincipalHecha);
                audio.removeEventListener('play', reproducir);
                audio.removeEventListener('pause', pausar);
                cancionPrecargada.removeEventListener('loadedmetadata', cargarMetadataPrecargada);
                cancionPrecargada.removeEventListener('canplay', precargadaReproducir);
                cancionPrecargada.removeEventListener('error', erroresPrecargada);
                cancionPrecargada.removeEventListener('loadstart', precargadaCargarIniciar);
            };
        } else {
            return () => {
                audio.removeEventListener('timeupdate', establecerTiempoReproduccion);
                audio.removeEventListener('loadedmetadata', cargarMetadataCancion);
                audio.removeEventListener('canplay', puedeReproducir);
                audio.removeEventListener('playing', reproduciendo);
                audio.removeEventListener('waiting', esperando);
                audio.removeEventListener('ended', terminado);
                audio.removeEventListener('error', errores);
                audio.removeEventListener('loadstart', cargarInicio);
                audio.removeEventListener('durationchange', cambiarDuracion);
                audio.removeEventListener('seeking', busquedaPrincipal);
                audio.removeEventListener('seeked', busquedaPrincipalHecha);
                audio.removeEventListener('play', reproducir);
                audio.removeEventListener('pause', pausar);
            };
        }
    }, [
        siguienteCancion,
        duration,
        limpiarErrores,
        getAudioUrl,
        colaActual,
        looping,
        loopingOne,
        cancionActualIndex,
        cancionPrecargadaIndex,
        Reproduciendo,
        usuarioInicioPlayRef,
        cancionActual,
        play,
        busqueda
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
                busqueda,
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
            <audio ref={precargarAudioRef} preload="metadata" style={{ display: 'none' }} />
        </PlayerContext.Provider>
    );
};

export { PlayerContext };
