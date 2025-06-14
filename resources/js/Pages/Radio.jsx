import { Head } from '@inertiajs/react';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Radio() {
    const [estaciones, setEstaciones] = useState([]);
    const [estacionSeleccionada, setEstacionSeleccionada] = useState(null);
    const [genero, setGenero] = useState('');
    const [pais, setPais] = useState('');
    const [tituloCancionActual, setTituloCancionActual] = useState(null);
    const [letraCancion, setLetraCancion] = useState(null);
    const [buscandoLetra, setBuscandoLetra] = useState(false);
    const [todosLosGeneros, setTodosLosGeneros] = useState([]);
    const [todosLosPaises, setTodosLosPaises] = useState([]);

    const { cargarColaYIniciar, cargando } = usePlayer();

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
                const resGeneros = await axios.get('https://fi1.api.radio-browser.info/json/tags');
                const generosOrdenados = resGeneros.data
                    .filter(tag => tag.name && tag.stationcount > 0)
                    .sort((a, b) => b.stationcount - a.stationcount)
                    .slice(0, 200)
                    .map(tag => tag.name)
                    .sort((a, b) => a.localeCompare(b));
                setTodosLosGeneros(generosOrdenados);

                const resPaises = await axios.get('https://fi1.api.radio-browser.info/json/countries');
                const paisesApi = resPaises.data
                    .filter(country => country.name && country.stationcount > 0)
                    .sort((a, b) => b.stationcount - a.stationcount)
                    .slice(0, 50);

                const mapaPaisesCombinados = new Map();
                paisesPredefinidos.forEach(country => mapaPaisesCombinados.set(country.code, country));
                paisesApi.forEach(country => {
                    if (!mapaPaisesCombinados.has(country.iso_3166_1)) {
                        mapaPaisesCombinados.set(country.iso_3166_1, { code: country.iso_3166_1, name: country.name });
                    }
                });

                const paisesFinales = Array.from(mapaPaisesCombinados.values()).sort((a, b) => a.name.localeCompare(b.name));
                setTodosLosPaises(paisesFinales);
            } catch (error) {
                console.error("Error al obtener opciones:", error);
            }
        };

        obtenerOpciones();
    }, []);

    const buscarEstaciones = useCallback(async () => {
        try {
            let url = '';
            const baseUrl = 'https://fi1.api.radio-browser.info/json/stations/search';
            const parametros = new URLSearchParams();
            parametros.append('hidebroken', 'true');
            parametros.append('order', 'votes');
            parametros.append('reverse', 'true');
            parametros.append('limit', '50');

            let tieneFiltros = false;
            if (genero) {
                parametros.append('tag', genero);
                tieneFiltros = true;
            }
            if (pais) {
                parametros.append('countrycode', pais);
                tieneFiltros = true;
            }

            if (!tieneFiltros) {
                url = 'https://fi1.api.radio-browser.info/json/stations/search?limit=10&hidebroken=true&order=votes&reverse=true';
            } else {
                url = `${baseUrl}?${parametros.toString()}`;
            }

            const res = await axios.get(url);
            const ordenadas = [...res.data].sort((a, b) => b.votes - a.votes);
            setEstaciones(ordenadas);

            if (ordenadas.length > 0) {
                const primeraEstacion = ordenadas[0];
                setEstacionSeleccionada(primeraEstacion);
                reproducirRadio(primeraEstacion);
            } else {
                setEstacionSeleccionada(null);
                cargarColaYIniciar([], { iniciar: 0 });
            }
        } catch (err) {
            console.error(err);
            setEstaciones([]);
            setEstacionSeleccionada(null);
            cargarColaYIniciar([], { iniciar: 0 });
        }
    }, [genero, pais, cargarColaYIniciar]);

    useEffect(() => {
        buscarEstaciones();
    }, [genero, pais, buscarEstaciones]);

    const reproducirRadio = useCallback(emisora => {
        if (!emisora?.url_resolved) return;
        setEstacionSeleccionada(emisora);

        const colaUnicaEstacion = [{
            id: emisora.stationuuid,
            titulo: emisora.name,
            artista: emisora.country || '',
            archivo_url: emisora.url_resolved,
            cover: emisora.favicon || '',
            extra: emisora,
        }];
        cargarColaYIniciar(colaUnicaEstacion, { iniciar: 0 });
    }, [cargarColaYIniciar]);

    useEffect(() => {
        if (!estacionSeleccionada?.url_resolved) {
            setTituloCancionActual(null);
            setLetraCancion(null);
            return;
        }

        const obtenerTituloYLetra = async () => {
            try {
                setLetraCancion(null);
                setBuscandoLetra(true);

                const res = await axios.get('http://localhost:3001/metadata', {
                    params: { url: estacionSeleccionada.url_resolved }
                });

                const tituloCompleto = res.data.title;
                setTituloCancionActual(tituloCompleto);

                if (tituloCompleto) {
                    const partes = tituloCompleto.split(' - ');
                    const artista = partes.length > 1 ? partes[0].trim() : '';
                    const titulo = partes.length > 1 ? partes[1].trim() : partes[0].trim();

                    if (!titulo) {
                        setLetraCancion('No se encontró un título de canción válido para buscar letras.');
                        setBuscandoLetra(false);
                        return;
                    }

                    try {
                        const artistaCodificado = encodeURIComponent(artista || ' ');
                        const tituloCodificado = encodeURIComponent(titulo);
                        const resLetra = await axios.get(`https://api.lyrics.ovh/v1/${artistaCodificado}/${tituloCodificado}`);

                        if (resLetra.status === 404) {
                            setLetraCancion('No se encontraron letras para esta canción. El título o artista podría no coincidir.');
                        } else {
                            setLetraCancion(resLetra.data.lyrics || 'No hay letra disponible.');
                        }
                    } catch (errorLetras) {
                        console.error('Error al obtener letras:', errorLetras);
                        setLetraCancion('Ocurrió un error al cargar las letras. Inténtalo de nuevo más tarde.');
                    }
                } else {
                    setLetraCancion('No hay letra disponible.');
                }
            } catch (err) {
                console.error('No se pudo obtener el título actual:', err);
                setTituloCancionActual(null);
                setLetraCancion('No hay letra disponible.');
            } finally {
                setBuscandoLetra(false);
            }
        };

        obtenerTituloYLetra();
        const idIntervalo = setInterval(obtenerTituloYLetra, 30000);
        return () => clearInterval(idIntervalo);
    }, [estacionSeleccionada]);

    const truncarTexto = (texto, max) =>
        texto.length > max ? texto.slice(0, max - 3) + '...' : texto;

    return (
        <AuthenticatedLayout>
            <Head title="Radio" />
            <div className="py-5 pt-20">
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
                                                onChange={e => { setGenero(e.target.value); setPais('') }}
                                                className={`p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-64 truncate ${cargando ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                disabled={cargando}
                                        >
                                                <option value="">Seleccionar género</option>
                                                {todosLosGeneros.map(g => (
                                                        <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                                                ))}
                                        </select>
                                </div>
                                <div>
                                        <select
                                                value={pais}
                                                onChange={e => { setPais(e.target.value); setGenero('') }}
                                                className={`p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-64 truncate ${cargando ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                disabled={cargando}
                                        >
                                                <option value="">Seleccionar país</option>
                                                {todosLosPaises.map(c => (
                                                        <option key={c.code} value={c.code}>{c.name}</option>
                                                ))}
                                        </select>
                                </div>
                            </div>
                            {cargando ? (
                                <p className="text-gray-400">Cargando emisoras...</p>
                            ) : estaciones.length === 0 ? (
                                <p className="text-gray-400">No se encontraron radios para esta selección.</p>
                            ) : (
                                <>
                                    <select
                                        key={cargando ? 'cargando' : 'listo'}
                                        value={estacionSeleccionada?.stationuuid || ''}
                                        onChange={e => {
                                            if (cargando) return;
                                            const estacion = estaciones.find(s => s.stationuuid === e.target.value);
                                            reproducirRadio(estacion);
                                        }}
                                        className={`max-w-sm p-3 rounded-lg bg-gray-700 text-white border border-gray-600 mb-4 mx-auto block truncate ${cargando ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        disabled={cargando}
                                    >
                                        {estaciones.map(e => (
                                            <option key={e.stationuuid} value={e.stationuuid}>
                                                {truncarTexto(e.name + ` (${e.votes} votos)`, 40)}
                                            </option>
                                        ))}
                                    </select>
                                    {tituloCancionActual && (
                                        <>
                                            {estacionSeleccionada?.favicon && (
                                                <div className="flex justify-center mb-4">
                                                    <img
                                                        src={estacionSeleccionada.favicon}
                                                        alt="Cover de la emisora"
                                                        className="w-32 h-32 object-cover rounded-lg shadow-md"
                                                    />
                                                </div>
                                            )}
                                            <p className="text-center text-blue-300 font-semibold mb-4">
                                                🎵 Reproduciendo: {tituloCancionActual}
                                            </p>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {buscandoLetra ? (
                    <p className="text-gray-400">Cargando letras...</p>
                ) : letraCancion ? (
                    <div className="max-w-4xl mx-auto mt-6 px-4 text-white whitespace-pre-wrap">
                        <h2 className="text-xl font-bold text-blue-400 mb-2 text-center">Letra de la canción</h2>
                        <p className="text-center">{letraCancion.replace(/(\r\n|\r|\n){2,}/g, '\n')}</p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center">No hay letras disponibles para la canción actual o no se pudo encontrar.</p>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
