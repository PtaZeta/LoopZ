import React, { useState, useEffect } from 'react'; // Added useState for progress if you choose to handle it manually
import { useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

// Define styling variables used in your CrearPlaylist component
const coreInputStyle = 'rounded-md shadow-sm border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
const autofillStyle = '[&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_theme(colors.gray.800)] [&:-webkit-autofill]:![-webkit-text-fill-color:theme(colors.gray.200)] [&:-webkit-autofill:hover]:!bg-transparent [&:-webkit-autofill:focus]:!bg-transparent [&:-webkit-autofill:focus]:!border-transparent [&:-webkit-autofill:focus]:ring-2 [&:-webkit-autofill:focus]:ring-purple-500 [&:-webkit-autofill:focus]:ring-offset-gray-800';
const fileInputStyle = 'text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-800 file:text-indigo-200 hover:file:bg-indigo-700 cursor-pointer';


const CreatePlaylistModal = ({ show, onClose, usuarioLogueadoId }) => {
    // useForm hook for handling form data, submission, and errors
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        nombre: '',
        publico: false, // Default to private as in your CrearPlaylist component's initial state
        descripcion: '',
        imagen: null,
        tipo: 'playlist', // Explicitly set the type
        // Initialize userIds with the logged-in user's ID
        userIds: usuarioLogueadoId ? [usuarioLogueadoId] : [],
    });

     // Reset form when modal is closed
    useEffect(() => {
        if (!show) {
            reset();
            // Manually reset file input value if needed
            const fileInput = document.getElementById('imagen');
            if(fileInput) fileInput.value = null;
        } else {
             // Ensure userIds is set if modal opens and user is logged in
             if (usuarioLogueadoId && data.userIds.length === 0) {
                 setData('userIds', [usuarioLogueadoId]);
             }
        }
    }, [show, reset, usuarioLogueadoId]); // Add usuarioLogueadoId to dependencies

    // Effect to close modal on ESC key
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (show) {
            document.addEventListener('keydown', handleEsc); // Use document for global listener
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [show, onClose]);


    const submit = (e) => {
        e.preventDefault();
        // The `post` method from useForm automatically handles file uploads correctly
        // with the 'imagen' key mapping to the backend request's file input.
        // We are also including the userIds array initialized with the owner.
        post(route('playlists.store'), { // Submit to playlists.store route
            forceFormData: true, // Often necessary for file uploads with nested data
            onSuccess: () => {
                onClose(); // Close modal on success
                reset(); // Reset form fields
                // Manually reset file input value
                 const fileInput = document.getElementById('imagen');
                 if(fileInput) fileInput.value = null;
                // Inertia flash messages can handle success notification
            },
            onError: (errs) => {
                 console.error("Submission failed:", errs);
                 // useForm automatically sets the errors state, which will be displayed
            },
        });
    };

    if (!show) {
        return null; // Don't render anything if not shown
    }

    return (
        // Modal Overlay
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                {/* Background backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose} // Close modal on clicking backdrop
                ></div>

                {/* Modal Content */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span> {/* Trick to center modal */}

                <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-100" id="modal-title">
                                    Crear Nueva Playlist
                                </h3>
                                <div className="mt-4">
                                    <form onSubmit={submit} className="space-y-6">

                                        {/* Nombre */}
                                        <div>
                                            <InputLabel htmlFor="nombre" value="Nombre *" className="text-gray-300 mb-1" />
                                            <input // Using standard input with styled classes
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

                                        {/* Visibilidad */}
                                        <div>
                                             <InputLabel htmlFor="publico" value="Visibilidad *" className="text-gray-300 mb-1" />
                                             <select
                                                 id="publico"
                                                 name="publico"
                                                 value={String(data.publico)} // Select works best with string values
                                                 onChange={(e) => setData('publico', e.target.value === 'true')} // Convert string back to boolean
                                                 className={`mt-1 block w-full sm:text-sm ${coreInputStyle} ${errors.publico ? 'border-red-500' : ''}`}
                                                 required
                                             >
                                                 <option value="false">Privado (Solo tú y colaboradores)</option> {/* Updated text */}
                                                 <option value="true">Público (Visible para todos)</option>
                                             </select>
                                            <InputError message={errors.publico} className="mt-1 text-xs text-red-400" />
                                        </div>


                                        {/* Descripción */}
                                        <div>
                                            <InputLabel htmlFor="descripcion" value="Descripción" className="text-gray-300 mb-1" />
                                            <textarea // Using standard textarea
                                                id="descripcion"
                                                rows="4"
                                                value={data.descripcion}
                                                onChange={(e) => setData('descripcion', e.target.value)}
                                                className={`mt-1 block w-full sm:text-sm ${coreInputStyle} ${errors.descripcion ? 'border-red-500' : ''}`}
                                            ></textarea>
                                            <InputError message={errors.descripcion} className="mt-1 text-xs text-red-400" />
                                        </div>

                                        {/* Imagen */}
                                        <div>
                                            <InputLabel htmlFor="imagen" value="Imagen (Opcional)" className="text-gray-300 mb-1" />
                                            <input // Using standard input type file
                                                type="file"
                                                id="imagen"
                                                accept="image/*"
                                                onChange={(e) => setData('imagen', e.target.files[0])}
                                                className={`mt-1 block w-full text-sm ${coreInputStyle} ${fileInputStyle} ${errors.imagen ? 'border-red-500' : ''}`}
                                            />
                                            {progress && data.imagen && ( // Show progress only if a file is selected
                                                <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                                </div>
                                            )}
                                            <InputError message={errors.imagen} className="mt-1 text-xs text-red-400" />
                                        </div>

                                         {/* Note about collaborators - simplifies the modal */}
                                         <div className="text-sm text-gray-400 pt-2 border-t border-slate-700">
                                            Nota: Inicialmente solo tú serás el creador. Puedes añadir colaboradores después de crear la playlist.
                                         </div>

                                        {/* userIds errors (less likely in this modal, but possible) */}
                                        <InputError message={errors.userIds && typeof errors.userIds === 'string' ? errors.userIds : ''} className="mt-1 text-xs text-red-400" />
                                        {/* Specific userIds.* errors */}
                                        {Object.keys(errors).filter(key => key.startsWith('userIds.')).map(key => (
                                             <InputError key={key} message={errors[key]} className="mt-1 text-xs text-red-400" />
                                         ))}


                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700 mt-6">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition ease-in-out duration-150"
                                                onClick={onClose}
                                                disabled={processing} // Disable cancel button while processing
                                            >
                                                Cancelar
                                            </button>
                                             {/* Using PrimaryButton component */}
                                            <PrimaryButton disabled={processing || !usuarioLogueadoId}> {/* Disable if processing or user not logged in */}
                                                {processing ? 'Creando...' : 'Crear Playlist'}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

CreatePlaylistModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    usuarioLogueadoId: PropTypes.number, // Allow null/undefined if user is not logged in (though this modal should only show for logged in users)
};

export default CreatePlaylistModal;
