import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

export default function Create({ auth, generos, licencias }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titulo: '',
        publico: false,
        licencia_id: licencias && licencias.length > 0 ? licencias[0].id.toString() : '',
        foto: null,
        archivo: null,
        genero: [],
        userIds: [],
        remix: false,
        cancion_original_id: null,
    });

    const [termGenero, setTermGenero] = useState('');
    const [resultadosGenero, setResultadosGenero] = useState([]);
    const [mostrarGenero, setMostrarGenero] = useState(false);

    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    const [terminoBusquedaCancion, setTerminoBusquedaCancion] = useState('');
    const [resultadosBusquedaCancion, setResultadosBusquedaCancion] = useState([]);
    const [cargandoBusquedaCancion, setCargandoBusquedaCancion] = useState(false);
    const [mostrarResultadosCancion, setMostrarResultadosCancion] = useState(false);
    const [originalSongSelected, setOriginalSongSelected] = useState(null);

    const [selectedLicenseDetails, setSelectedLicenseDetails] = useState(null);

    useEffect(() => {
        if (auth.user && !usuariosSeleccionados.some(u => u.id === auth.user.id)) {
            const usuarioCreador = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
            const nuevosSeleccionados = [usuarioCreador, ...usuariosSeleccionados.filter(u => u.id !== usuarioCreador.id)];
            setUsuariosSeleccionados(nuevosSeleccionados);
            setData('userIds', nuevosSeleccionados.map(u => u.id));
        }
    }, [auth.user, setData, usuariosSeleccionados]);

    useEffect(() => {
        const license = licencias.find(lic => lic.id.toString() === data.licencia_id);
        setSelectedLicenseDetails(license || null);
    }, [data.licencia_id, licencias]);

    const buscarGeneros = useCallback(
        debounce(term => {
            const limpio = term.trim().toLowerCase();
            if (limpio) {
                setResultadosGenero(
                    generos.filter(g => g.toLowerCase().includes(limpio) && !data.genero.includes(g))
                );
            } else {
                setResultadosGenero([]);
            }
            setMostrarGenero(true);
        }, 300),
        [generos, data.genero]
    );

    const manejarTermGenero = e => {
        const term = e.target.value;
        setTermGenero(term);
        buscarGeneros(term);
    };

    const agregarGenero = g => {
        setData('genero', [...data.genero, g]);
        setTermGenero('');
        setResultadosGenero([]);
        setMostrarGenero(false);
    };

    const quitarGenero = g => {
        setData('genero', data.genero.filter(x => x !== g));
    };

    const agregarUsuario = (usuario) => {
        if (!usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)) {
            const nuevosSeleccionados = [...usuariosSeleccionados, usuario];
            setUsuariosSeleccionados(nuevosSeleccionados);
            setData('userIds', nuevosSeleccionados.map(u => u.id));
            setTerminoBusqueda('');
            setResultadosBusqueda([]);
            setMostrarResultados(false);
        }
    };

    const quitarUsuario = (usuarioId) => {
        if (auth.user && usuarioId === auth.user.id) {
            console.warn("No puedes quitar al usuario creador.");
            return;
        }
        const nuevosSeleccionados = usuariosSeleccionados.filter(usuario => usuario.id !== usuarioId);
        setUsuariosSeleccionados(nuevosSeleccionados);
        setData('userIds', nuevosSeleccionados.map(u => u.id));
    };

    const realizarBusqueda = useCallback(
        debounce(async (termino) => {
            setCargandoBusqueda(true);
            setMostrarResultados(true);
            try {
                const terminoLimpio = termino.trim();
                if (!terminoLimpio) {
                    setResultadosBusqueda([]);
                    setCargandoBusqueda(false);
                    return;
                }
                const response = await axios.get(route('usuarios.buscar', { q: terminoLimpio }));
                const usuariosDisponibles = response.data.filter(
                    usuario => !usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)
                );
                setResultadosBusqueda(usuariosDisponibles);
            } catch (error) {
                console.error("Error buscando usuarios:", error);
                setResultadosBusqueda([]);
            } finally {
                setCargandoBusqueda(false);
            }
        }, 300),
        [usuariosSeleccionados]
    );

    const manejarCambioBusqueda = (e) => {
        const termino = e.target.value;
        setTerminoBusqueda(termino);
        realizarBusqueda(termino);
    };

    const manejarFocoBusqueda = () => {
        setMostrarResultados(true);
    };

    const manejarPerdidaFocoBusqueda = () => {
        setTimeout(() => setMostrarResultados(false), 150);
    };

    const realizarBusquedaCancion = useCallback(
        debounce(async (termino) => {
            setCargandoBusquedaCancion(true);
            try {
                const terminoLimpio = termino.trim();
                if (!terminoLimpio) {
                    setResultadosBusquedaCancion([]);
                    return;
                }
                // Only search for songs with license_id === 2 (CC BY 4.0)
                const response = await axios.get(route('canciones.buscar-originales', { q: terminoLimpio, license_id: 2 }));
                setResultadosBusquedaCancion(response.data);
            } catch (error) {
                console.error("Error buscando canciones originales:", error);
                setResultadosBusquedaCancion([]);
            } finally {
                setCargandoBusquedaCancion(false);
            }
        }, 300),
        []
    );

    const manejarCambioBusquedaCancion = (e) => {
        const termino = e.target.value;
        setTerminoBusquedaCancion(termino);
        // Always show results when typing
        setMostrarResultadosCancion(true);
        realizarBusquedaCancion(termino);
    };

    const manejarFocoBusquedaCancion = () => {
        // Show results when input is focused. If there's a term, trigger search.
        setMostrarResultadosCancion(true);
        if (terminoBusquedaCancion.trim()) {
            realizarBusquedaCancion(terminoBusquedaCancion);
        } else {
            setResultadosBusquedaCancion([]); // Clear previous results if focus and no term
        }
    };

    const manejarPerdidaFocoCancion = () => {
        // Delay hiding the results to allow onMouseDown on list items to fire
        setTimeout(() => setMostrarResultadosCancion(false), 150);
    };

    const seleccionarCancionOriginal = (cancion) => {
        // Ensure the selected song has the correct license (already filtered by backend)
        setOriginalSongSelected(cancion);
        setData('cancion_original_id', cancion.id);
        // Clear search term and results after selection
        setTerminoBusquedaCancion('');
        setResultadosBusquedaCancion([]);
        setMostrarResultadosCancion(false);
    };

    const quitarCancionOriginal = () => {
        setOriginalSongSelected(null);
        setData('cancion_original_id', null);
        setTerminoBusquedaCancion('');
        setResultadosBusquedaCancion([]);
        setMostrarResultadosCancion(false);
    };

    const enviarFormulario = (e) => {
        e.preventDefault();
        post(route('canciones.store'), {
            preserveState: true,
            onSuccess: () => {
                reset('titulo', 'publico', 'foto', 'archivo', 'genero', 'userIds', 'remix', 'cancion_original_id');
                setTermGenero('');
                setResultadosGenero([]);
                setMostrarGenero(false);
                setTerminoBusqueda('');
                setResultadosBusqueda([]);
                setMostrarResultados(false);
                setTerminoBusquedaCancion('');
                setResultadosBusquedaCancion([]);
                setMostrarResultadosCancion(false);
                setOriginalSongSelected(null);
                if (auth.user) {
                    const usuarioCreador = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
                    setUsuariosSeleccionados([usuarioCreador]);
                    setData('userIds', [usuarioCreador.id]);
                } else {
                    setUsuariosSeleccionados([]);
                    setData('userIds', []);
                }
                if (licencias && licencias.length > 0) {
                    const defaultLicense = licencias[0];
                    setData('licencia_id', defaultLicense.id.toString());
                    setSelectedLicenseDetails(defaultLicense);
                } else {
                    setData('licencia_id', '');
                    setSelectedLicenseDetails(null);
                }
                const inputFoto = document.getElementById('foto');
                if (inputFoto) inputFoto.value = '';
                const inputArchivo = document.getElementById('archivo');
                if (inputArchivo) inputArchivo.value = '';
            },
            onError: (errores) => {
                console.error("Error al enviar formulario:", errores);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Crear Canción" />
            <div className="py-12 pt-20">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-gray-800 shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-100">
                            <form onSubmit={enviarFormulario} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {/* Título */}
                                    <div className="sm:col-span-2">
                                        <InputLabel htmlFor="titulo" value="Título *" className="text-gray-300" />
                                        <TextInput
                                            id="titulo"
                                            type="text"
                                            name="titulo"
                                            value={data.titulo}
                                            onChange={(e) => setData('titulo', e.target.value)}
                                            required
                                            className={`mt-1 block w-full sm:text-sm ${errors.titulo ? 'border-red-500' : ''}`} />
                                        <InputError message={errors.titulo} className="mt-1 text-xs" />
                                    </div>

                                    {/* Es remix? */}
                                    <div className="sm:col-span-2">
                                        <label className="flex items-center">
                                            <Checkbox
                                                name="remix"
                                                checked={data.remix}
                                                onChange={(e) => {
                                                    setData({ ...data, remix: e.target.checked, cancion_original_id: null });
                                                    setOriginalSongSelected(null);
                                                    setTerminoBusquedaCancion(''); // Clear search term on checkbox change
                                                    setResultadosBusquedaCancion([]); // Clear search results
                                                    setMostrarResultadosCancion(false); // Hide results
                                                }}
                                            />
                                            <span className="ml-2 text-sm text-gray-300">¿Esta canción es un remix o se basa en otra obra?</span>
                                        </label>
                                        <InputError message={errors.remix} className="mt-1 text-xs" />
                                    </div>

                                    {/* Licencia o Obra Original */}
                                    {!data.remix ? (
                                        <div>
                                            <InputLabel htmlFor="licencia_id" value="Licencia" className="text-gray-300" />
                                            <select
                                                id="licencia_id"
                                                name="licencia_id"
                                                value={data.licencia_id}
                                                onChange={(e) => setData('licencia_id', e.target.value)}
                                                className={`mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-700 text-gray-200 sm:text-sm ${errors.licencia_id ? 'border-red-500' : ''}`}
                                            >
                                                {licencias.map((licencia) => (
                                                    <option key={licencia.id} value={licencia.id}>
                                                        {licencia.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.licencia_id} className="mt-1 text-xs" />

                                            {selectedLicenseDetails && (
                                                <div className="mt-2 text-sm text-gray-400">
                                                    {selectedLicenseDetails.descripcion && (
                                                        <p>{selectedLicenseDetails.descripcion}</p>
                                                    )}
                                                    {selectedLicenseDetails.url && (
                                                        <p className="mt-1">
                                                            Más info: <a href={selectedLicenseDetails.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{selectedLicenseDetails.url}</a>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">
                                                Seleccionar Obra Original (CC BY 4.0)
                                            </h3>

                                            {/* Buscador de canciones originales */}
                                            {!originalSongSelected ? (
                                                <div className="relative overflow-visible">
                                                    <InputLabel htmlFor="original-cancion-search" value="Buscar Obra Original por Título (CC BY 4.0)" className="text-gray-300" />
                                                    <TextInput
                                                        id="original-cancion-search"
                                                        type="search"
                                                        value={terminoBusquedaCancion}
                                                        onChange={manejarCambioBusquedaCancion}
                                                        onFocus={manejarFocoBusquedaCancion}
                                                        onBlur={manejarPerdidaFocoCancion}
                                                        className={`mt-1 block w-full sm:text-sm pr-10 ${errors.cancion_original_id ? 'border-red-500' : ''}`}
                                                        placeholder="Escribe para buscar obras CC BY 4.0..."
                                                        autoComplete="off"
                                                    />
                                                    {cargandoBusquedaCancion && (
                                                        <div className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center pointer-events-none">
                                                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        </div>
                                                    )}

                                                    {mostrarResultadosCancion && (
                                                        <ul className="mt-2 border border-gray-600 rounded-md bg-gray-700 shadow-lg max-h-60 overflow-auto z-[9999] absolute w-full">
                                                            {cargandoBusquedaCancion ? (
                                                                <li className="px-4 py-2 text-sm text-gray-400">Buscando obras...</li>
                                                            ) : resultadosBusquedaCancion.length === 0 && terminoBusquedaCancion.trim() ? (
                                                                <li className="px-4 py-2 text-sm text-gray-400">No se encontraron obras CC BY 4.0.</li>
                                                            ) : resultadosBusquedaCancion.length === 0 && !terminoBusquedaCancion.trim() ? (
                                                                <li className="px-4 py-2 text-sm text-gray-400">Empieza a escribir para buscar obras CC BY 4.0.</li>
                                                            ) : (
                                                                resultadosBusquedaCancion.map(cancion => (
                                                                    <li key={cancion.id} className="px-4 py-2 hover:bg-gray-600 flex justify-between items-center cursor-pointer"
                                                                        onMouseDown={() => seleccionarCancionOriginal(cancion)}>
                                                                        <div className="flex items-center">
                                                                            {cancion.foto_url && (
                                                                                <img src={cancion.foto_url} alt={`Foto de ${cancion.titulo}`} className="w-8 h-8 object-cover rounded mr-3" />
                                                                            )}
                                                                            <div>
                                                                                <span className="font-medium text-sm text-gray-100">{cancion.titulo}</span>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-xs text-gray-400 ml-2">(CC BY 4.0)</span>
                                                                    </li>
                                                                ))
                                                            )}
                                                        </ul>
                                                    )}
                                                    <InputError message={errors.cancion_original_id} className="mt-1 text-xs" />
                                                </div>
                                            ) : (
                                                <div className="mt-4 bg-gray-700 p-3 rounded border border-gray-600">
                                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Obra Original Seleccionada:</h4>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="font-medium text-sm text-gray-100">{originalSongSelected.titulo}</span>
                                                            <span className="text-xs text-gray-400 ml-2">(CC BY 4.0)</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={quitarCancionOriginal}
                                                            className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded"
                                                            title="Quitar obra original"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                    <InputError message={errors.cancion_original_id} className="mt-1 text-xs" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Visibilidad */}
                                    <div>
                                        <InputLabel htmlFor="publico" value="Visibilidad *" className="text-gray-300 mb-1" />
                                        <select
                                            id="publico"
                                            name="publico"
                                            value={data.publico}
                                            onChange={(e) => setData('publico', e.target.value === 'true')}
                                            required
                                            className={`mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-700 text-gray-200 sm:text-sm ${errors.publico ? 'border-red-500' : ''}`}>
                                            <option value="false">Privado (Solo colaboradores)</option>
                                            <option value="true">Público (Visible para todos)</option>
                                        </select>
                                        <InputError message={errors.publico} className="mt-1 text-sm" />
                                    </div>

                                    {/* Foto */}
                                    <div>
                                        <InputLabel htmlFor="foto" value="Foto (JPG, PNG)" className="text-gray-300" />
                                        <input
                                            id="foto"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={(e) => setData('foto', e.target.files[0])}
                                            className={`mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800 border border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.foto ? 'border-red-500' : ''}`} />
                                        {data.foto && <span className="text-xs text-gray-400 mt-1 block">{data.foto.name}</span>}
                                        <InputError message={errors.foto} className="mt-1 text-xs" />
                                    </div>

                                    {/* Archivo de audio */}
                                    <div>
                                        <InputLabel htmlFor="archivo" value="Archivo de Audio (MP3, WAV) *" className="text-gray-300" />
                                        <input
                                            id="archivo"
                                            type="file"
                                            accept=".mp3,.wav"
                                            onChange={(e) => setData('archivo', e.target.files[0])}
                                            required
                                            className={`mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800 border border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.archivo ? 'border-red-500' : ''}`} />
                                        {data.archivo && <span className="text-xs text-gray-400 mt-1 block">{data.archivo.name}</span>}
                                        <InputError message={errors.archivo} className="mt-1 text-xs" />
                                    </div>
                                </div>

                                {/* Géneros */}
                                <div className="relative pt-4">
                                    <InputLabel htmlFor="busca-genero" value="Géneros" className="text-gray-300" />
                                    <TextInput
                                        id="busca-genero"
                                        type="search"
                                        value={termGenero}
                                        onChange={manejarTermGenero}
                                        onFocus={() => setMostrarGenero(true)}
                                        onBlur={() => setTimeout(() => setMostrarGenero(false), 150)}
                                        placeholder="Busca o desplázate..."
                                        className="mt-1 block w-full sm:text-sm pr-10"
                                        autoComplete="off"
                                    />
                                    {mostrarGenero && (
                                        <ul className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md max-h-32 overflow-y-auto">
                                            {generos.filter(g => g.toLowerCase().includes(termGenero.trim().toLowerCase()) && !data.genero.includes(g)).map((g, i) => (
                                                <li
                                                    key={i}
                                                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-gray-100 text-sm"
                                                    onMouseDown={() => agregarGenero(g)}
                                                >
                                                    {g}
                                                </li>
                                            ))}
                                            {generos.filter(g => g.toLowerCase().includes(termGenero.trim().toLowerCase()) && !data.genero.includes(g)).length === 0 ? (
                                                termGenero.trim() ? (
                                                    <li className="px-4 py-2 text-gray-400 text-sm">No hay géneros coincidentes</li>
                                                ) : (
                                                    <li className="px-4 py-2 text-gray-400 text-sm">No hay géneros disponibles</li>
                                                )
                                            ) : null}
                                        </ul>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {data.genero.map((g, i) => (
                                            <span key={i} className="bg-indigo-600 text-white text-xs px-2 py-1 rounded inline-flex items-center">
                                                {g}
                                                <button type="button" onClick={() => quitarGenero(g)} className="ml-1 focus:outline-none">×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <InputError message={errors.genero} className="mt-1 text-xs text-red-500" />
                                </div>

                                <div className="border-t border-gray-700 pt-6 mt-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">
                                        Asociar Colaboradores
                                    </h3>
                                    <div className="relative">
                                        <InputLabel htmlFor="user-search" value="Buscar Usuario por Nombre o Email" className="text-gray-300" />
                                        <TextInput
                                            id="user-search"
                                            type="search"
                                            value={terminoBusqueda}
                                            onChange={manejarCambioBusqueda}
                                            onFocus={manejarFocoBusqueda}
                                            onBlur={manejarPerdidaFocoBusqueda}
                                            className="mt-1 block w-full sm:text-sm pr-10"
                                            placeholder="Escribe para buscar..."
                                            autoComplete="off"
                                        />
                                        {cargandoBusqueda && (
                                            <div className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center pointer-events-none">
                                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        )}
                                        {mostrarResultados && (
                                            <ul className="mt-2 border border-gray-600 rounded-md bg-gray-700 shadow-lg max-h-60 overflow-auto z-10 absolute w-full">
                                                {!cargandoBusqueda && resultadosBusqueda.length === 0 && terminoBusqueda.trim() ? (
                                                    <li className="px-4 py-2 text-sm text-gray-400">No se encontraron usuarios.</li>
                                                ) : !cargandoBusqueda && resultadosBusqueda.length === 0 && !terminoBusqueda.trim() ? (
                                                    <li className="px-4 py-2 text-sm text-gray-400">Empieza a escribir para buscar usuarios.</li>
                                                ) : (
                                                    resultadosBusqueda.map(usuario => (
                                                        <li key={usuario.id} className="px-4 py-2 hover:bg-gray-600 flex justify-between items-center cursor-pointer"
                                                            onMouseDown={() => agregarUsuario(usuario)}>
                                                            <div>
                                                                <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                                <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                            </div>
                                                        </li>
                                                    ))
                                                )}
                                                {cargandoBusqueda && (
                                                    <li className="px-4 py-2 text-sm text-gray-400">Buscando...</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                    {usuariosSeleccionados.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-300 mb-2">Colaboradores seleccionados:</h4>
                                            <ul className="space-y-2">
                                                {usuariosSeleccionados.map(usuario => (
                                                    <li key={usuario.id} className="flex justify-between items-center bg-gray-700 p-2 rounded border border-gray-600">
                                                        <div>
                                                            <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                            <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                            {auth.user?.id === usuario.id && (
                                                                <span className="ml-2 text-xs text-blue-400 font-semibold">(Tú - Creador)</span>
                                                            )}
                                                        </div>
                                                        {auth.user?.id !== usuario.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => quitarUsuario(usuario.id)}
                                                                className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded"
                                                                title="Quitar colaborador"
                                                            >
                                                                Quitar
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                            <InputError message={errors.userIds && typeof errors.userIds === 'string' ? errors.userIds : ''} className="mt-1 text-xs" />
                                            {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => (
                                                <InputError key={key} message={errors[key]} className="mt-1 text-xs" />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-5 mt-6 border-t border-gray-700">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 focus:ring-offset-gray-800"
                                    >
                                        {processing ? 'Guardando...' : 'Crear Canción'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
