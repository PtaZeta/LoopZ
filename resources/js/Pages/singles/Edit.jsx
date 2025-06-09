import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import axios from 'axios';
import { PencilIcon, TrashIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

const ImagenItem = ({ url, titulo, className = "w-10 h-10", iconoFallback }) => {
    const [src, setSrc] = useState(url);
    const [error, setError] = useState(false);

    useEffect(() => {
        setSrc(url);
        setError(false);
    }, [url]);

    const manejarErrorImagen = () => setError(true);

    if (error || !src) {
        return (
            <div className={`${className} bg-slate-700 flex items-center justify-center text-slate-500 rounded`}>
                {iconoFallback || (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    </svg>
                )}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={`Portada de ${titulo}`}
            className={`${className} object-cover rounded shadow-sm flex-shrink-0`}
            loading="lazy"
            onError={manejarErrorImagen}
        />
    );
};

ImagenItem.propTypes = {
    url: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    className: PropTypes.string,
    iconoFallback: PropTypes.node,
};

export default function ContenedorEdit({ auth, contenedor, errors: erroresSesion, success: mensajeExitoSesion }) {

    const obtenerUrlImagen = (item) => {
        if (!item) return null;
        if (item.imagen) {
            return item.imagen.startsWith('http') ? item.imagen : `/storage/${item.imagen}`;
        }
        if (item?.foto_url) return item.foto_url;
        if (item?.image_url) return item.image_url;
        return null;
    };

    const esCreador = contenedor.is_owner ?? false;

    const idsUsuariosIniciales = contenedor.usuarios?.map(u => u.id) || [];
    const usuariosSeleccionadosIniciales = contenedor.usuarios?.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        pivot: u.pivot
    })) || [];


    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        _method: 'PUT',
        nombre: contenedor.nombre || '',
        publico: contenedor.publico ?? false,
        descripcion: contenedor.descripcion || '',
        imagen_nueva: null,
        eliminar_imagen: false,
        userIds: esCreador ? idsUsuariosIniciales : undefined,
    });

    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(usuariosSeleccionadosIniciales);
    const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

    const agregarUsuario = (usuario) => {
        if (!esCreador) return;
        if (!usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)) {
            const usuarioParaAgregar = { ...usuario, pivot: { propietario: false } };
            const nuevosUsuariosSeleccionados = [...usuariosSeleccionados, usuarioParaAgregar];
            setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
            setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
            setTerminoBusqueda('');
            setResultadosBusqueda([]);
        }
    };

    const quitarUsuario = (usuarioId) => {
        if (!esCreador) return;
        const usuarioAQuitar = usuariosSeleccionados.find(u => u.id === usuarioId);
        if (usuarioAQuitar?.pivot?.propietario) {
             alert("No puedes quitar al propietario de la single.");
             return;
        }
        const nuevosUsuariosSeleccionados = usuariosSeleccionados.filter(usuario => usuario.id !== usuarioId);
        setUsuariosSeleccionados(nuevosUsuariosSeleccionados);
        setData('userIds', nuevosUsuariosSeleccionados.map(u => u.id));
        if (terminoBusqueda.trim()) {
            realizarBusqueda(terminoBusqueda);
        } else {
        }
    };

    const realizarBusqueda = useCallback(
        debounce(async (termino) => {
            if (!esCreador) {
                setResultadosBusqueda([]);
                return;
            };
            setCargandoBusqueda(true);
            try {
                const respuesta = await axios.get(route('usuarios.buscar', { q: termino }));
                const usuariosDisponibles = respuesta.data.filter(
                    usuario => !usuariosSeleccionados.some(seleccionado => seleccionado.id === usuario.id)
                );
                setResultadosBusqueda(usuariosDisponibles);
            } catch (error) {
                 console.error("Error buscando usuarios:", error);
                 setResultadosBusqueda([]);
            }
            finally {
                setCargandoBusqueda(false);
            }
        }, 300),
        [usuariosSeleccionados, esCreador]
    );

    const manejarCambioBusqueda = (e) => {
        if (!esCreador) return;
        const termino = e.target.value;
        setTerminoBusqueda(termino);
        if (termino.trim().length > 0) {
            realizarBusqueda(termino);
        } else {
            setResultadosBusqueda([]);
            realizarBusqueda.cancel();
        }
    };

    useEffect(() => {
        return () => {
            realizarBusqueda.cancel();
        };
    }, [realizarBusqueda]);

    const manejarEnvio = (e) => {
        e.preventDefault();
        const dataToSend = { ...data };
        if (!esCreador) {
            delete dataToSend.userIds;
        }

        post(route('singles.update', contenedor.id), {
            data: dataToSend,
            forceFormData: true,
            onSuccess: () => {
                setData(datosAnteriores => ({
                    ...datosAnteriores,
                    imagen_nueva: null,
                    eliminar_imagen: false,
                }));
                const inputArchivoImagen = document.getElementById('imagen_nueva');
                if (inputArchivoImagen) inputArchivoImagen.value = null;
                setTerminoBusqueda('');
                setResultadosBusqueda([]);
            },
            preserveScroll: true,
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
            if (name === 'imagen_nueva') {
                setData('eliminar_imagen', false);
            }
        } else {
            setData(name, null);
        }
    };

    const manejarCambioCheckbox = (e) => {
        const { name, checked } = e.target;
        setData(name, checked);
        if (name === 'eliminar_imagen' && checked) {
            setData('imagen_nueva', null);
            const inputArchivo = document.getElementById('imagen_nueva');
            if (inputArchivo) inputArchivo.value = null;
        }
    };

    const urlImagenActual = obtenerUrlImagen(contenedor);

    return (
        <AuthenticatedLayout>
            <Head title={`Editar ${contenedor.nombre}`} />
            <div className="py-12 pt-20 min-h-screen">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    {recentlySuccessful && mensajeExitoSesion && (
                        <div className="mb-4 p-4 bg-green-900 border border-green-700 text-green-200 rounded-md shadow-sm" role="alert">
                            {mensajeExitoSesion}
                        </div>
                    )}
                    <div className="bg-slate-800 overflow-hidden shadow-xl sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-100">
                            <h3 className="text-lg font-medium text-gray-100 mb-4">Editando Single</h3>
                            {Object.keys(erroresSesion || {}).length > 0 && !errors && (
                                <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded-md shadow-sm" role="alert">
                                    Hubo errores al procesar tu solicitud. Revisa los campos.
                                </div>
                            )}
                            <form onSubmit={manejarEnvio} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="nombre" value="Nombre *" className="text-gray-300" />
                                    <TextInput
                                        id="nombre"
                                        name="nombre"
                                        value={data.nombre}
                                        className="mt-1 block w-full"
                                        autoComplete="off"
                                        isFocused={true}
                                        onChange={manejarCambioInput}
                                        required
                                    />
                                    <InputError message={errors.nombre} className="mt-2 text-red-400" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="descripcion" value="Descripción" className="text-gray-300" />
                                    <textarea
                                        id="descripcion"
                                        name="descripcion"
                                        value={data.descripcion}
                                        onChange={manejarCambioInput}
                                        rows="4"
                                        className="mt-1 block w-full border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-slate-800"
                                    ></textarea>
                                    <InputError message={errors.descripcion} className="mt-2 text-red-400" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="publico" value="Visibilidad *" className="text-gray-300" />
                                    <select
                                        id="publico"
                                        name="publico"
                                        value={data.publico ? 'true' : 'false'}
                                        onChange={(e) => setData('publico', e.target.value === 'true')}
                                        className="mt-1 block w-full rounded-md border-slate-600 shadow-sm focus:ring-purple-500 focus:border-transparent bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-slate-800 sm:text-sm"
                                        required
                                    >
                                        <option value="false">Privado (Solo colaboradores)</option>
                                        <option value="true">Público (Visible para todos)</option>
                                    </select>
                                    <InputError message={errors.publico} className="mt-2 text-red-400" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="imagen_nueva" value="Imagen (Opcional: reemplazar actual)" className="text-gray-300"/>
                                    {urlImagenActual && !data.eliminar_imagen && (
                                        <div className="mt-2 mb-4">
                                            <p className="text-sm text-gray-400 mb-1">Imagen Actual:</p>
                                            <img src={urlImagenActual} alt="Imagen actual" className="h-24 w-24 object-cover rounded border border-slate-600" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="imagen_nueva"
                                        name="imagen_nueva"
                                        onChange={manejarCambioArchivo}
                                        className={`mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-blue-300 hover:file:bg-slate-500 ${errors.imagen_nueva ? 'border-red-500' : 'border-slate-600'} rounded-md focus:ring-purple-500 focus:border-transparent bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-slate-800`}
                                        accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
                                        disabled={data.eliminar_imagen}
                                    />
                                    {data.imagen_nueva && <span className="text-green-400 text-xs mt-1 block">Nueva imagen: {data.imagen_nueva.name}</span>}
                                    <InputError message={errors.imagen_nueva} className="mt-2 text-red-400" />
                                    {urlImagenActual && (
                                        <div className="mt-2 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="eliminar_imagen"
                                                name="eliminar_imagen"
                                                checked={data.eliminar_imagen}
                                                onChange={manejarCambioCheckbox}
                                                className="h-4 w-4 text-pink-600 border-slate-600 rounded focus:ring-pink-500 bg-gray-800 checked:bg-pink-500"
                                            />
                                            <label htmlFor="eliminar_imagen" className="ml-2 block text-sm text-gray-300">
                                                Eliminar imagen actual (si no subes una nueva)
                                            </label>
                                        </div>
                                    )}
                                    <InputError message={errors.eliminar_imagen} className="mt-2 text-red-400" />
                                </div>
                                <div className={`border-t border-slate-700 pt-6 mt-6 ${!esCreador ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <h3 className="text-lg font-medium leading-6 text-gray-100 mb-4">Asociar Usuarios (Colaboradores)</h3>
                                    {!esCreador && <p className="text-sm text-yellow-400 mb-4 italic">(Solo el propietario puede modificar los colaboradores)</p>}
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="user-search" value="Buscar Usuario por Nombre o Email" className="text-gray-300"/>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <TextInput
                                                    id="user-search"
                                                    type="search"
                                                    name="user-search"
                                                    value={terminoBusqueda}
                                                    onChange={manejarCambioBusqueda}
                                                    className="block w-full pr-10"
                                                    placeholder="Escribe para buscar..."
                                                    autoComplete="off"
                                                    disabled={!esCreador}
                                                />
                                                {cargandoBusqueda && (
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            {!cargandoBusqueda && terminoBusqueda.trim().length > 0 && esCreador && (
                                                <ul className="mt-2 border border-slate-600 rounded-md bg-slate-700 shadow-lg max-h-60 overflow-auto w-full z-10">
                                                    {resultadosBusqueda.length > 0 ? (
                                                        resultadosBusqueda.map(usuario => (
                                                            <li key={usuario.id} className="px-4 py-2 hover:bg-slate-600 flex justify-between items-center cursor-pointer group" onClick={() => agregarUsuario(usuario)}>
                                                                <div>
                                                                    <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                                    <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); agregarUsuario(usuario); }}
                                                                    className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    Añadir
                                                                </button>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="px-4 py-2 text-sm text-gray-400">No se encontraron usuarios.</li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                        {usuariosSeleccionados.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-300 mb-2">Usuarios Seleccionados:</h4>
                                                <ul className="space-y-2">
                                                    {usuariosSeleccionados.map(usuario => (
                                                        <li key={usuario.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded border border-slate-600">
                                                            <div>
                                                                <span className="font-medium text-sm text-gray-100">{usuario.name}</span>
                                                                <span className="text-xs text-gray-400 ml-2">({usuario.email})</span>
                                                            </div>
                                                            {usuario.pivot?.propietario ? (
                                                                <span className="ml-4 text-xs text-gray-400 font-medium">(Propietario)</span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => quitarUsuario(usuario.id)}
                                                                    className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Quitar usuario"
                                                                    disabled={!esCreador}
                                                                >
                                                                    Quitar
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <InputError message={errors.userIds && typeof errors.userIds === 'string' ? errors.userIds : ''} className="mt-1 text-xs text-red-400" />
                                                {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => (
                                                    <InputError key={key} message={errors[key]} className="mt-1 text-xs text-red-400" />
                                                ))}
                                            </div>
                                        )}
                                        {usuariosSeleccionados.length === 0 && errors.userIds && typeof errors.userIds === 'string' && <InputError message={errors.userIds} className="mt-1 text-xs text-red-400" />}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-8">
                                    <PrimaryButton disabled={processing} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600">
                                        {processing ? 'Actualizando...' : 'Actualizar Single'}
                                    </PrimaryButton>
                                    <button
                                        type="button"
                                        onClick={() => window.history.back()}
                                        className="inline-flex items-center px-4 py-2 bg-slate-600 border border-slate-500 rounded-md font-semibold text-xs text-gray-200 uppercase tracking-widest shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Cancelar
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
