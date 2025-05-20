import { Head } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Radio() {
    const [emisoras, setEmisoras] = useState([]);
    const [emisoraSeleccionada, setEmisoraSeleccionada] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [genero, setGenero] = useState('');
    const [pais, setPais] = useState('');
    const [tituloCancionActual, setTituloCancionActual] = useState('Cargando título...');
    const { cargarColaYIniciar } = usePlayer();
    const [letraCancion, setLetraCancion] = useState('No hay letra disponible.');
    const [buscandoLetra, setBuscandoLetra] = useState(false);
    const [allGenres, setAllGenres] = useState([]);
    const [allCountries, setAllCountries] = useState([]);

    const intervalRef = useRef(null);

    const paisesPredefinidos = [
        { code: 'US', name: 'Estados Unidos' },
        { code: 'CO', name: 'Colombia' },
        { code: 'AR', name: 'Argentina' },
        { code: 'BR', name: 'Brasil' },
        { code: 'FR', name: 'Francia' },
        { code: 'DE', name: 'Alemania' },
        { code: 'GB', name: 'Reino Unido' },
        { code: 'MX', name: 'México' },
        { code: 'ES', name: 'España' }
    ];

    useEffect(() => {
        const obtenerOpciones = async () => {
            try {
                const resGeneros = await axios.get('https://de1.api.radio-browser.info/json/tags');
                const generosOrdenados = resGeneros.data
                    .filter(tag => tag.name && tag.stationcount > 0)
                    .sort((a, b) => b.stationcount - a.stationcount)
                    .slice(0, 200)
                    .map(tag => tag.name)
                    .sort((a, b) => a.localeCompare(b));
                setAllGenres(generosOrdenados);

                const resPaises = await axios.get('https://de1.api.radio-browser.info/json/countries');
                const paisesApi = resPaises.data
                    .filter(country => country.name && country.stationcount > 0)
                    .sort((a, b) => b.stationcount - a.stationcount)
                    .slice(0, 50);

                const mapaPaises = new Map();
                paisesPredefinidos.forEach(pais => mapaPaises.set(pais.code, pais));
                paisesApi.forEach(pais => {
                    if (!mapaPaises.has(pais.iso_3166_1)) {
                        mapaPaises.set(pais.iso_3166_1, { code: pais.iso_3166_1, name: pais.name });
                    }
                });

                const paisesFinales = Array.from(mapaPaises.values()).sort((a, b) => a.name.localeCompare(b.name));
                setAllCountries(paisesFinales);

            } catch (error) {
                console.error("Error al cargar opciones de géneros o países.");
            }
        };
        obtenerOpciones();
    }, []);

    const buscarEmisoras = async () => {
        setCargando(true);
        try {
            let url = '';
            const baseUrl = 'https://de1.api.radio-browser.info/json/stations/search';
            const params = new URLSearchParams();

            params.append('hidebroken', 'true');
            params.append('order', 'votes');
            params.append('reverse', 'true');
            params.append('limit', '50');

            let hayFiltros = false;
            if (genero) {
                params.append('tag', genero);
                hayFiltros = true;
            }
            if (pais) {
                params.append('countrycode', pais);
                hayFiltros = true;
            }

            if (!hayFiltros) {
                url = 'https://de1.api.radio-browser.info/json/stations/search?limit=10&hidebroken=true&order=votes&reverse=true';
            } else {
                url = `${baseUrl}?${params.toString()}`;
            }

            const res = await axios.get(url);
            const ordenadas = [...res.data].sort((a, b) => b.votes - a.votes);
            setEmisoras(ordenadas);

            if (ordenadas.length > 0) {
                setEmisoraSeleccionada(ordenadas[0]);
                const canciones = ordenadas.map(e => ({
                    id: e.stationuuid,
                    titulo: e.name,
                    artista: e.country || '',
                    archivo_url: e.url_resolved,
                    cover: e.favicon || '',
                    extra: e,
                }));
                cargarColaYIniciar(canciones, { iniciar: 0 });
            } else {
                setEmisoraSeleccionada(null);
                cargarColaYIniciar([], { iniciar: 0 });
            }
        } catch (err) {
            console.error("Error al buscar emisoras.");
            setEmisoras([]);
            setEmisoraSeleccionada(null);
            cargarColaYIniciar([], { iniciar: 0 });
        } finally {
            setCargando(false);
        }
    };

    const obtenerTituloYLetra = async (currentEmisoraSeleccionada) => {
        if (!currentEmisoraSeleccionada?.url_resolved) {
            setTituloCancionActual('No se está reproduciendo ninguna emisora.');
            setLetraCancion('No hay letra disponible.');
            setBuscandoLetra(false);
            return;
        }

        setBuscandoLetra(true);

        try {
            const res = await axios.get('http://localhost:3001/metadata', {
                params: { url: currentEmisoraSeleccionada.url_resolved },
                paramsSerializer: params => {
                    return Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&') + `&_t=${Date.now()}`;
                }
            });

            const tituloCompleto = res.data.title;

            if (tituloCompleto && tituloCompleto !== tituloCancionActual) {
                setTituloCancionActual(tituloCompleto || 'Título no disponible.');

                const partes = tituloCompleto.split(' - ');
                const artista = partes.length > 1 ? partes[0].trim() : '';
                const titulo = partes.length > 1 ? partes[1].trim() : partes[0].trim();

                try {
                    const letraRes = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`);
                    const rawLyrics = letraRes.data.lyrics || '';
                    const normalizedLyrics = rawLyrics.replace(/\r\n|\r/g, '\n');
                    const processedLyrics = normalizedLyrics.replace(/\n{3,}/g, '\n\n').trim();

                    setLetraCancion(processedLyrics || 'No hay letra disponible.');
                } catch (lyricsError) {
                    if (axios.isAxiosError(lyricsError) && lyricsError.response && lyricsError.response.status === 404) {
                        console.warn(`Letra no encontrada para "${artista} - ${titulo}".`);
                    } else {
                        console.error(`Error al obtener letra para "${artista} - ${titulo}":`, lyricsError);
                    }
                    setLetraCancion('No hay letra disponible.');
                }
            } else if (!tituloCompleto) {
                 setTituloCancionActual('Título no disponible.');
                 setLetraCancion('No hay letra disponible.');
            }

        } catch (metadataError) {
            console.error('Error al obtener metadatos de la emisora. Posiblemente la URL de la emisora no tiene metadata o el proxy falló.', metadataError);
            setTituloCancionActual('Título no disponible.');
            setLetraCancion('No hay letra disponible.');
        } finally {
            setBuscandoLetra(false);
        }
    };

    const reproducirRadio = (emisora) => {
        if (!emisora?.url_resolved) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setEmisoraSeleccionada(emisora);

        const canciones = emisoras.map(e => ({
            id: e.stationuuid,
            titulo: e.name,
            artista: e.country || '',
            archivo_url: e.url_resolved,
            cover: e.favicon || '',
            extra: e,
        }));
        const index = emisoras.findIndex(e => e.stationuuid === emisora.stationuuid);
        cargarColaYIniciar(canciones, { iniciar: index >= 0 ? index : 0 });

        obtenerTituloYLetra(emisora);

        intervalRef.current = setInterval(() => {
            obtenerTituloYLetra(emisora);
        }, 15000);
    };


    useEffect(() => {
        buscarEmisoras();
    }, [genero, pais]);

    useEffect(() => {
        if (emisoraSeleccionada?.url_resolved) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
                obtenerTituloYLetra(emisoraSeleccionada);
            }, 30000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setTituloCancionActual('No se está reproduciendo ninguna emisora.');
            setLetraCancion('No hay letra disponible.');
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [emisoraSeleccionada]);

    const truncar = (texto, max) => texto.length > max ? texto.slice(0, max - 3) + '...' : texto;

    return (
        <AuthenticatedLayout>
            <Head title="Radio" />
            <div className="py-12 pt-20">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-gray-800 border-b border-gray-700 text-white">
                            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                Escucha Radio
                            </h1>

                            <div className="flex flex-col md:flex-row gap-2 mb-6 mx-auto w-fit">
                                <div>
                                    <select
                                        value={genero}
                                        onChange={e => { setGenero(e.target.value); setPais(''); }}
                                        className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white max-w-xs truncate"
                                    >
                                        <option value="">Seleccionar género</option>
                                        {allGenres.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <select
                                        value={pais}
                                        onChange={e => { setPais(e.target.value); setGenero(''); }}
                                        className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white max-w-xs truncate"
                                    >
                                        <option value="">Seleccionar país</option>
                                        {allCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {cargando ? (
                                <p>Cargando emisoras...</p>
                            ) : emisoras.length === 0 ? (
                                <p className="text-gray-400">No se encontraron radios para esta selección.</p>
                            ) : (
                                <>
                                    <select
                                        value={emisoraSeleccionada?.stationuuid || ''}
                                        onChange={e => {
                                            const emisora = emisoras.find(s => s.stationuuid === e.target.value);
                                            reproducirRadio(emisora);
                                        }}
                                        className="max-w-sm p-3 rounded-lg bg-gray-700 text-white border border-gray-600 mb-4 mx-auto block truncate"
                                    >
                                        {emisoras.map(e => (
                                            <option key={e.stationuuid} value={e.stationuuid}>
                                                {truncar(e.name + ` (${e.votes} votos)`, 40)}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="text-center text-blue-300 font-semibold mb-4">
                                        🎵 Reproduciendo: {tituloCancionActual}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto mt-6 px-4 text-white whitespace-pre-wrap">
                        <h2 className="text-xl font-bold text-blue-400 mb-2 text-center">Letra de la canción</h2>
                        {buscandoLetra ? (
                            <p className="text-center text-gray-400">Buscando letra...</p>
                        ) : (
                            <p className="text-center">{letraCancion}</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
