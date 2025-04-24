import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';

export default function Editar({ auth, cancion, errors: serverErrors, success: successMessage }) {
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(cancion.usuarios || []);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const propietarioCancion = cancion.usuarios?.find(u => u.es_propietario);
    const esUsuarioPropietario = auth.user?.id === propietarioCancion?.id;

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        _method: 'PUT',
        titulo: cancion.titulo || '',
        genero: cancion.genero || '',
        publico: cancion.publico ?? false,
        licencia: cancion.licencia || '',
        archivo_nuevo: null,
        foto_nueva: null,
        eliminar_foto: false,
        userIds: (cancion.usuarios || []).map(u => u.id),
    });

    const erroresMostrados = { ...errors, ...(serverErrors || {}) };

    const añadirUsuario = (usuario) => {
        if (!esUsuarioPropietario) return;

        if (!usuariosSeleccionados.some(selected => selected.id === usuario.id)) {
            const nuevosUsuariosSeleccionados = [...usuariosSeleccionados, {...usuario, es_propietario: false}];
            setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
            setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
            setTerminoBusqueda('');
            setResultadosBusqueda([]);
            setIsSearchFocused(false);
        }
    };

    const eliminarUsuario = (usuarioId) => {
        if (!esUsuarioPropietario) return;

        const usuarioAEliminar = usuariosSeleccionados.find(user => user.id === usuarioId);

        if (usuarioAEliminar?.es_propietario) {
            console.log("No se puede quitar al propietario.");
            return;
        }

        const nuevosUsuariosSeleccionados = usuariosSeleccionados.filter(user => user.id !== usuarioId);
        setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
        setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
    };

    const ejecutarBusqueda = useCallback(
        debounce(async (termino) => {
            if (!esUsuarioPropietario) {
                setResultadosBusqueda([]);
                return;
            }

            setCargandoBusqueda(true);
            try {
                const terminoLimpio = termino.trim();
                const response = await axios.get(`/usuarios/buscar?q=${encodeURIComponent(terminoLimpio)}`);
                const usuariosDisponibles = response.data.filter(
                    user => !usuariosSeleccionados.some(selected => selected.id === user.id)
                );
                setResultadosBusqueda(usuariosDisponibles);
            } catch (error) {
                console.error("Error buscando usuarios:", error);
                setResultadosBusqueda([]);
            } finally {
                setCargandoBusqueda(false);
            }
        }, 300),
        [usuariosSeleccionados, esUsuarioPropietario]
    );

    const manejarCambioBusqueda = (e) => {
        if (!esUsuarioPropietario) return;
        const term = e.target.value;
        setTerminoBusqueda(term);
        ejecutarBusqueda(term);
    };

    const manejarFocoBusqueda = () => {
        if (!esUsuarioPropietario) return;
        setIsSearchFocused(true);
        if (!terminoBusqueda.trim()) {
            ejecutarBusqueda('');
        }
    };

    const manejarPerdidaFocoBusqueda = () => {
        setTimeout(() => {
            setIsSearchFocused(false);
        }, 150);
    };

    const manejarEnvio = (e) => {
        e.preventDefault();
        const dataToSend = { ...data };
        if (!esUsuarioPropietario) {
             delete dataToSend.userIds;
        }

        post(route('canciones.update', cancion.id), {
            data: dataToSend,
            onSuccess: (page) => {
                 const inputAudio = document.getElementById('archivo_nuevo');
                 if (inputAudio) inputAudio.value = null;
                 const inputFoto = document.getElementById('foto_nueva');
                 if (inputFoto) inputFoto.value = null;

                if (page.props.cancion && page.props.cancion.usuarios) {
                     setUsuariosSeleccionados(page.props.cancion.usuarios);
                     setData(prevData => ({
                         ...prevData,
                         userIds: page.props.cancion.usuarios.map(u => u.id),
                         archivo_nuevo: null,
                         foto_nueva: null,
                         eliminar_foto: false,
                         titulo: page.props.cancion.titulo || prevData.titulo,
                         genero: page.props.cancion.genero || prevData.genero,
                         publico: page.props.cancion.publico ?? prevData.publico,
                         licencia: page.props.cancion.licencia || prevData.licencia,
                     }));
                 } else {
                     setData(prevData => ({
                         ...prevData,
                         archivo_nuevo: null,
                         foto_nueva: null,
                         eliminar_foto: false,
                     }));
                 }

                setTerminoBusqueda('');
                setResultadosBusqueda([]);
                setIsSearchFocused(false);
            },
            preserveScroll: true,
            preserveState: false,
            forceFormData: true,
             onError: (errors) => {
                 console.error("Errores de formulario:", errors);
             }
        });
    };

    const manejarCambioInput = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const manejarCambioArchivo = (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            setData(name, files[0]);
            if (name === 'foto_nueva') {
                setData('eliminar_foto', false);
            }
        } else {
            setData(name, null);
        }
    };

    const manejarCambioCheckbox = (e) => {
        const { name, checked } = e.target;
        setData(name, checked);
        if (name === 'eliminar_foto' && checked) {
            setData('foto_nueva', null);
            const inputFoto = document.getElementById('foto_nueva');
            if (inputFoto) inputFoto.value = null;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Editar Canción: {cancion.titulo}</h2>}
        >
            <Head title={`Editar ${cancion.titulo}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {recentlySuccessful && successMessage && (
                        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-200 rounded shadow-sm">
                            {successMessage}
                        </div>
                    )}

                    {Object.keys(erroresMostrados).length > 0 && !recentlySuccessful && (
                         <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded shadow-sm">
                              <p className="font-bold">Por favor corrige los siguientes errores:</p>
                              <ul className="list-disc list-inside mt-2 text-sm">
                                  {Object.entries(erroresMostrados).map(([key, value]) => (
                                      <li key={key}>{value}</li>
                                  ))}
                              </ul>
                         </div>
                       )}

                    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
                             <form onSubmit={manejarEnvio} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                                        <input
                                            type="text" id="titulo" name="titulo"
                                            value={data.titulo} onChange={manejarCambioInput}
                                            className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${erroresMostrados.titulo ? 'border-red-500' : ''}`}
                                            required
                                        />
                                         {erroresMostrados.titulo && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{erroresMostrados.titulo}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                                        <input
                                            type="text" id="genero" name="genero"
                                            value={data.genero ?? ''} onChange={manejarCambioInput}
                                            className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${erroresMostrados.genero ? 'border-red-500' : ''}`}
                                        />
                                         {erroresMostrados.genero && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{erroresMostrados.genero}</span>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label htmlFor="licencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Licencia</label>
                                          <input
                                             id="licencia" type="text" name="licencia"
                                              value={data.licencia ?? ''} onChange={manejarCambioInput}
                                             className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${erroresMostrados.licencia ? 'border-red-500' : ''}`}
                                          />
                                           {erroresMostrados.licencia && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{erroresMostrados.licencia}</span>}
                                    </div>
                                    <div>
                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duración</label>
                                         <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{cancion.duracion ? `${Math.round(cancion.duracion)} segundos` : 'No disponible'}</p>
                                         <small className="text-xs text-gray-500 dark:text-gray-400">(Se actualiza si subes un nuevo audio)</small>
                                      </div>
                                    <div>
                                        <label htmlFor="publico" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibilidad *</label>
                                        <select
                                            id="publico" name="publico" value={data.publico.toString()}
                                            onChange={(e) => setData('publico', e.target.value === 'true')}
                                            className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm ${erroresMostrados.publico ? 'border-red-500' : ''}`} required >
                                            <option value={'false'}>Privado (Solo colaboradores)</option>
                                            <option value={'true'}>Público (Visible para todos)</option>
                                        </select>
                                         {erroresMostrados.publico && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{erroresMostrados.publico}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Archivo de Audio Actual</label>
                                        {cancion.archivo_url ? (
                                            <p className="mt-1 text-sm">
                                                <a href={cancion.archivo_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                                                    {cancion.archivo_url.split('/').pop()}
                                                </a>
                                            </p>
                                        ) : (
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay archivo actual.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="archivo_nuevo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reemplazar Archivo Audio (MP3, WAV)</label>
                                        <input
                                            type="file" id="archivo_nuevo" name="archivo_nuevo"
                                            onChange={manejarCambioArchivo}
                                            className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${erroresMostrados.archivo_nuevo ? 'border-red-500' : ''}`}
                                            accept=".mp3,.wav"
                                        />
                                        {data.archivo_nuevo && <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">Nuevo: {data.archivo_nuevo.name}</span>}
                                         {erroresMostrados.archivo_nuevo && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{erroresMostrados.archivo_nuevo}</span>}
                                    </div>
                                    <div>
                                        <label htmlFor="foto_nueva" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reemplazar Foto (JPG, PNG)</label>
                                        {cancion.foto_url && !data.eliminar_foto && (
                                            <div className="mt-1 mb-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual:</p>
                                                <img src={cancion.foto_url} alt="Foto actual" className="h-20 w-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                                            </div>
                                        )}
                                        {data.eliminar_foto && (
                                            <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">La foto actual será eliminada.</p>
                                        )}
                                        <input
                                            type="file" id="foto_nueva" name="foto_nueva"
                                            onChange={manejarCambioArchivo}
                                            className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${erroresMostrados.foto_nueva ? 'border-red-500' : ''}`}
                                            accept="image/jpeg,image/png,image/jpg"
                                            disabled={data.eliminar_foto}
                                        />
                                        {data.foto_nueva && <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">Nueva: {data.foto_nueva.name}</span>}
                                         {erroresMostrados.foto_nueva && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{erroresMostrados.foto_nueva}</span>}

                                        {cancion.foto_url && (
                                            <div className="mt-2 flex items-center">
                                                <input
                                                    type="checkbox" id="eliminar_foto" name="eliminar_foto"
                                                    checked={data.eliminar_foto} onChange={manejarCambioCheckbox}
                                                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                                                />
                                                <label htmlFor="eliminar_foto" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                                    Eliminar foto actual
                                                </label>
                                            </div>
                                        )}
                                         {erroresMostrados.eliminar_foto && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{erroresMostrados.eliminar_foto}</span>}
                                    </div>
                                </div>

                                <div className={`border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 ${!esUsuarioPropietario ? 'opacity-60' : ''}`}>
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                                        Asociar Colaboradores {!esUsuarioPropietario && <span className="text-sm font-normal text-orange-600 dark:text-orange-400">(Solo el propietario puede modificar)</span>}
                                    </h3>
                                    <div className="relative">
                                        <label htmlFor="user-search" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${!esUsuarioPropietario ? 'text-gray-500 dark:text-gray-500' : ''}`}>Buscar Usuario por Nombre o Email</label>
                                        <input
                                            id="user-search"
                                            type="search"
                                            value={terminoBusqueda}
                                            onChange={manejarCambioBusqueda}
                                            onFocus={manejarFocoBusqueda}
                                            onBlur={manejarPerdidaFocoBusqueda}
                                            className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10 ${!esUsuarioPropietario ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                                            placeholder={esUsuarioPropietario ? "Escribe para buscar..." : "Modificación deshabilitada"}
                                            autoComplete="off"
                                            disabled={!esUsuarioPropietario}
                                        />
                                        {cargandoBusqueda && esUsuarioPropietario && (
                                            <div className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center pointer-events-none">
                                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        )}

                                        {isSearchFocused && esUsuarioPropietario && (
                                            <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg max-h-60 overflow-auto z-10 absolute w-full">
                                                {cargandoBusqueda && terminoBusqueda.trim() && (
                                                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Buscando...</li>
                                                )}
                                                {!cargandoBusqueda && resultadosBusqueda.length === 0 && (
                                                    <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {terminoBusqueda.trim() ? 'No se encontraron usuarios.' : 'No hay otros usuarios disponibles.'}
                                                    </li>
                                                )}
                                                {!cargandoBusqueda && resultadosBusqueda.map(usuario => (
                                                    <li key={usuario.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center cursor-pointer"
                                                        onMouseDown={() => añadirUsuario(usuario)}
                                                    >
                                                        <div>
                                                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{usuario.name}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({usuario.email})</span>
                                                        </div>
                                                    </li>
                                                ))}
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
                                                            {usuario.es_propietario && (
                                                                 <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                                                    {auth.user?.id === usuario.id ? '(Tú - Propietario)' : '(Propietario)'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!usuario.es_propietario && esUsuarioPropietario && (
                                                            <button
                                                                type="button"
                                                                onClick={() => eliminarUsuario(usuario.id)}
                                                                className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded"
                                                                title="Quitar colaborador"
                                                            >
                                                                Quitar
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                             {erroresMostrados.userIds && typeof erroresMostrados.userIds === 'string' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{erroresMostrados.userIds}</p>}
                                             {Object.keys(erroresMostrados).filter(key => key.startsWith('userIds.')).map(key => (
                                                  <p key={key} className="mt-1 text-xs text-red-600 dark:text-red-400">{erroresMostrados[key]}</p>
                                             ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end items-center pt-5 mt-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                                    <Link
                                        href={route('canciones.index')}
                                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded-md font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-25 transition ease-in-out duration-150"
                                        as="button"
                                        disabled={processing}
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 dark:focus:ring-offset-gray-800"
                                    >
                                        {processing ? 'Actualizando...' : 'Actualizar Canción'}
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
