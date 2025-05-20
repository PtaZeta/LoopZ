import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Radio() {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [genre, setGenre] = useState('');
    const [country, setCountry] = useState('');
    const audioPlayerRef = useRef(null);

    // Géneros soportados por Radio Browser
    const genreOptions = [
        'pop', 'rock', 'electronic', 'jazz', 'classical', 'metal', 'hiphop', 'reggae', 'country', 'latin'
    ];

    // Países soportados (códigos ISO)
    const countryOptions = [
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

    const fetchStations = async () => {
        if (!genre && !country) return;

        setLoading(true);
        try {
            let url = '';
            if (genre) {
                url = `https://de1.api.radio-browser.info/json/stations/bytag/${genre}?limit=50`;
            } else if (country) {
                url = `https://de1.api.radio-browser.info/json/stations/bycountry/${country}?limit=50`;
            }

            console.log("Fetching from URL:", url); // 👈 Muestra la URL usada

            const res = await axios.get(url);

            console.log("API Response:", res.data); // 👈 Muestra los datos devueltos por la API

            // Ordena las radios por número de votos descendente
            const sortedStations = [...res.data].sort((a, b) => b.votes - a.votes);

            setStations(sortedStations);

            if (sortedStations.length > 0) {
                const first = sortedStations[0];
                setSelectedStation(first);
                setTimeout(() => playRadio(first), 500);
            } else {
                console.log("No se encontraron radios con esta selección.");
            }
        } catch (err) {
            console.error('Error fetching stations:', err);
        } finally {
            setLoading(false);
        }
    };

    const playRadio = (station) => {
        if (audioPlayerRef.current && station.url_resolved) {
            audioPlayerRef.current.src = station.url_resolved;
            audioPlayerRef.current.play();
        }
    };

    const stopRadio = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = '';
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Escuchar Radio</h2>}>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-gray-800 border-b border-gray-700 text-white">
                            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                Escucha Radio
                            </h1>

                            {/* Filtros */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Género musical</label>
                                    <select
                                        value={genre}
                                        onChange={(e) => {
                                            setGenre(e.target.value);
                                            setCountry('');
                                        }}
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                                    >
                                        <option value="">Seleccionar género</option>
                                        {genreOptions.map(g => (
                                            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">País</label>
                                    <select
                                        value={country}
                                        onChange={(e) => {
                                            setCountry(e.target.value);
                                            setGenre('');
                                        }}
                                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white"
                                    >
                                        <option value="">Seleccionar país</option>
                                        {countryOptions.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={fetchStations}
                                    disabled={!genre && !country}
                                    className={`mt-6 md:mt-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-md shadow-md transition-transform transform hover:scale-105 focus:outline-none ${
                                        (!genre && !country) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    Buscar
                                </button>
                            </div>

                            {/* Resultados */}
                            {loading ? (
                                <p>Cargando emisoras...</p>
                            ) : stations.length === 0 ? (
                                <p className="text-gray-400">No se encontraron radios para esta selección.</p>
                            ) : (
                                <>
                                    <select
                                        value={selectedStation?.stationuuid || ''}
                                        onChange={(e) => {
                                            const station = stations.find(s => s.stationuuid === e.target.value);
                                            setSelectedStation(station);
                                            playRadio(station);
                                        }}
                                        className="w-full max-w-md p-3 rounded-lg bg-gray-700 text-white border border-gray-600 mb-4"
                                    >
                                        {stations.map((station) => (
                                            <option key={station.stationuuid} value={station.stationuuid}>
                                                {station.name} ({station.votes} votos)
                                            </option>
                                        ))}
                                    </select>

                                    <audio ref={audioPlayerRef} controls autoPlay style={{ width: '100%' }}>
                                        Tu navegador no soporta el elemento de audio.
                                    </audio>

                                    <button
                                        onClick={stopRadio}
                                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors"
                                    >
                                        Detener
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}