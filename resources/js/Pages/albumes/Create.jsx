import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function CrearAlbum({ auth }) {
    const usuarioCreadorInicial = auth.user
        ? { id: auth.user.id, name: auth.user.name, email: auth.user.email }
        : null;

    const { data, setData, post, processing, errors, progress, reset } = useForm({
        nombre: '',
        publico: false,
        descripcion: '',
        imagen: null,
        userIds: auth.user ? [auth.user.id] : [],
    });

    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(usuarioCreadorInicial ? [usuarioCreadorInicial] : []);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    const coreInputStyle = 'rounded-md shadow-sm border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
    const autofillStyle = '[&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_theme(colors.gray.800)] [&:-webkit-autofill]:![-webkit-text-fill-color:theme(colors.gray.200)] [&:-webkit-autofill:hover]:!bg-transparent [&:-webkit-autofill:focus]:!bg-transparent [&:-webkit-autofill:focus]:!border-transparent [&:-webkit-autofill:focus]:ring-2 [&:-webkit-autofill:focus]:ring-purple-500 [&:-webkit-autofill:focus]:ring-offset-gray-800';
    const fileInputStyle = 'text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-800 file:text-indigo-200 hover:file:bg-indigo-700 cursor-pointer';


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
            const nuevosUsuariosSeleccionados = [...usuariosSeleccionados, usuario];
            setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
            setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
            setTerminoBusqueda('');
            setResultadosBusqueda([]);
            setMostrarResultados(false);
        }
    };

    const quitarUsuario = (usuarioId) => {
        if (auth.user?.id === usuarioId) {
            alert("No puedes quitar al creador de la album.");
            return;
        }
        const nuevosUsuariosSeleccionados = usuariosSeleccionados.filter(usuario => usuario.id !== usuarioId);
        setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
        setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
    };

    const realizarBusqueda = useCallback(
        debounce(async (termino) => {
            if (!auth.user) return;
            setCargandoBusqueda(true);
            try {
                const respuesta = await axios.get(route('usuarios.buscar', { q: termino, limit: 10 }));
                const usuariosDisponibles = respuesta.data.filter(
                    usuario => usuario.id !== auth.user.id && !usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)
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
        if (termino.trim() === '') {
            setResultadosBusqueda([]);
            setMostrarResultados(true);
            realizarBusqueda.cancel();
            realizarBusqueda('');
        } else {
            setMostrarResultados(true);
            realizarBusqueda(termino);
        }
    };

     const manejarFocoBusqueda = () => {
        if (!terminoBusqueda.trim()) {
            setMostrarResultados(true);
            if (resultadosBusqueda.length === 0 && !cargandoBusqueda) {
                 realizarBusqueda('');
            }
        } else {
            setMostrarResultados(true);
        }
    };

    const manejarEnvio = (e) => {
        e.preventDefault();
        const finalUserIds = Array.from(new Set( auth.user ? [...data.userIds, auth.user.id] : data.userIds));
        const dataToSend = { ...data, userIds: finalUserIds, imagen: data.imagen };

        post(route('albumes.store'), {
             forceFormData: true,
             preserveScroll: true,
             onSuccess: () => {
                 reset();
                 if (auth.user && usuarioCreadorInicial) {
                     setUsuariosSeleccionados([usuarioCreadorInicial]);
                     setData(currentData => ({...currentData, userIds: [auth.user.id]}));
                 } else {
                     setUsuariosSeleccionados([]);
                     setData(currentData => ({...currentData, userIds: []}));
                 }
                 setTerminoBusqueda('');
                 setResultadosBusqueda([]);
                 setMostrarResultados(false);
                 const fileInput = document.getElementById('imagen');
                 if(fileInput) fileInput.value = null;
             },
             onError: (err) => {
                  console.error("Error al crear album:", err);
             },
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const searchContainer = document.getElementById('search-container');
            if (searchContainer && !searchContainer.contains(event.target) && event.target.id !== 'user-search') {
                setMostrarResultados(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Crear Album" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-slate-800 overflow-hidden shadow-xl sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-100">
                            <h3 className="text-lg font-medium text-gray-100 mb-6">Nueva Album</h3>

                            <form onSubmit={manejarEnvio} className="space-y-6">

                                <div>
                                    <InputLabel htmlFor="nombre" value="Nombre *" className="text-gray-300 mb-1" />
                                    <input
                                        id="nombre"
                                        type="text"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className={`mt-1 block w-full sm:text-sm ${coreInputStyle} ${autofillStyle} ${errors.nombre ? 'border-red-500' : ''}`}
                                        required
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.nombre} className="mt-1 text-xs text-red-400" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="publico" value="Visibilidad *" className="text-gray-300 mb-1" />
                                    <select
                                        id="publico"
                                        name="publico"
                                        value={String(data.publico)}
                                        onChange={(e) => setData('publico', e.target.value === 'true')}
                                        className={`mt-1 block w-full sm:text-sm ${coreInputStyle} ${errors.publico ? 'border-red-500' : ''}`}
                                        required
                                    >
                                        <option value="false">Privado (Solo colaboradores)</option>
                                        <option value="true">Público (Visible para todos)</option>
                                    </select>
                                    <InputError message={errors.publico} className="mt-1 text-xs text-red-400" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="descripcion" value="Descripción" className="text-gray-300 mb-1" />
                                    <textarea
                                        id="descripcion"
                                        rows="4"
                                        value={data.descripcion}
                                        onChange={(e) => setData('descripcion', e.target.value)}
                                        className={`mt-1 block w-full sm:text-sm ${coreInputStyle} ${errors.descripcion ? 'border-red-500' : ''}`}
                                    ></textarea>
                                    <InputError message={errors.descripcion} className="mt-1 text-xs text-red-400" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="imagen" value="Imagen (Opcional)" className="text-gray-300 mb-1" />
                                    <input
                                        type="file"
                                        id="imagen"
                                        accept="image/*"
                                        onChange={(e) => setData('imagen', e.target.files[0])}
                                        className={`mt-1 block w-full text-sm ${coreInputStyle} ${fileInputStyle} ${errors.imagen ? 'border-red-500' : ''}`}
                                    />
                                     {progress && data.imagen && (
                                         <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                                             <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                         </div>
                                     )}
                                    <InputError message={errors.imagen} className="mt-1 text-xs text-red-400" />
                                </div>

                                <div className="border-t border-slate-700 pt-6 mt-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">Asociar Usuarios (Colaboradores)</h3>
                                    <div id="search-container" className="space-y-4 relative">
                                        <div>
                                            <InputLabel htmlFor="user-search" value="Buscar Usuario" className="text-gray-300" />
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    id="user-search"
                                                    type="search"
                                                    value={terminoBusqueda}
                                                    onChange={manejarCambioBusqueda}
                                                    onFocus={manejarFocoBusqueda}
                                                    className={`block w-full pr-10 sm:text-sm ${coreInputStyle} ${autofillStyle}`}
                                                    placeholder="Escribe para buscar..."
                                                    autoComplete="off"
                                                    disabled={!auth.user}
                                                />
                                                {cargandoBusqueda && (
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {mostrarResultados && (
                                                <ul className="absolute mt-1 w-full border border-slate-600 rounded-md bg-slate-900 shadow-lg max-h-60 overflow-auto z-10">
                                                   {cargandoBusqueda && ( <li className="px-4 py-2 text-sm text-gray-400">Buscando...</li> )}
                                                   {!cargandoBusqueda && resultadosBusqueda.length === 0 && ( <li className="px-4 py-2 text-sm text-gray-400">No se encontraron usuarios.</li> )}
                                                   {!cargandoBusqueda && resultadosBusqueda.map(usuario => (
                                                       <li key={usuario.id} className="px-4 py-2 hover:bg-slate-700 flex justify-between items-center cursor-pointer group" onClick={() => agregarUsuario(usuario)}>
                                                           <div>
                                                               <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                               <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                           </div>
                                                           <button type="button" onClick={(e) => { e.stopPropagation(); agregarUsuario(usuario); }} className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"> Añadir </button>
                                                       </li>
                                                   ))}
                                                </ul>
                                            )}
                                        </div>

                                        {usuariosSeleccionados.length > 0 && (
                                            <div className="mt-4 pt-2">
                                                <h4 className="text-sm font-medium text-gray-300 mb-2">Usuarios Seleccionados:</h4>
                                                <ul className="space-y-2">
                                                    {usuariosSeleccionados.map(usuario => (
                                                        <li key={usuario.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded border border-slate-600">
                                                            <div>
                                                                <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                                <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                            </div>
                                                            {auth.user?.id === usuario.id
                                                              ? <span className="ml-4 text-xs text-gray-400 font-medium">(Tú - Creador)</span>
                                                              : <button type="button" onClick={() => quitarUsuario(usuario.id)} className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded" title="Quitar usuario"> Quitar </button>
                                                            }
                                                        </li>
                                                    ))}
                                                </ul>
                                                 <InputError message={errors.userIds && typeof errors.userIds === 'string' ? errors.userIds : ''} className="mt-1 text-xs text-red-400" />
                                                 {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => ( <InputError key={key} message={errors[key]} className="mt-1 text-xs text-red-400" /> ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700 mt-6">
                                    <Link
                                        href={route('albumes.index')}
                                        className="inline-flex items-center px-4 py-2 bg-slate-600 border border-slate-500 rounded-md font-semibold text-xs text-gray-200 uppercase tracking-widest shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-25 transition ease-in-out duration-150"
                                        as="button"
                                        disabled={processing}
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-25 transition ease-in-out duration-150"
                                        disabled={processing || !auth.user}
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Album'}
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

export { CrearAlbum };
