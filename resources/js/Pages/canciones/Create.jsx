import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import { debounce } from 'lodash';

export default function Create({ auth }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    titulo: '',
    genero: '',
    licencia: '',
    foto: null,
    archivo: null,
    userIds: [],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  const addUser = (user) => {
    if (!selectedUsers.some(selected => selected.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      setData('userIds', newSelectedUsers.map(u => u.id));
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const removeUser = (userId) => {
    const newSelectedUsers = selectedUsers.filter(user => user.id !== userId);
    setSelectedUsers(newSelectedUsers);
    setData('userIds', newSelectedUsers.map(u => u.id));
  };

  const performSearch = useCallback(
    debounce(async (term) => {
      setIsLoadingSearch(true);
      try {
        const response = await axios.get(`/users/search?q=${encodeURIComponent(term)}`);
        setSearchResults(response.data.filter(
          user => !selectedUsers.some(selected => selected.id === user.id)
        ));
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 300),
    [selectedUsers]
  );

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    performSearch(term);
  };

  useEffect(() => {
    if (auth.user) {
        const creatorUser = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
        if (!selectedUsers.some(u => u.id === creatorUser.id)) {
            const newSelectedUsers = [creatorUser, ...selectedUsers.filter(u => u.id !== creatorUser.id)];
            setSelectedUsers(newSelectedUsers);
            setData('userIds', newSelectedUsers.map(u => u.id));
        }
    }
  }, [auth.user]);

  useEffect(() => {
    performSearch(searchTerm);
    return () => {
      performSearch.cancel();
    };
  }, [performSearch, searchTerm]); // Include searchTerm here to trigger search on initial load and changes

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/canciones', {
      preserveState: true,
      onSuccess: () => {
        reset();
        if (auth.user) {
            const creatorUser = { id: auth.user.id, name: auth.user.name, email: auth.user.email };
            setSelectedUsers([creatorUser]);
            setData('userIds', [creatorUser.id]);
        } else {
            setSelectedUsers([]);
        }
        setSearchTerm('');
        performSearch('');
      },
      onError: (err) => {
        console.error("Form submission error:", err);
      },
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Crear Canción</h2>}
    >
      <Head title="Crear Canción" />

      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <h2 className="text-xl font-semibold mb-6">Crear Nueva Canción</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
                    <input
                      id="titulo"
                      type="text"
                      name="titulo"
                      value={data.titulo}
                      onChange={(e) => setData('titulo', e.target.value)}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required
                    />
                    {errors.titulo && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.titulo}</span>}
                  </div>

                  <div>
                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género</label>
                    <input
                       id="genero"
                      type="text"
                      name="genero"
                      value={data.genero}
                      onChange={(e) => setData('genero', e.target.value)}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                     {errors.genero && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.genero}</span>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="licencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Licencia</label>
                    <input
                      id="licencia"
                      type="text"
                      name="licencia"
                      value={data.licencia}
                      onChange={(e) => setData('licencia', e.target.value)}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                     {errors.licencia && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.licencia}</span>}
                  </div>

                  <div>
                    <label htmlFor="foto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto (JPG, PNG)</label>
                    <input
                      id="foto"
                      type="file"
                      name="foto"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => setData('foto', e.target.files[0])}
                       className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    />
                    {data.foto && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{data.foto.name}</span>}
                    {errors.foto && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.foto}</span>}
                  </div>

                  <div>
                    <label htmlFor="archivo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Archivo de Audio (MP3, WAV) *</label>
                    <input
                       id="archivo"
                      type="file"
                      name="archivo"
                      accept=".mp3,.wav"
                      onChange={(e) => setData('archivo', e.target.files[0])}
                      className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      required
                    />
                     {data.archivo && <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{data.archivo.name}</span>}
                     {errors.archivo && <span className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.archivo}</span>}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                    Asociar Usuarios (Colaboradores)
                  </h3>
                  <div className="sm:col-span-6">
                    <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buscar Usuario por Nombre o Email</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        id="user-search"
                        type="search"
                        name="user-search"
                        value={searchTerm}
                        onChange={handleSearchChange}
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

                    {(searchResults.length > 0 || (searchTerm && !isLoadingSearch)) && (
                        <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg max-h-60 overflow-auto z-10">
                            {searchResults.map(user => (
                                <li key={user.id} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center">
                                    <div>
                                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({user.email})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addUser(user)}
                                        className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded"
                                    >
                                        Añadir
                                    </button>
                                </li>
                            ))}
                            {searchTerm && !isLoadingSearch && searchResults.length === 0 && (
                                <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No se encontraron usuarios.</li>
                            )}
                            {!searchTerm && !isLoadingSearch && searchResults.length === 0 && selectedUsers.length > 0 && ( // Show msg only if not searching and results empty (maybe after adding all)
                               <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No hay más usuarios disponibles para añadir.</li>
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
                          </li>
                        ))}
                      </ul>
                       {errors.userIds && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.userIds}</p>}
                       {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => (
                         <p key={key} className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[key]}</p>
                       ))}
                    </div>
                  )}
                   {errors.userIds && typeof errors.userIds === 'string' && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.userIds}</p>}

                </div>

                <div className="flex justify-end pt-5 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"

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
