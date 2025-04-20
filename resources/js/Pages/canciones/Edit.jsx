import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';

export default function Editar({ auth, cancion, errors: serverErrors, success: successMessage }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(cancion.usuarios || []);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [showInitialUsers, setShowInitialUsers] = useState(false); // Control initial list display

    const { data, setData, post, processing, errors, reset, recentlySuccessful, transform } = useForm({
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

    const displayErrors = { ...errors, ...(serverErrors || {}) };

    const addUser = (user) => {
        if (!selectedUsers.some(selected => selected.id === user.id)) {
            const newSelectedUsers = [...selectedUsers, user];
            setSelectedUsers(newSelectedUsers);
            setData('userIds', newSelectedUsers.map(u => u.id));
            setSearchTerm('');
            setSearchResults([]);
            setShowInitialUsers(false); // Hide list after adding
        }
    };

    const removeUser = (userId) => {
        if (auth.user?.id === userId) {
             console.warn("No se puede quitar al usuario autenticado desde la interfaz de edición.");
             return;
        }
        const newSelectedUsers = selectedUsers.filter(user => user.id !== userId);
        setSelectedUsers(newSelectedUsers);
        setData('userIds', newSelectedUsers.map(u => u.id));
         // Re-fetch default users if search term is now empty
        if (!searchTerm.trim()) {
             performSearch('');
        }
    };

    const performSearch = useCallback(
        debounce(async (term) => {
            setIsLoadingSearch(true);
            try {
                const response = await axios.get(`/users/search?q=${encodeURIComponent(term)}`);
                // Filter out already selected users AND the current auth user from suggestions
                const availableUsers = response.data.filter(
                    user => !selectedUsers.some(selected => selected.id === user.id) && user.id !== auth.user?.id
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
        [selectedUsers, auth.user?.id] // Depend on selectedUsers and auth user
    );

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        performSearch(term);
    };

     // Effect to potentially re-filter search results if a user is removed while results are shown
     useEffect(() => {
         setSearchResults(prevResults =>
             prevResults.filter(user => !selectedUsers.some(selected => selected.id === user.id))
         );
     }, [selectedUsers]);

     // Fetch initial users when the component mounts if search is empty
     useEffect(() => {
         if (!searchTerm.trim() && !showInitialUsers) {
             performSearch('');
         }
          // Cleanup debounce on unmount
          return () => {
              performSearch.cancel();
          };
     }, []); // Run only once on mount


    const manejarEnvio = (e) => {
        e.preventDefault();
        post(route('canciones.update', cancion.id), {
            onSuccess: () => {
                const inputAudio = document.getElementById('archivo_nuevo');
                if (inputAudio) inputAudio.value = null;
                const inputFoto = document.getElementById('foto_nueva');
                if (inputFoto) inputFoto.value = null;
                setData(prevData => ({
                    ...prevData,
                    archivo_nuevo: null,
                    foto_nueva: null,
                    eliminar_foto: false,
                }));
                setSearchTerm(''); // Clear search on success
                setSearchResults([]);
                setShowInitialUsers(false);
            },
            onError: (err) => {
                console.error("Errores de actualización:", err);
            },
            preserveScroll: true,
            preserveState: true,
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

                     {Object.keys(displayErrors).length > 0 && !recentlySuccessful && (
                         <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded shadow-sm">
                            <p className="font-bold">Por favor corrige los siguientes errores:</p>
                            <ul className="list-disc list-inside mt-2 text-sm">
                                {Object.entries(displayErrors).map(([key, value]) => (
                                    <li key={key}>{value}</li>
                                ))}
                            </ul>
                         </div>
                     )}


                    <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
                            <h2 className="text-xl font-semibold mb-6">Editando: {cancion.titulo}</h2>

                            <form onSubmit={manejarEnvio} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                                        <input
                                            type="text"
                                            id="titulo"
                                            name="titulo"
                                            value={data.titulo}
                                            onChange={manejarCambioInput}
                                            className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.titulo ? 'border-red-500' : ''}`}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                                        <input
                                            type="text"
                                            id="genero"
                                            name="genero"
                                            value={data.genero ?? ''}
                                            onChange={manejarCambioInput}
                                            className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.genero ? 'border-red-500' : ''}`}
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="licencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Licencia</label>
                                         <input
                                             id="licencia"
                                             type="text"
                                             name="licencia"
                                             value={data.licencia ?? ''}
                                             onChange={manejarCambioInput}
                                             className={`mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.licencia ? 'border-red-500' : ''}`}
                                         />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duración</label>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{cancion.duracion ? `${Math.round(cancion.duracion)} segundos` : 'No disponible'}</p>
                                        <small className="text-xs text-gray-500 dark:text-gray-400">(Se actualiza si subes un nuevo archivo de audio)</small>
                                    </div>

                                    <div>
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
                                            type="file"
                                            id="archivo_nuevo"
                                            name="archivo_nuevo"
                                            onChange={manejarCambioArchivo}
                                            className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.archivo_nuevo ? 'border-red-500' : ''}`}
                                            accept=".mp3,.wav"
                                        />
                                        {data.archivo_nuevo && <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">Nuevo: {data.archivo_nuevo.name}</span>}
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
                                            type="file"
                                            id="foto_nueva"
                                            name="foto_nueva"
                                            onChange={manejarCambioArchivo}
                                            className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${errors.foto_nueva ? 'border-red-500' : ''}`}
                                            accept="image/jpeg,image/png,image/jpg"
                                            disabled={data.eliminar_foto}
                                        />
                                        {data.foto_nueva && <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">Nueva: {data.foto_nueva.name}</span>}

                                        {cancion.foto_url && (
                                            <div className="mt-2 flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="eliminar_foto"
                                                    name="eliminar_foto"
                                                    checked={data.eliminar_foto}
                                                    onChange={manejarCambioCheckbox}
                                                    className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                                                />
                                                <label htmlFor="eliminar_foto" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                                    Eliminar foto actual
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                                        Asociar Usuarios (Colaboradores)
                                    </h3>
                                    <div className="sm:col-span-6">
                                        <label htmlFor="user-search-edit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Usuario por Nombre o Email</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <input
                                                id="user-search-edit"
                                                type="search"
                                                name="user-search-edit"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                 onFocus={() => {if(!searchTerm) performSearch('')}} // Fetch initial on focus if empty
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
                                            <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg max-h-60 overflow-auto z-10">
                                                {searchResults.length > 0 ? (
                                                    searchResults.map(user => (
                                                        <li key={user.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center cursor-pointer" onClick={() => addUser(user)}>
                                                            <div>
                                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({user.email})</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); addUser(user); }}
                                                                className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded"
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
                                                        {auth.user?.id !== user.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeUser(user.id)}
                                                                className="ml-4 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded"
                                                                title="Quitar usuario"
                                                            >
                                                                Quitar
                                                            </button>
                                                        )}
                                                         {auth.user?.id === user.id && (
                                                             <span className="ml-4 text-xs text-gray-500 dark:text-gray-400 font-medium">(Tú)</span>
                                                         )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {displayErrors.userIds && typeof displayErrors.userIds === 'string' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{displayErrors.userIds}</p>}
                                    {Object.keys(displayErrors).filter(key => key.startsWith('userIds.')).map(key => (
                                       <p key={key} className="mt-1 text-xs text-red-600 dark:text-red-400">{displayErrors[key]}</p>
                                    ))}

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
