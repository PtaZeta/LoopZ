import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';

// import InputError from '@/Components/InputError';

function PlaylistCreate({ auth }) {
    const { data, setData, post, processing, errors, progress, reset } = useForm({
        nombre: '',
        descripcion: '',
        imagen: null,
        userIds: [],
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
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
        if (auth.user?.id === userId) {
            console.warn("Cannot remove the playlist creator.");
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
        [selectedUsers, auth.user?.id]
    );

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        performSearch(term);
    };

    useEffect(() => {
        if (auth.user && !selectedUsers.some(u => u.id === auth.user.id)) {
            const creatorUser = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
            const newSelectedUsers = [creatorUser];
            setSelectedUsers(newSelectedUsers);
            setData('userIds', newSelectedUsers.map(u => u.id));
        }
    }, [auth.user]);

    useEffect(() => {
        if (!searchTerm.trim() && !showInitialUsers && selectedUsers.some(u => u.id === auth.user?.id)) {
             performSearch('');
        }
        return () => {
            performSearch.cancel();
        };
    }, [performSearch, searchTerm, showInitialUsers, selectedUsers, auth.user?.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('playlists.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                if (auth.user) {
                    const creatorUser = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
                    setSelectedUsers([creatorUser]);
                    setData('userIds', [creatorUser.id]);
                } else {
                    setSelectedUsers([]);
                    setData('userIds', []);
                }
                setSearchTerm('');
                setSearchResults([]);
                setShowInitialUsers(false);
            },
             onError: (err) => {
                 console.error("Playlist creation error:", err);
             },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Crear Nueva Playlist</h2>}
        >
            <Head title="Crear Playlist" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre de la Playlist *
                                    </label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        value={data.nombre}
                                        onChange={(e) => setData('nombre', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm ${errors.nombre ? 'border-red-500' : ''}`}
                                        required
                                    />
                                    {errors.nombre && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Descripción *
                                    </label>
                                    <textarea
                                        id="descripcion"
                                        rows="3"
                                        value={data.descripcion}
                                        onChange={(e) => setData('descripcion', e.target.value)}
                                        className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 sm:text-sm ${errors.descripcion ? 'border-red-500' : ''}`}
                                        required
                                    ></textarea>
                                    {errors.descripcion && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Imagen de Portada (Opcional)
                                    </label>
                                    <input
                                        type="file"
                                        id="imagen"
                                        accept="image/*"
                                        onChange={(e) => setData('imagen', e.target.files[0])}
                                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-indigo-50 dark:file:bg-indigo-900
                                            file:text-indigo-700 dark:file:text-indigo-300
                                            hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800
                                            dark:bg-gray-700 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    />
                                    {progress && data.imagen && (
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    )}
                                    {errors.imagen && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.imagen}</p>
                                    )}
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

                                            {/* Updated UL Styling Here */}
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

                                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                                    <Link
                                        href={route('playlists.index')}
                                        className="inline-flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-gray-700 dark:text-gray-200 uppercase tracking-widest hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:border-gray-500 focus:ring focus:ring-gray-300 dark:focus:ring-gray-700 disabled:opacity-25 transition"
                                        as="button"
                                        disabled={processing}
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring focus:ring-blue-300 disabled:opacity-25 transition"
                                        disabled={processing}
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

export default PlaylistCreate;
