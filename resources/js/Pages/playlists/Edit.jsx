import React from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'; // Asegúrate que la ruta al Layout sea correcta
import InputError from '@/Components/InputError'; // Componente para mostrar errores (opcional pero recomendado)
import PrimaryButton from '@/Components/PrimaryButton'; // Componente botón (opcional)
import TextInput from '@/Components/TextInput'; // Componente input (opcional)
import InputLabel from '@/Components/InputLabel'; // Componente label (opcional)

// El componente recibe 'playlist', 'auth', 'errors' (de sesión) y 'success' (mensaje flash)
export default function Edit({ auth, playlist, errors: erroresSesion, success: mensajeExitoSesion }) {
    // useForm para manejar el estado del formulario
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        _method: 'PUT', // Importante para que Laravel reconozca la petición como UPDATE
        nombre: playlist.nombre || '',
        descripcion: playlist.descripcion || '',
        imagen_nueva: null,    // Campo para la nueva imagen
        eliminar_imagen: false, // Checkbox para eliminar la imagen actual
    });

    // Manejador para el envío del formulario
    const manejarEnvio = (e) => {
        e.preventDefault();
        // Hacemos POST a la ruta de update. Inertia se encarga de enviar _method=PUT
        // Es crucial usar 'post' aquí, no 'put', porque los navegadores no soportan PUT en formularios nativamente.
        // Laravel e Inertia lo manejan internamente gracias a _method y forceFormData.
        post(route('playlists.update', playlist.id), {
            forceFormData: true, // Necesario para enviar archivos
            onSuccess: () => {
                // Limpiar estado de archivos y checkbox tras éxito
                setData(datosAnteriores => ({
                    ...datosAnteriores,
                    imagen_nueva: null,
                    eliminar_imagen: false,
                }));
                // Limpiar visualmente el input file
                const inputArchivoImagen = document.getElementById('imagen_nueva');
                if(inputArchivoImagen) inputArchivoImagen.value = null;
            },
            onError: (errores) => {
                console.error("Errores de actualización de playlist:", errores);
            },
            preserveScroll: true, // Mantiene la posición de scroll tras la redirección
        });
    };

    // Manejador genérico para cambios en inputs de texto/textarea
    const manejarCambioInput = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    // Manejador para el cambio en el input de archivo (imagen)
    const manejarCambioArchivo = (e) => {
        const { name, files } = e.target;
        if (files[0]) {
            setData(name, files[0]); // Guardamos el objeto File en el estado
            // Si se selecciona una nueva imagen, desmarcamos la opción de eliminar
            if (name === 'imagen_nueva') {
                setData('eliminar_imagen', false);
            }
        } else {
            // Si se cancela la selección, ponemos el campo a null
            setData(name, null);
        }
    };

    // Manejador para el cambio en el checkbox de eliminar imagen
    const manejarCambioCheckbox = (e) => {
        const { name, checked } = e.target;
        setData(name, checked);
        // Si se marca eliminar, quitamos cualquier archivo nuevo seleccionado
        if (name === 'eliminar_imagen' && checked) {
            setData('imagen_nueva', null);
            // Limpiar visualmente el input file
            const inputArchivo = document.getElementById('imagen_nueva');
            if(inputArchivo) inputArchivo.value = null;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Editar Playlist: {playlist.nombre}</h2>}
        >
            <Head title={`Editar ${playlist.nombre}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Mensaje de éxito flash (si viene de la redirección) */}
                    {recentlySuccessful && mensajeExitoSesion && (
                        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                            {mensajeExitoSesion}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Editando Playlist
                            </h3>

                            {/* Errores generales de sesión (si los hubiera) */}
                           {Object.keys(erroresSesion || {}).length > 0 && !errors && (
                               <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                                   Hubo errores al procesar tu solicitud. Revisa los campos.
                               </div>
                           )}

                            <form onSubmit={manejarEnvio} className="space-y-6">
                                {/* Nombre */}
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

                                {/* Descripción */}
                                <div>
                                    <InputLabel htmlFor="descripcion" value="Descripción *" />
                                    <textarea
                                        id="descripcion"
                                        name="descripcion"
                                        value={data.descripcion}
                                        onChange={manejarCambioInput}
                                        rows="4"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        required
                                    ></textarea>
                                    <InputError message={errors.descripcion} className="mt-2" />
                                </div>

                                {/* Imagen Nueva */}
                                <div>
                                    <InputLabel htmlFor="imagen_nueva" value="Imagen (Opcional: reemplazar actual)" />
                                     {/* Mostrar imagen actual si existe */}
                                     {playlist.imagen && !data.eliminar_imagen && (
                                        <div className="mt-2 mb-4">
                                            <p className="text-sm text-gray-500 mb-1">Imagen Actual:</p>
                                            <img src={`/storage/${playlist.imagen}`} alt="Imagen actual de la playlist" className="h-24 w-24 object-cover rounded border border-gray-200" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="imagen_nueva"
                                        name="imagen_nueva"
                                        onChange={manejarCambioArchivo}
                                        className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${errors.imagen_nueva ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                                        accept="image/jpeg,image/png,image/jpg"
                                        disabled={data.eliminar_imagen} // Deshabilitar si se marca eliminar
                                    />
                                     {/* Preview del nombre del archivo seleccionado */}
                                     {data.imagen_nueva && <span className="text-green-600 text-xs mt-1 block">Nueva imagen seleccionada: {data.imagen_nueva.name}</span>}
                                    <InputError message={errors.imagen_nueva} className="mt-2" />


                                     {/* Checkbox Eliminar Imagen (Solo si hay imagen actual) */}
                                     {playlist.imagen && (
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

                                {/* Botones */}
                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Actualizando...' : 'Actualizar Playlist'}
                                    </PrimaryButton>

                                    <Link
                                        href={route('playlists.index')} // Ruta para cancelar
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                    >
                                        Cancelar
                                    </Link>

                                    {/* Mensaje de éxito inline (opcional, el flash ya existe) */}
                                    {/* recentlySuccessful && !mensajeExitoSesion && (
                                        <p className="text-sm text-gray-600">Guardado.</p>
                                    ) */}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
