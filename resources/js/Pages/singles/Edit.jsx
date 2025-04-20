import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import axios from 'axios';
import { debounce } from 'lodash';

export default function Edit({ auth, single, errors: erroresSesion, success: mensajeExitoSesion }) {

    const initialUserIds = single.usuarios?.map(u => u.id) || [];
    const initialSelectedUsers = single.usuarios?.map(u => ({ id: u.id, name: u.name, email: u.email })) || [];

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        _method: 'PUT',
        nombre: single.nombre || '',
        publico: single.publico ?? false,
        imagen_nueva: null,
        eliminar_imagen: false,
        userIds: initialUserIds,
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [showInitialUsers, setShowInitialUsers] = useState(false);

    const addUser = (user) => {
        if (!selectedUsers.some(selected => selected.id === user.id)) {
            const newSelectedUsers = [...selectedUsers, user];
            setSelectedUsers(newSelectedUsers);
            setData('userIds', newSelectedUsers.map(u => u.id));
            setSearchTerm('');
            setSearchResults([]);
            setShowInitialUsers(false);
        }
    };

    const removeUser = (userId) => {
        // Example: Prevent removing the original creator if needed
        // Rsinglelace Auth::id() check if creator status is stored differently
        if (auth.user?.id === userId) { // Assuming auth user is the creator for this check
            console.warn("Cannot remove the single creator.");
            return;
        }
        const newSelectedUsers = selectedUsers.filter(user => user.id !== userId);
        setSelectedUsers(newSelectedUsers);
        setData('userIds', newSelectedUsers.map(u => u.id));
        if (!searchTerm.trim()) {
            performSearch('');
        }
    };

     const performSearch = useCallback(
        debounce(async (term) => {
            setIsLoadingSearch(true);
            try {
                const response = await axios.get(route('users.search', { q: term }));
                const availableUsers = response.data.filter(
                    user => !selectedUsers.some(selected => selected.id === user.id)
                );
                setSearchResults(availableUsers);
                setShowInitialUsers(!term.trim() && availableUsers.length > 0);
            } catch (error) {
                console.error("Error searching users:", error);
                setSearchResults([]);
                setShowInitialUsers(false);
            } finally {
                setIsLoadingSearch(false);
            }
        }, 300),
        [selectedUsers] // Recreate if selectedUsers change
    );

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        performSearch(term);
    };

    useEffect(() => {
        if (!searchTerm.trim() && !showInitialUsers && selectedUsers.length > 0) {
             performSearch('');
        }
        return () => {
            performSearch.cancel();
        };
    }, [performSearch, searchTerm, showInitialUsers, selectedUsers]);


    const manejarEnvio = (e) => {
        e.preventDefault();
        post(route('singles.update', single.id), {
            forceFormData: true,
            onSuccess: () => {
                setData(datosAnteriores => ({
                    ...datosAnteriores,
                    imagen_nueva: null,
                    eliminar_imagen: false,
                }));
                const inputArchivoImagen = document.getElementById('imagen_nueva');
                if(inputArchivoImagen) inputArchivoImagen.value = null;
                // Reset search state on success, but kesingle selectedUsers as they are now saved
                setSearchTerm('');
                setSearchResults([]);
                setShowInitialUsers(false);
            },
            onError: (errores) => {
                console.error("Errores de actualización de single:", errores);
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
            if(inputArchivo) inputArchivo.value = null;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Editar Single: {single.nombre}</h2>}
        >
            <Head title={`Editar ${single.nombre}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {recentlySuccessful && mensajeExitoSesion && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                            {mensajeExitoSesion}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Editando Single
                            </h3>

                           {Object.keys(erroresSesion || {}).length > 0 && !errors && (
                                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                                    Hubo errores al procesar tu solicitud. Revisa los campos.
                                </div>
                            )}

                            <form onSubmit={manejarEnvio} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="nombre" value="Nombre *" />
                                    <TextInput
                                        id="nombre"
                                        name="nombre"
                                        value={data.nombre}
                                        className="mt-1 block w-full"
                                        autoComplete="nombre"
                                        isFocused={true}
                                        onChange={manejarCambioInput}
                                        required
                                    />
                                    <InputError message={errors.nombre} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="publico" value="Visibilidad *" />
                                    <select
                                        id="publico"
                                        name="publico"
                                        value={data.publico} // Boolean value works here
                                        onChange={(e) => setData('publico', e.target.value === 'true')} // Convert back to boolean
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm"
                                        required
                                    >
                                        <option value="false">Privado (Solo colaboradores)</option>
                                        <option value="true">Público (Visible para todos)</option>
                                    </select>
                                    <InputError message={errors.publico} className="mt-2" />
                                </div>


                                <div>
                                    <InputLabel htmlFor="imagen_nueva" value="Imagen (Opcional: reemplazar actual)" />
                                     {single.imagen && !data.eliminar_imagen && (
                                        <div className="mt-2 mb-4">
                                            <p className="text-sm text-gray-500 mb-1">Imagen Actual:</p>
                                            <img src={`/storage/${single.imagen}`} alt="Imagen actual de la single" className="h-24 w-24 object-cover rounded border border-gray-200" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="imagen_nueva"
                                        name="imagen_nueva"
                                        onChange={manejarCambioArchivo}
                                        className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.imagen_nueva ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                                        accsinglet="image/jpeg,image/png,image/jpg"
                                        disabled={data.eliminar_imagen}
                                    />
                                    {data.imagen_nueva && <span className="text-green-600 text-xs mt-1 block">Nueva imagen seleccionada: {data.imagen_nueva.name}</span>}
                                    <InputError message={errors.imagen_nueva} className="mt-2" />


                                     {single.imagen && (
                                        <div className="mt-2 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="eliminar_imagen"
                                                name="eliminar_imagen"
                                                checked={data.eliminar_imagen}
                                                onChange={manejarCambioCheckbox}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor="eliminar_imagen" className="ml-2 block text-sm text-gray-900">
                                                Eliminar imagen actual (si no subes una nueva)
                                            </label>
                                        </div>
                                    )}
                                     <InputError message={errors.eliminar_imagen} className="mt-2" />
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                                        Asociar Usuarios (Colaboradores)
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Usuario por Nombre o Email</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <input
                                                    id="user-search"
                                                    type="search"
                                                    name="user-search"
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                    onFocus={() => { if(!searchTerm && !showInitialUsers) performSearch('') }}
                                                    className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                                                    placeholder="Escribe para buscar..."
                                                    autoComplete="off"
                                                />
                                                {isLoadingSearch && (
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {!isLoadingSearch && (searchTerm || showInitialUsers) && (
                                                <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg max-h-60 overflow-auto w-full">
                                                    {searchResults.length > 0 ? (
                                                        searchResults.map(user => (
                                                            <li key={user.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center cursor-pointer group" onClick={() => addUser(user)}>
                                                                <div>
                                                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({user.email})</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); addUser(user); }}
                                                                    className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    Añadir
                                                                </button>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        searchTerm && <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No se encontraron usuarios.</li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>

                                        {selectedUsers.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usuarios Seleccionados:</h4>
                                                <ul className="space-y-2">
                                                    {selectedUsers.map(user => (
                                                        <li key={user.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                            <div>
                                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({user.email})</span>
                                                            </div>
                                                            {auth.user?.id === user.id ? (
                                                                <span className="ml-4 text-xs text-gray-500 dark:text-gray-400 font-medium">(Tú - Creador)</span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeUser(user.id)}
                                                                    className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded"
                                                                    title="Quitar usuario"
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
                                         {selectedUsers.length === 0 && errors.userIds && typeof errors.userIds === 'string' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.userIds}</p>}
                                    </div>
                                </div>


                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Actualizando...' : 'Actualizar Single'}
                                    </PrimaryButton>

                                    <Link
                                        href={route('singles.index')}
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Cancelar
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
