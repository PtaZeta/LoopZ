import React from 'react';
import { usePage, Link, Head } from '@inertiajs/react'; // Importa Link
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show() {
  const { cancion } = usePage().props;

  // Helper para formatear duración (opcional pero útil)
  const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds < 0) {
      return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${remainingSeconds} min`;
  };

  // Construye la URL completa para la imagen y el audio si son rutas relativas
  // Asume que las URLs ya son completas o que el servidor las sirve correctamente desde /storage/
  // Si guardaste rutas relativas (ej: 'fotos_canciones/imagen.jpg'), necesitas anteponer '/storage/'
  const fotoUrlCompleta = cancion.foto_url?.startsWith('http')
                            ? cancion.foto_url
                            : cancion.foto_url ? `/storage/${cancion.foto_url}` : null;

  const audioUrlCompleta = cancion.archivo_url?.startsWith('http')
                            ? cancion.archivo_url
                            : cancion.archivo_url ? `/storage/${cancion.archivo_url}` : null;


  return (
    <AuthenticatedLayout
      header={
        // Contenedor Flex para alinear título y botón
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Detalles de la Canción
          </h2>
          {/* Botón para editar la canción */}
          {/* Asegúrate que la ruta 'canciones.edit' exista y acepte el ID */}
           {/* Idealmente, este botón solo debería mostrarse si el usuario tiene permiso para editar */}
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
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8"> {/* Ajustado max-width */}
          <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100"> {/* Más padding */}

              {/* Imagen de la canción (si existe) */}
              {fotoUrlCompleta && (
                <div className="mb-6"> {/* Espacio alrededor de la imagen */}
                   <img
                     src={fotoUrlCompleta}
                     alt={`Cover de ${cancion.titulo}`}
                     className="w-full max-w-md mx-auto h-auto object-contain rounded shadow-md" // Ajustes de imagen
                   />
                </div>
              )}

               {/* Título Principal */}
               <h1 className="text-3xl md:text-4xl font-bold text-center mb-6"> {/* Centrado y más espacio */}
                 {cancion.titulo}
               </h1>

               {/* Sección de detalles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 border-t border-b dark:border-gray-700 py-6"> {/* Grid para detalles */}
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Género:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.genero || 'No especificado'}</span>
                 </p>
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Duración:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{formatDuration(cancion.duracion)}</span>
                 </p>
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Licencia:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.licencia || 'No definida'}</span>
                 </p>
                 <p>
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Visualizaciones:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.visualizaciones}</span>
                 </p>
                 <p className="md:col-span-2"> {/* Ocupa ambas columnas en escritorio */}
                   <strong className="font-semibold text-gray-700 dark:text-gray-300">Subido por:</strong>{' '}
                   <span className="text-gray-600 dark:text-gray-400">{cancion.usuario?.name ?? 'Desconocido'}</span>
                   {/* Podrías hacer que el nombre sea un enlace al perfil del usuario si tienes esa ruta */}
                 </p>
              </div>

               {/* Reproductor de Audio */}
              <div className="mb-6">
                 <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Reproducir</h3>
                 {audioUrlCompleta ? (
                     <audio controls className="w-full rounded-md shadow">
                       <source src={audioUrlCompleta} type="audio/mpeg" /> {/* Asume MP3, ajusta si es otro tipo */}
                       Tu navegador no soporta el elemento de audio.
                     </audio>
                 ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay archivo de audio disponible.</p>
                 )}
              </div>

               {/* Aquí podrías añadir más secciones como comentarios, letras, etc. */}

            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
