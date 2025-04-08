import React from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// El componente recibe 'cancion', 'auth', 'errors' (de sesión) y 'success' como props
export default function Editar({ auth, cancion, errors: erroresSesion, success: mensajeExitoSesion }) {
  // Mantenemos los nombres devueltos por useForm (data, setData, post, etc.) por convención
  const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
    _method: 'PUT',
    titulo: cancion.titulo || '',
    genero: cancion.genero || '',
    licencia: cancion.licencia || '',
    archivo_nuevo: null, // Campo para el nuevo archivo de audio
    foto_nueva: null,    // Campo para la nueva foto
    eliminar_foto: false,// Checkbox para eliminar la foto actual
  });

  const manejarEnvio = (e) => {
    e.preventDefault();
    post(route('canciones.update', cancion.id), { // Asume Ziggy o usa la URL directa
      forceFormData: true,
      onSuccess: () => {
        // Limpiar estado interno de archivos seleccionados
        setData(datosAnteriores => ({
             ...datosAnteriores,
             archivo_nuevo: null,
             foto_nueva: null,
             eliminar_foto: false,
           }));
         // Limpiar visualmente los inputs file
         const inputArchivoAudio = document.getElementById('archivo_nuevo');
         if(inputArchivoAudio) inputArchivoAudio.value = null;
         const inputArchivoFoto = document.getElementById('foto_nueva');
         if(inputArchivoFoto) inputArchivoFoto.value = null;
      },
      onError: (errores) => {
         console.error("Errores de actualización:", errores);
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
             const inputArchivo = document.getElementById('foto_nueva');
             if(inputArchivo) inputArchivo.value = null;
        }
    };

  return (
    <AuthenticatedLayout
       user={auth.user}
       header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Editar Canción: {cancion.titulo}</h2>}
    >
      <Head title={`Editar ${cancion.titulo}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Mensaje de éxito flash */}
          {recentlySuccessful && mensajeExitoSesion && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
              {mensajeExitoSesion} {/* Muestra el mensaje flash de Laravel */}
            </div>
          )}

          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h2 className="text-xl font-semibold">Editando: {cancion.titulo}</h2>

              {/* Errores generales de sesión (si los hubiera y no son de validación) */}
               {Object.keys(erroresSesion || {}).length > 0 && !errors && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                  Hubo errores al procesar tu solicitud.
                </div>
              )}

              <form onSubmit={manejarEnvio} className="mt-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Título */}
                  <div>
                    <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título *</label>
                    <input
                      type="text"
                      id="titulo"
                      name="titulo"
                      value={data.titulo}
                      onChange={manejarCambioInput}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.titulo ? 'border-red-500' : ''}`}
                    />
                    {errors.titulo && <span className="text-red-600 text-xs">{errors.titulo}</span>}
                  </div>

                  {/* Género */}
                  <div>
                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700">Género</label>
                    <input
                      type="text"
                      id="genero"
                      name="genero"
                      value={data.genero}
                      onChange={manejarCambioInput}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.genero ? 'border-red-500' : ''}`}
                    />
                    {errors.genero && <span className="text-red-600 text-xs">{errors.genero}</span>}
                  </div>

                  {/* Licencia */}
                  <div>
                    <label htmlFor="licencia" className="block text-sm font-medium text-gray-700">Licencia</label>
                    <input
                      type="text"
                      id="licencia"
                      name="licencia"
                      value={data.licencia}
                      onChange={manejarCambioInput}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.licencia ? 'border-red-500' : ''}`}
                    />
                    {errors.licencia && <span className="text-red-600 text-xs">{errors.licencia}</span>}
                  </div>

                  {/* Duración (Mostrar) */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Duración</label>
                      <p className="mt-1 text-sm text-gray-600">{cancion.duracion ? `${cancion.duracion} segundos` : 'No disponible'}</p>
                      <small className="text-xs text-gray-500">(Se actualiza si subes un nuevo archivo de audio)</small>
                  </div>

                  {/* Archivo Nuevo Audio */}
                  <div>
                    <label htmlFor="archivo_nuevo" className="block text-sm font-medium text-gray-700">Archivo de Audio (Opcional: reemplazar actual)</label>
                     {cancion.archivo_url && (
                        <p className="mt-1 text-xs text-gray-500">
                            Actual: <a href={cancion.archivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{cancion.archivo_url.split('/').pop()}</a>
                        </p>
                    )}
                    <input
                      type="file"
                      id="archivo_nuevo"
                      name="archivo_nuevo"
                      onChange={manejarCambioArchivo}
                      className={`mt-1 block w-full text-sm text-gray-500 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.archivo_nuevo ? 'border-red-500' : ''}`}
                      accept=".mp3,.wav"
                    />
                    {data.archivo_nuevo && <span className="text-green-600 text-xs mt-1 block">Nuevo archivo seleccionado: {data.archivo_nuevo.name}</span>}
                    {errors.archivo_nuevo && <span className="text-red-600 text-xs">{errors.archivo_nuevo}</span>}
                  </div>

                  {/* Foto Nueva */}
                  <div>
                    <label htmlFor="foto_nueva" className="block text-sm font-medium text-gray-700">Foto (Opcional: reemplazar actual)</label>
                    {cancion.foto_url && (
                      <div className="mt-1 mb-2">
                        <p className="text-xs text-gray-500 mb-1">Actual:</p>
                        <img src={cancion.foto_url} alt="Foto actual" className="h-20 w-20 object-cover rounded border border-gray-200" />
                      </div>
                    )}
                    <input
                      type="file"
                      id="foto_nueva"
                      name="foto_nueva"
                      onChange={manejarCambioArchivo}
                      className={`mt-1 block w-full text-sm text-gray-500 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.foto_nueva ? 'border-red-500' : ''}`}
                      accept="image/jpeg,image/png,image/jpg"
                      disabled={data.eliminar_foto}
                    />
                     {data.foto_nueva && <span className="text-green-600 text-xs mt-1 block">Nueva foto seleccionada: {data.foto_nueva.name}</span>}
                    {errors.foto_nueva && <span className="text-red-600 text-xs">{errors.foto_nueva}</span>}

                    {/* Checkbox Eliminar Foto */}
                    {cancion.foto_url && (
                        <div className="mt-2 flex items-center">
                            <input
                                type="checkbox"
                                id="eliminar_foto"
                                name="eliminar_foto"
                                checked={data.eliminar_foto}
                                onChange={manejarCambioCheckbox}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="eliminar_foto" className="ml-2 block text-sm text-gray-900">
                                Eliminar foto actual (si no subes una nueva)
                            </label>
                        </div>
                    )}
                     {errors.eliminar_foto && <span className="text-red-600 text-xs">{errors.eliminar_foto}</span>}
                  </div>
                </div>

                {/* Botones */}
                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {processing ? 'Actualizando...' : 'Actualizar Canción'}
                  </button>
                   <Link
                      href={route('canciones.index')} // O a donde quieras redirigir al cancelar
                      className="text-gray-600 hover:text-gray-900"
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
