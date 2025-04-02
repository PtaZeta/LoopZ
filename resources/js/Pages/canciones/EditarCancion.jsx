import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function EditarCancion({ cancion }) {
    const { data, setData, put, processing, errors } = useForm({
        titulo: cancion.titulo || '',
        genero: cancion.genero || '',
        archivo: null,
        foto: null,
        licencia: cancion.licencia || ''
    });

    const submit = (e) => {
        e.preventDefault();

        // Crear un objeto FormData para enviar los datos y archivos
        const formData = new FormData();
        formData.append('titulo', data.titulo);
        formData.append('genero', data.genero);

        // Solo añadimos los archivos si se han seleccionado nuevos archivos
        if (data.archivo) {
            formData.append('archivo', data.archivo);
        }

        if (data.foto) {
            formData.append('foto', data.foto);
        }

        formData.append('licencia', data.licencia);

        // Enviar los datos usando Inertia con el método PUT para actualizar
        put(route('canciones.update', cancion.id), {
            data: formData,
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Canción</h2>}>
            <Head title="Editar Canción" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow sm:rounded-lg">
                        <form onSubmit={submit} encType="multipart/form-data">
                            {/* Título */}
                            <div className="mb-4">
                                <label className="block text-gray-700">Título</label>
                                <input
                                    type="text"
                                    value={data.titulo}
                                    onChange={e => setData('titulo', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                                {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo}</p>}
                            </div>

                            {/* Género */}
                            <div className="mb-4">
                                <label className="block text-gray-700">Género</label>
                                <input
                                    type="text"
                                    value={data.genero}
                                    onChange={e => setData('genero', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                                {errors.genero && <p className="text-red-500 text-sm">{errors.genero}</p>}
                            </div>

                            {/* Archivo de Audio */}
                            <div className="mb-4">
                                <label className="block text-gray-700">Archivo de Audio</label>
                                <input
                                    type="file"
                                    accept=".mp3,.wav"
                                    onChange={e => setData('archivo', e.target.files[0])}
                                    className="w-full p-2 border rounded"
                                />
                                {errors.archivo && <p className="text-red-500 text-sm">{errors.archivo}</p>}
                            </div>

                            {/* Foto */}
                            <div className="mb-4">
                                <label className="block text-gray-700">Foto</label>
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={e => setData('foto', e.target.files[0])}
                                    className="w-full p-2 border rounded"
                                />
                                {errors.foto && <p className="text-red-500 text-sm">{errors.foto}</p>}
                            </div>

                            {/* Licencia */}
                            <div className="mb-4">
                                <label className="block text-gray-700">Licencia</label>
                                <input
                                    type="text"
                                    value={data.licencia}
                                    onChange={e => setData('licencia', e.target.value)}
                                    className="w-full p-2 border rounded"
                                />
                                {errors.licencia && <p className="text-red-500 text-sm">{errors.licencia}</p>}
                            </div>

                            {/* Botón de Guardar */}
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                disabled={processing}
                            >
                                {processing ? 'Guardando...' : 'Actualizar Canción'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
