import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';

export default function Create({ auth }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        titulo: '',
        genero: '',
        publico: false,
        licencia: '',
        foto: null,
        archivo: null,
        userIds: [],
    });

    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    useEffect(() => {
        if (auth.user && !usuariosSeleccionados.some(u => u.id === auth.user.id)) {
             const usuarioCreador = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
             const nuevosSeleccionados = [usuarioCreador, ...usuariosSeleccionados.filter(u => u.id !== usuarioCreador.id)];
             setUsuariosSeleccionados(nuevosSeleccionados);
             setData('userIds', nuevosSeleccionados.map(u => u.id));
        }
    }, [auth.user]);

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
        if (usuarioId === auth.user?.id) return;

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
                const response = await axios.get(`/usuarios/buscar?q=${encodeURIComponent(terminoLimpio)}`);
                const usuariosDisponibles = response.data.filter(
                    usuario => !usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)
                );
                setResultadosBusqueda(usuariosDisponibles);
            } catch (error) {
                setResultadosBusqueda([]);
            } finally {
                setCargandoBusqueda(false);
            }
        }, 300),
        [usuariosSeleccionados, auth.user?.id]
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
        }
    }

    const manejarPerdidaFocoBusqueda = () => {
        setTimeout(() => setMostrarResultados(false), 150);
    }

    const enviarFormulario = (e) => {
        e.preventDefault();
        post(route('canciones.store'), {
            preserveState: true,
            onSuccess: () => {
                reset();
                 if (auth.user) {
                     const usuarioCreador = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
                     setUsuariosSeleccionados([usuarioCreador]);
                     setData('userIds', [usuarioCreador.id]);
                 } else {
                     setUsuariosSeleccionados([]);
                      setData('userIds', []);
                 }
                setTerminoBusqueda('');
                setResultadosBusqueda([]);
                setMostrarResultados(false);
            },
            onError: (errores) => {
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Crear Nueva Canción</h2>}
        >
            <Head title="Crear Canción" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
                            <form onSubmit={enviarFormulario} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                                        <input id="titulo" type="text" value={data.titulo} onChange={(e) => setData('titulo', e.target.value)} required className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.titulo ? 'border-red-500' : ''}`} />
                                        {errors.titulo && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.titulo}</span>}
                                    </div>
                                     <div>
                                         <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                                         <input id="genero" type="text" value={data.genero} onChange={(e) => setData('genero', e.target.value)} className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.genero ? 'border-red-500' : ''}`} />
                                        {errors.genero && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.genero}</span>}
                                    </div>
                                     <div className="sm:col-span-2">
                                         <label htmlFor="licencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Licencia</label>
                                         <input id="licencia" type="text" value={data.licencia} onChange={(e) => setData('licencia', e.target.value)} className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.licencia ? 'border-red-500' : ''}`} />
                                         {errors.licencia && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.licencia}</span>}
                                     </div>
                                     <div>
                                          <label htmlFor="publico" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibilidad *</label>
                                          <select id="publico" value={data.publico} onChange={(e) => setData('publico', e.target.value === 'true')} required className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm ${errors.publico ? 'border-red-500' : ''}`}>
                                              <option value="false">Privado (Solo colaboradores)</option>
                                              <option value="true">Público (Visible para todos)</option>
                                          </select>
                                          {errors.publico && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.publico}</p>}
                                      </div>
                                       <div>
                                          <label htmlFor="foto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto (JPG, PNG)</label>
                                          <input id="foto" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setData('foto', e.target.files[0])} className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.foto ? 'border-red-500' : ''}`} />
                                          {data.foto && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{data.foto.name}</span>}
                                          {errors.foto && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.foto}</span>}
                                      </div>
                                       <div>
                                          <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Archivo de Audio (MP3, WAV) *</label>
                                          <input id="archivo" type="file" accept=".mp3,.wav" onChange={(e) => setData('archivo', e.target.files[0])} required className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.archivo ? 'border-red-500' : ''}`} />
                                          {data.archivo && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{data.archivo.name}</span>}
                                          {errors.archivo && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.archivo}</span>}
                                      </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                                        Asociar Colaboradores
                                    </h3>
                                    <div className="relative">
                                        <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Usuario por Nombre o Email</label>
                                        <input
                                            id="user-search"
                                            type="search"
                                            value={terminoBusqueda}
                                            onChange={manejarCambioBusqueda}
                                            onFocus={manejarFocoBusqueda}
                                            onBlur={manejarPerdidaFocoBusqueda}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
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
                                            <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg max-h-60 overflow-auto z-10 absolute w-full">
                                                {!cargandoBusqueda && resultadosBusqueda.length === 0 && (
                                                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {terminoBusqueda ? 'No se encontraron usuarios.' : 'No hay usuarios disponibles.'}
                                                    </li>
                                                )}
                                                {!cargandoBusqueda && resultadosBusqueda.map(usuario => (
                                                    <li key={usuario.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center cursor-pointer"
                                                        onMouseDown={() => agregarUsuario(usuario)}
                                                    >
                                                        <div>
                                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{usuario.name}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({usuario.email})</span>
                                                        </div>
                                                    </li>
                                                ))}
                                                {cargandoBusqueda && (
                                                     <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Buscando...</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>

                                    {usuariosSeleccionados.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Colaboradores seleccionados:</h4>
                                            <ul className="space-y-2">
                                                {usuariosSeleccionados.map(usuario => (
                                                    <li key={usuario.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                        <div>
                                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{usuario.name}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({usuario.email})</span>
                                                            {auth.user?.id === usuario.id && (
                                                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">(Tú - Creador)</span>
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
                                             {errors.userIds && typeof errors.userIds === 'string' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.userIds}</p>}
                                             {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => (
                                                  <p key={key} className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key]}</p>
                                              ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-5 mt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
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
