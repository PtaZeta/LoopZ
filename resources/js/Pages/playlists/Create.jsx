import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';

// --- Componente CrearPlaylist ---
function CrearPlaylist({ auth }) {
    // --- Estado Inicial ---
    const usuarioCreadorInicial = auth.user
        ? { id: auth.user.id, name: auth.user.name, email: auth.user.email }
        : null;

    const { data, setData, post, processing, errors, progress, reset } = useForm({
        nombre: '',
        publico: false, // Booleano por defecto
        descripcion: '',
        imagen: null,
        userIds: auth.user ? [auth.user.id] : [],
    });

    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(usuarioCreadorInicial ? [usuarioCreadorInicial] : []);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);

    // --- Funciones Manejadoras de Usuarios ---
    const agregarUsuario = (usuario) => {
        if (!usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)) {
            const nuevosUsuariosSeleccionados = [...usuariosSeleccionados, usuario];
            setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
            setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
            setTerminoBusqueda('');
            setResultadosBusqueda([]);
            setMostrarResultados(false); // Ocultar lista tras selección
        }
    };

    const quitarUsuario = (usuarioId) => {
        if (auth.user?.id === usuarioId) {
            alert("No puedes quitar al creador de la playlist.");
            return;
        }
        const nuevosUsuariosSeleccionados = usuariosSeleccionados.filter(usuario => usuario.id !== usuarioId);
        setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
        setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
        // Refrescar búsqueda si es necesario (opcional)
        // if (terminoBusqueda.trim()) {
        //     realizarBusqueda(terminoBusqueda);
        // } else {
        //     realizarBusqueda(''); // Podría recargar la lista inicial
        // }
    };

    // --- Búsqueda Debounced ---
    const realizarBusqueda = useCallback(
        debounce(async (termino) => {
            if (!auth.user) return; // Salir si no hay usuario autenticado

            setCargandoBusqueda(true);
            // No necesariamente mostramos resultados aquí, esperamos la respuesta
            // setMostrarResultados(true); // Mostrar se controla al escribir o enfocar

            try {
                console.log(`Buscando usuarios con término: "${termino}"`);
                // La llamada se hace incluso con término vacío
                // Se espera que el backend devuelva sugerencias limitadas si q=''
                const respuesta = await axios.get(route('usuarios.buscar', { q: termino, limit: 10 })); // Añadido limit opcional
                console.log("Respuesta de búsqueda:", respuesta.data);

                const usuariosDisponibles = respuesta.data.filter(
                    usuario => usuario.id !== auth.user.id && !usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)
                );
                console.log("Usuarios disponibles:", usuariosDisponibles);

                setResultadosBusqueda(usuariosDisponibles);
                // Mostrar resultados si la búsqueda devolvió algo O si el término está vacío (para mostrar la lista inicial)
                // setMostrarResultados(usuariosDisponibles.length > 0 || termino.trim() === '');
            } catch (error) {
                console.error("Error buscando usuarios:", error.response?.data || error.message);
                setResultadosBusqueda([]);
                // setMostrarResultados(false); // Ocultar si hay error
            } finally {
                setCargandoBusqueda(false);
            }
        }, 300),
        [usuariosSeleccionados, auth.user?.id] // Dependencias clave
    );

    // --- Manejador de Cambio en Input de Búsqueda ---
    const manejarCambioBusqueda = (e) => {
        const termino = e.target.value;
        setTerminoBusqueda(termino);
        if (termino.trim() === '') {
            setResultadosBusqueda([]); // Limpiar resultados explícitamente
            setMostrarResultados(true); // Mantener visible para mostrar sugerencias (si se cargan en focus/vacio)
            realizarBusqueda.cancel(); // Cancelar debounce
            realizarBusqueda(''); // Realizar búsqueda de sugerencias si se borra todo
        } else {
            setMostrarResultados(true); // Mostrar al empezar a escribir
            realizarBusqueda(termino); // Lanzar búsqueda debounced
        }
    };

    // --- Manejador de Foco en Input de Búsqueda ---
     const manejarFocoBusqueda = () => {
        // Si el input está vacío al enfocar, cargar/mostrar sugerencias
        if (!terminoBusqueda.trim()) {
            setMostrarResultados(true);
            // Solo llamar si los resultados no están ya cargados para evitar llamadas repetidas
            if (resultadosBusqueda.length === 0 && !cargandoBusqueda) {
                 realizarBusqueda('');
            }
        } else {
            // Si ya hay texto, solo asegurarse que la lista sea visible
            setMostrarResultados(true);
        }
    };


    // --- Manejador de Envío del Formulario ---
    const manejarEnvio = (e) => {
        e.preventDefault();
        // Asegurarse que el creador está en la lista final
        const finalUserIds = Array.from(new Set( auth.user ? [...data.userIds, auth.user.id] : data.userIds));
        const dataToSend = { ...data, userIds: finalUserIds, imagen: data.imagen }; // Asegurar que la imagen va

        console.log("Enviando datos:", dataToSend);

        post(route('playlists.store'), {
             // useForm maneja 'data' internamente, no es necesario pasarlo explícitamente aquí con Inertia v1+
             // data: dataToSend, // Ya no es necesario con useForm hook >= v1.0
             forceFormData: true, // NECESARIO si envías archivos
             preserveScroll: true,
             onSuccess: () => {
                 reset(); // Limpia todos los campos gestionados por useForm
                 // Reinicializa estado local no gestionado por useForm
                 if (auth.user && usuarioCreadorInicial) {
                     setUsuariosSeleccionados([usuarioCreadorInicial]);
                     // Reafirmar userIds tras reset (aunque useForm debería manejarlo)
                     setData('userIds', [auth.user.id]);
                 } else {
                     setUsuariosSeleccionados([]);
                     setData('userIds', []);
                 }
                 setTerminoBusqueda('');
                 setResultadosBusqueda([]);
                 setMostrarResultados(false);
                 // Limpiar input de archivo manualmente si reset no lo hace
                 const fileInput = document.getElementById('imagen');
                 if(fileInput) fileInput.value = null;
             },
             onError: (err) => {
                  console.error("Error al crear playlist:", err);
             },
        });
    };

    // --- Efecto para Cerrar Resultados al Hacer Clic Fuera ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            const searchContainer = document.getElementById('search-container');
            // Si el clic es fuera del contenedor de búsqueda Y fuera del input mismo
            if (searchContainer && !searchContainer.contains(event.target) && event.target.id !== 'user-search') {
                setMostrarResultados(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // --- Renderizado del Componente ---
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Crear Nueva Playlist</h2>}
        >
            <Head title="Crear Playlist" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-xl sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Nueva Playlist</h3>

                            <form onSubmit={manejarEnvio} className="space-y-6">

                                {/* Nombre */}
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                                    <input
                                        id="nombre"
                                        type="text"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-200 sm:text-sm ${errors.nombre ? 'border-red-500' : ''}`}
                                        required
                                        autoComplete="off"
                                    />
                                    {errors.nombre && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nombre}</p>}
                                </div>

                                {/* Visibilidad */}
                                <div>
                                    <label htmlFor="publico" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibilidad *</label>
                                    <select
                                        id="publico"
                                        name="publico"
                                        value={String(data.publico)} // Convertir boolean a string para el value del select
                                        onChange={(e) => setData('publico', e.target.value === 'true')}
                                        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-200 sm:text-sm ${errors.publico ? 'border-red-500' : ''}`}
                                        required
                                    >
                                        <option value="false">Privado (Solo colaboradores)</option>
                                        <option value="true">Público (Visible para todos)</option>
                                    </select>
                                    {errors.publico && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.publico}</p>}
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                    <textarea
                                        id="descripcion"
                                        rows="4"
                                        value={data.descripcion}
                                        onChange={(e) => setData('descripcion', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-200 sm:text-sm ${errors.descripcion ? 'border-red-500' : ''}`}
                                    ></textarea>
                                    {errors.descripcion && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.descripcion}</p>}
                                </div>

                                {/* Imagen */}
                                <div>
                                    <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen (Opcional)</label>
                                    <input
                                        type="file"
                                        id="imagen"
                                        accept="image/*"
                                        onChange={(e) => setData('imagen', e.target.files[0])}
                                        className={`mt-1 block w-full text-sm dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800 file:text-indigo-700 dark:file:text-indigo-200 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700 ${errors.imagen ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'} rounded-md focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 dark:focus:ring-offset-slate-800 cursor-pointer`}
                                    />
                                     {progress && data.imagen && (
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                        </div>
                                    )}
                                    {errors.imagen && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.imagen}</p>}
                                </div>

                                {/* Asociar Usuarios */}
                                <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">Asociar Usuarios (Colaboradores)</h3>
                                    <div id="search-container" className="space-y-4 relative"> {/* Añadido relative aquí */}
                                        <div>
                                            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Usuario</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    id="user-search"
                                                    type="search"
                                                    value={terminoBusqueda}
                                                    onChange={manejarCambioBusqueda}
                                                    onFocus={manejarFocoBusqueda} // Cargar/mostrar lista al enfocar
                                                    className="block w-full pr-10 rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-700 dark:text-gray-200 sm:text-sm"
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

                                            {/* Lista de Resultados/Sugerencias */}
                                            {mostrarResultados && (
                                                <ul className="absolute mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 shadow-lg max-h-60 overflow-auto z-10">
                                                   {cargandoBusqueda && ( <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Buscando...</li> )}
                                                   {!cargandoBusqueda && resultadosBusqueda.length === 0 && ( <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No se encontraron usuarios.</li> )}
                                                   {!cargandoBusqueda && resultadosBusqueda.map(usuario => (
                                                       <li key={usuario.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex justify-between items-center cursor-pointer group" onClick={() => agregarUsuario(usuario)}>
                                                           <div>
                                                               <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{usuario.name}</span>
                                                               <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({usuario.email})</span>
                                                           </div>
                                                           <button type="button" onClick={(e) => { e.stopPropagation(); agregarUsuario(usuario); }} className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"> Añadir </button>
                                                       </li>
                                                   ))}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Lista de Seleccionados */}
                                        {usuariosSeleccionados.length > 0 && (
                                            <div className="mt-4 pt-2">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usuarios Seleccionados:</h4>
                                                <ul className="space-y-2">
                                                    {usuariosSeleccionados.map(usuario => (
                                                        <li key={usuario.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded border border-gray-200 dark:border-slate-600">
                                                            <div>
                                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{usuario.name}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({usuario.email})</span>
                                                            </div>
                                                            {auth.user?.id === usuario.id
                                                              ? <span className="ml-4 text-xs text-gray-500 dark:text-gray-400 font-medium">(Tú - Creador)</span>
                                                              : <button type="button" onClick={() => quitarUsuario(usuario.id)} className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded" title="Quitar usuario"> Quitar </button>
                                                            }
                                                        </li>
                                                    ))}
                                                </ul>
                                                {errors.userIds && typeof errors.userIds === 'string' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.userIds}</p>}
                                                {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => ( <p key={key} className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key]}</p> ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Botones Finales */}
                                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
                                    <Link
                                        href={route('playlists.index')}
                                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-md font-semibold text-xs text-gray-700 dark:text-gray-200 uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-25 transition ease-in-out duration-150"
                                        as="button"
                                        disabled={processing}
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-25 transition ease-in-out duration-150"
                                        disabled={processing || !auth.user}
                                    >
                                        {processing ? 'Guardando...' : 'Guardar Playlist'}
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

export default CrearPlaylist;
