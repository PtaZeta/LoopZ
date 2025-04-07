import React from 'react'
import { usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head } from '@inertiajs/react'

export default function Show() {
  const { cancion } = usePage().props

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Detalles de la Canción
        </h2>
      }
    >
      <Head title={`Detalles de ${cancion.titulo}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h1 className="text-3xl font-bold mb-4">{cancion.titulo}</h1>

              {cancion.foto_url && (
                <img
                  src={cancion.foto_url}
                  alt={cancion.titulo}
                  className="w-full h-64 object-cover rounded mb-4"
                />
              )}

              <div className="mb-4">
                <p className="text-lg text-gray-600">
                  <strong>Género:</strong> {cancion.genero || 'No especificado'}
                </p>
                <p className="text-lg text-gray-600">
                  <strong>Duración:</strong> {Math.floor(cancion.duracion / 60)}:{String(cancion.duracion % 60).padStart(2, '0')} min
                </p>
                <p className="text-lg text-gray-600">
                  <strong>Licencia:</strong> {cancion.licencia || 'No definida'}
                </p>
                <p className="text-lg text-gray-600">
                  <strong>Visualizaciones:</strong> {cancion.visualizaciones}
                </p>
                <p className="text-lg text-gray-600">
                  <strong>Subido por:</strong> {cancion.usuario?.name ?? 'Desconocido'}
                </p>
              </div>

              <div className="mb-6">
                <audio controls className="w-full">
                  <source src={cancion.archivo_url} type="audio/mpeg" />
                  Tu navegador no soporta audio.
                </audio>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
