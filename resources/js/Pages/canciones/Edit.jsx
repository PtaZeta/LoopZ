import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Edit({ cancion }) {
  const { data, setData, put, processing, errors } = useForm({
    titulo: cancion.titulo || '',
    genero: cancion.genero || '',
    licencia: cancion.licencia || '',
    foto: null,
    archivo: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    put(route('canciones.update', cancion.id), {
      onFinish: () => setData('foto', null),
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Editar Canción" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h2 className="text-xl font-semibold">Editar Canción</h2>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input
                      type="text"
                      name="titulo"
                      value={data.titulo}
                      onChange={(e) => setData('titulo', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.titulo && <span className="text-red-600 text-xs">{errors.titulo}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Género</label>
                    <input
                      type="text"
                      name="genero"
                      value={data.genero}
                      onChange={(e) => setData('genero', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.genero && <span className="text-red-600 text-xs">{errors.genero}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Licencia</label>
                    <input
                      type="text"
                      name="licencia"
                      value={data.licencia}
                      onChange={(e) => setData('licencia', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.licencia && <span className="text-red-600 text-xs">{errors.licencia}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Foto</label>
                    <input
                      type="file"
                      name="foto"
                      onChange={(e) => setData('foto', e.target.files[0])}
                      className="mt-1 block w-full text-sm text-gray-500 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {cancion.foto_url && (
                      <p className="text-sm text-gray-500 mt-1">
                        Imagen actual:{' '}
                        <a href={cancion.foto_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Ver imagen</a>
                      </p>
                    )}
                    {errors.foto && <span className="text-red-600 text-xs">{errors.foto}</span>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Archivo de Audio</label>
                    <input
                      type="file"
                      name="archivo"
                      onChange={(e) => setData('archivo', e.target.files[0])}
                      className="mt-1 block w-full text-sm text-gray-500 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {cancion.archivo_url && (
                      <audio controls className="mt-2 w-full">
                        <source src={cancion.archivo_url} type="audio/mpeg" />
                        Tu navegador no soporta la reproducción de audio.
                      </audio>
                    )}
                    {errors.archivo && <span className="text-red-600 text-xs">{errors.archivo}</span>}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={processing}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    {processing ? 'Guardando...' : 'Actualizar Canción'}
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
