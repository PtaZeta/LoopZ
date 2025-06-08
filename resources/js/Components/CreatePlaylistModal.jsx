import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import PropTypes from 'prop-types';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

const estiloInputBase = 'rounded-md shadow-sm border-gray-600 bg-gray-800 text-gray-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';
const estiloAutocompletar = '[&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_theme(colors.gray.800)] [&:-webkit-autofill]:![-webkit-text-fill-color:theme(colors.gray.200)] [&:-webkit-autofill:hover]:!bg-transparent [&:-webkit-autofill:focus]:!bg-transparent [&:-webkit-autofill:focus]:!border-transparent [&:-webkit-autofill:focus]:ring-2 [&:-webkit-autofill:focus]:ring-purple-500 [&:-webkit-autofill:focus]:ring-offset-gray-800';
const estiloInputArchivo = 'text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-800 file:text-indigo-200 hover:file:bg-indigo-700 cursor-pointer';

const CreatePlaylistModal = ({ show, onClose, idUsuarioLogueado }) => {
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        nombre: '',
        publico: false,
        descripcion: '',
        imagen: null,
        tipo: 'playlist',
        userIds: idUsuarioLogueado ? [idUsuarioLogueado] : [],
    });

    useEffect(() => {
        if (!show) {
            reset();
            const inputArchivo = document.getElementById('imagen');
            if(inputArchivo) inputArchivo.value = null;
        } else {
            if (idUsuarioLogueado && (data.userIds === null || data.userIds.length === 0)) {
                setData('userIds', [idUsuarioLogueado]);
            }
        }
    }, [show, reset, idUsuarioLogueado, data.userIds, setData]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (show) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [show, onClose]);

    const enviarFormulario = (e) => {
        e.preventDefault();
        post(route('playlists.store'), {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                reset();
                const inputArchivo = document.getElementById('imagen');
                if(inputArchivo) inputArchivo.value = null;
            },
            onError: (erroresFormulario) => {
                console.error("Error al enviar el formulario:", erroresFormulario);
            },
        });
    };

    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                ></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-100" id="modal-title">
                                    Crear Nueva Playlist
                                </h3>
                                <div className="mt-4">
                                    <form onSubmit={enviarFormulario} className="space-y-6">
                                        <div>
                                            <InputLabel htmlFor="nombre" value="Nombre *" className="text-gray-300 mb-1" />
                                            <input
                                                id="nombre"
                                                type="text"
                                                value={data.nombre}
                                                onChange={(e) => setData('nombre', e.target.value)}
                                                className={`mt-1 block w-full sm:text-sm ${estiloInputBase} ${estiloAutocompletar} ${errors.nombre ? 'border-red-500' : ''}`}
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
                                                className={`mt-1 block w-full sm:text-sm ${estiloInputBase} ${errors.publico ? 'border-red-500' : ''}`}
                                                required
                                            >
                                                <option value="false">Privado (Solo tú y colaboradores)</option>
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
                                                className={`mt-1 block w-full sm:text-sm ${estiloInputBase} ${errors.descripcion ? 'border-red-500' : ''}`}
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
                                                className={`mt-1 block w-full text-sm ${estiloInputBase} ${estiloInputArchivo} ${errors.imagen ? 'border-red-500' : ''}`}
                                            />
                                            {progress && data.imagen && (
                                                <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                                                </div>
                                            )}
                                            <InputError message={errors.imagen} className="mt-1 text-xs text-red-400" />
                                        </div>
                                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700 mt-6">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition ease-in-out duration-150"
                                                onClick={onClose}
                                                disabled={processing}
                                            >
                                                Cancelar
                                            </button>
                                            <PrimaryButton disabled={processing}>
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
    idUsuarioLogueado: PropTypes.number,
};

export default CreatePlaylistModal;
