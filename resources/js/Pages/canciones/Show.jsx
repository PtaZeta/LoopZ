import React from 'react';
import { usePage, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Mostrar() {
  const { cancion } = usePage().props;

  const formatearDuracion = (segundos) => {
    if (isNaN(segundos) || segundos < 0) {
      return 'N/A';
    }
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = String(segundos % 60).padStart(2, '0');
    return `${minutos}:${segundosRestantes} min`;
  };

  const urlFotoCompleta = cancion.foto_url?.startsWith('http')
                            ? cancion.foto_url
                            : cancion.foto_url ? `/storage/${cancion.foto_url}` : null;

  const urlAudioCompleta = cancion.archivo_url?.startsWith('http')
                            ? cancion.archivo_url
                            : cancion.archivo_url ? `/storage/${cancion.archivo_url}` : null;

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Detalles de la Canción
          </h2>
          <Link
            href={route('canciones.edit', cancion.id)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent rounded-md font-semibold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
          >
            Editar Canción
          </Link>
        </div>
      }
    >
      <Head title={`Detalles de ${cancion.titulo}`} />

      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              {urlFotoCompleta && (
                <div className="mb-6">
                   <img
                     src={urlFotoCompleta}
                     alt={`Cover de ${cancion.titulo}`}
                     className="w-full max-w-md mx-auto h-auto object-contain rounded shadow-md"
                   />
                </div>
              )}

               <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
                 {cancion.titulo}
               </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 border-t border-b dark:border-gray-700 py-6">
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Género:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.genero || 'No especificado'}</span>
                 </p>
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Duración:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{formatearDuracion(cancion.duracion)}</span>
                 </p>
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Licencia:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.licencia || 'No definida'}</span>
                 </p>
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Visualizaciones:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.visualizaciones}</span>
                 </p>
                 <p className="md:col-span-2">
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Subido por:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.usuario?.name ?? 'Desconocido'}</span>
                 </p>
              </div>

              <div className="mb-6">
                 <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Reproducir</h3>
                 {urlAudioCompleta ? (
                     <audio controls className="w-full rounded-md shadow">
                       <source src={urlAudioCompleta} type="audio/mpeg" />
                       Tu navegador no soporta el elemento de audio.
                     </audio>
                 ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay archivo de audio disponible.</p>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
