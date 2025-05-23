import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Edit({ auth, cancion, generos: todosLosGeneros, generosSeleccionados }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titulo: cancion.titulo || '',
        publico: cancion.publico !== undefined ? Boolean(cancion.publico) : false,
        licencia: cancion.licencia || '',
        foto: null,
        archivo: null,
        genero: generosSeleccionados || [],
        userIds: cancion.usuarios ? cancion.usuarios.map(u => u.id) : [],
        _method: 'PUT',
    });

    const [fotoActualUrl, setFotoActualUrl] = useState(cancion.foto_url || null);
    const [archivoActualNombre, setArchivoActualNombre] = useState(cancion.archivo_nombre || null);

    const [termGenero, setTermGenero] = useState('');
    const [resultadosGenero, setResultadosGenero] = useState(
        todosLosGeneros.filter(g => !generosSeleccionados.includes(g))
    );
    const [mostrarGenero, setMostrarGenero] = useState(false);

    const buscarGeneros = useCallback(
        debounce(term => {
            const limpio = term.trim().toLowerCase();
            if (limpio) {
                setResultadosGenero(
                    todosLosGeneros.filter(g => g.toLowerCase().includes(limpio) && !data.genero.includes(g))
                );
            } else {
                setResultadosGenero(todosLosGeneros.filter(g => !data.genero.includes(g)));
            }
        }, 300),
        [todosLosGeneros, data.genero]
    );

    const manejarTermGenero = e => {
        const term = e.target.value;
        setTermGenero(term);
        buscarGeneros(term);
    };

    const agregarGenero = g => {
        if (!data.genero.includes(g)) {
            setData('genero', [...data.genero, g]);
            setResultadosGenero(resultadosGenero.filter(resG => resG !== g));
            const limpio = termGenero.trim().toLowerCase();
            if (limpio) {
                setResultadosGenero(
                    todosLosGeneros.filter(gen => gen.toLowerCase().includes(limpio) && ![...data.genero, g].includes(gen))
                );
            } else {
                setResultadosGenero(todosLosGeneros.filter(gen => ![...data.genero, g].includes(gen)));
            }
        }
    };

    const quitarGenero = g => {
        const nuevosGenerosSeleccionados = data.genero.filter(x => x !== g);
        setData('genero', nuevosGenerosSeleccionados);
        const limpio = termGenero.trim().toLowerCase();
        if (g.toLowerCase().includes(limpio) || !limpio) {
            setResultadosGenero(
                todosLosGeneros.filter(gen => gen.toLowerCase().includes(limpio) && !nuevosGenerosSeleccionados.includes(gen))
            );
        }
    };

    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(cancion.usuarios || []);
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    useEffect(() => {
        setData('userIds', usuariosSeleccionados.map(u => u.id));
    }, [usuariosSeleccionados, setData]);

    const agregarUsuario = (usuario) => {
        if (!usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id) && usuario.id !== auth.user?.id) {
            const nuevosSeleccionados = [...usuariosSeleccionados, usuario];
            setUsuariosSeleccionados(nuevosSeleccionados);
            setTerminoBusqueda('');
            setResultadosBusqueda([]);
            setMostrarResultados(false);
        }
    };

    const quitarUsuario = (usuarioId) => {
        if (usuarioId === cancion.creador_id && usuariosSeleccionados.length === 1 && auth.user?.id === usuarioId) {
            alert('No puedes quitar al creador si es el único colaborador.');
            return;
        }
        if (usuarioId === cancion.creador_id && usuariosSeleccionados.length === 1) {
            alert('No puedes quitar al creador si es el único colaborador.');
            return;
        }
        const nuevosSeleccionados = usuariosSeleccionados.filter(usuario => usuario.id !== usuarioId);
        setUsuariosSeleccionados(nuevosSeleccionados);
    };

    const realizarBusqueda = useCallback(
        debounce(async (termino) => {
            const terminoLimpio = termino.trim();
            if (!terminoLimpio && !mostrarResultados) {
                setResultadosBusqueda([]);
                setCargandoBusqueda(false);
                return;
            }
            setCargandoBusqueda(true);
            setMostrarResultados(true);
            try {
                const response = await axios.get(route('usuarios.buscar', { q: terminoLimpio }));
                const usuariosDisponibles = response.data.filter(
                    usuario => !usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id) && usuario.id !== auth.user?.id
                );
                setResultadosBusqueda(usuariosDisponibles);
            } catch (error) {
                console.error("Error searching users:", error);
                setResultadosBusqueda([]);
            } finally {
                setCargandoBusqueda(false);
            }
        }, 300),
        [usuariosSeleccionados, auth.user?.id, mostrarResultados]
    );

    const manejarCambioBusqueda = (e) => {
        const termino = e.target.value;
        setTerminoBusqueda(termino);
        realizarBusqueda(termino);
    };

    const manejarFocoBusqueda = () => {
        setMostrarResultados(true);
        if (!terminoBusqueda.trim()) {
            realizarBusqueda('');
        } else {
            realizarBusqueda(terminoBusqueda);
        }
    }

    const manejarPerdidaFocoBusqueda = () => {
        setTimeout(() => setMostrarResultados(false), 150);
    }

    const enviarFormulario = (e) => {
        e.preventDefault();
        post(route('canciones.update', cancion.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                const inputFoto = document.getElementById('foto');
                if (inputFoto) inputFoto.value = null;
                const inputArchivo = document.getElementById('archivo');
                if (inputArchivo) inputArchivo.value = null;
                setData('foto', null);
                setData('archivo', null);
            },
            onError: (errores) => {
                console.error("Form errors:", errores);
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-200 leading-tight">Editar Canción: {cancion.titulo}</h2>}
        >
            <Head title={`Editar ${cancion.titulo}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-gray-800 shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-100">
                            <form onSubmit={enviarFormulario} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                                    <div>
                                        <InputLabel htmlFor="publico" value="Visibilidad *" className="text-gray-300 mb-1" />
                                        <select
                                            id="publico"
                                            name="publico"
                                            value={data.publico.toString()}
                                            onChange={(e) => setData('publico', e.target.value === 'true')}
                                            required
                                            className={`mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-700 text-gray-200 sm:text-sm ${errors.publico ? 'border-red-500' : ''}`}>
                                            <option value="false">Privado (Solo colaboradores)</option>
                                            <option value="true">Público (Visible para todos)</option>
                                        </select>
                                        <InputError message={errors.publico} className="mt-1 text-sm" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="foto" value="Cambiar Foto (JPG, PNG)" className="text-gray-300" />
                                        <input
                                            id="foto"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                setData('foto', e.target.files[0]);
                                                if (e.target.files[0]) {
                                                    setFotoActualUrl(URL.createObjectURL(e.target.files[0]));
                                                } else if (cancion.foto_url) {
                                                    setFotoActualUrl(cancion.foto_url);
                                                } else {
                                                    setFotoActualUrl(null);
                                                }
                                            }}
                                            className={`mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800 border border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.foto ? 'border-red-500' : ''}`} />
                                        {fotoActualUrl && !data.foto && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-400">Foto actual:</p>
                                                <img src={fotoActualUrl} alt="Foto actual" className="mt-1 max-h-32 rounded" />
                                            </div>
                                        )}
                                        {data.foto && <span className="text-xs text-gray-400 mt-1 block">Nueva foto: {data.foto.name}</span>}
                                        <InputError message={errors.foto} className="mt-1 text-xs" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="archivo" value="Cambiar Archivo de Audio (MP3, WAV)" className="text-gray-300" />
                                        <input
                                            id="archivo"
                                            type="file"
                                            accept=".mp3,.wav"
                                            onChange={(e) => {
                                                setData('archivo', e.target.files[0]);
                                                if (e.target.files[0]) {
                                                    setArchivoActualNombre(e.target.files[0].name);
                                                } else if (cancion.archivo_nombre) {
                                                    setArchivoActualNombre(cancion.archivo_nombre);
                                                } else {
                                                    setArchivoActualNombre(null);
                                                }
                                            }}
                                            className={`mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-300 hover:file:bg-indigo-800 border border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.archivo ? 'border-red-500' : ''}`} />
                                        {archivoActualNombre && (
                                            <span className="text-xs text-gray-400 mt-1 block">
                                                {data.archivo ? `Nuevo archivo: ${data.archivo.name}` : `Archivo actual: ${archivoActualNombre}`}
                                            </span>
                                        )}
                                        <InputError message={errors.archivo} className="mt-1 text-xs" />
                                    </div>
                                </div>

                                <div className="relative pt-4">
                                    <InputLabel htmlFor="busca-genero" value="Géneros" className="text-gray-300" />
                                    <TextInput
                                        id="busca-genero"
                                        type="search"
                                        value={termGenero}
                                        onChange={manejarTermGenero}
                                        onFocus={() => {
                                            setMostrarGenero(true);
                                            if (!termGenero.trim()) buscarGeneros('');
                                        }}
                                        onBlur={() => setTimeout(() => setMostrarGenero(false), 150)}
                                        placeholder="Busca o desplázate para añadir géneros..."
                                        className="mt-1 block w-full sm:text-sm pr-10"
                                    />
                                    {mostrarGenero && (
                                        <ul className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md max-h-40 overflow-y-auto shadow-lg">
                                            {resultadosGenero.length > 0 ? (
                                                resultadosGenero.map((g, i) => (
                                                    <li
                                                        key={i}
                                                        className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-gray-100 text-sm"
                                                        onMouseDown={() => agregarGenero(g)}
                                                    >
                                                        {g}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-2 text-gray-400 text-sm">
                                                    {termGenero ? "No hay géneros que coincidan" : "No hay más géneros para añadir"}
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {data.genero.map((g, i) => (
                                            <span key={i} className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full inline-flex items-center">
                                                {g}
                                                <button type="button" onClick={() => quitarGenero(g)} className="ml-2 text-indigo-100 hover:text-white focus:outline-none">
                                                    &times;
                                                </button>
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
                                                {!cargandoBusqueda && resultadosBusqueda.length === 0 && (
                                                    <li className="px-4 py-2 text-sm text-gray-400">
                                                        {terminoBusqueda ? 'No se encontraron usuarios que coincidan.' : 'Escribe para buscar o no hay más usuarios disponibles.'}
                                                    </li>
                                                )}
                                                {!cargandoBusqueda && resultadosBusqueda.map(usuario => (
                                                    <li key={usuario.id} className="px-4 py-2 hover:bg-gray-600 flex justify-between items-center cursor-pointer"
                                                        onMouseDown={() => agregarUsuario(usuario)}
                                                    >
                                                        <div>
                                                            <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                            <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                        </div>
                                                    </li>
                                                ))}
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
                                                            {cancion.creador_id === usuario.id && (
                                                                <span className="ml-2 text-xs text-blue-400 font-semibold">(Creador)</span>
                                                            )}
                                                            {auth.user?.id === usuario.id && cancion.creador_id !== usuario.id && (
                                                                <span className="ml-2 text-xs text-green-400 font-semibold">(Tú)</span>
                                                            )}
                                                        </div>
                                                        {!(cancion.creador_id === usuario.id && usuariosSeleccionados.length === 1) && (
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
                                                <InputError message={errors.userIds && typeof errors.userIds === 'string' ? errors.userIds : ''} className="mt-1 text-xs" />
                                                {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => (
                                                    <InputError key={key} message={errors[key]} className="mt-1 text-xs" />
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-5 mt-6 border-t border-gray-700">
                                    <Link
                                        href={route('canciones.show', cancion.id)}
                                        className="mr-4 inline-flex justify-center py-2 px-4 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 focus:ring-offset-gray-800"
                                    >
                                        {processing ? 'Guardando Cambios...' : 'Guardar Cambios'}
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
