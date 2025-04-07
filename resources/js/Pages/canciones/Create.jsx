import React from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    titulo: '',
    genero: '',
    licencia: '',
    foto: null,
    archivo: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/canciones', {
      onFinish: () => setData('foto', null), // Limpiar los campos después de enviar
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="Crear Canción" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h2 className="text-xl font-semibold">Crear Nueva Canción</h2>

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

                  {/* Eliminar la parte de duración */}
                  {/*
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duración (segundos)</label>
                    <input
                      type="number"
                      name="duracion"
                      value={data.duracion}
                      onChange={(e) => setData('duracion', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.duracion && <span className="text-red-600 text-xs">{errors.duracion}</span>}
                  </div>
                  */}

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
                    {errors.archivo && <span className="text-red-600 text-xs">{errors.archivo}</span>}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
