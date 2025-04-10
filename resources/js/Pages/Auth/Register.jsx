import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput'; // Lo mantenemos para los campos de texto
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
// No se necesita useEffect si reset funciona bien con onFinish

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        foto_perfil: null,      // <--- Añadir estado para la foto (inicializar a null)
        banner_perfil: null,    // <--- Añadir estado para el banner (inicializar a null)
    });

    const submit = (e) => {
        e.preventDefault();

        // 'post' de useForm automáticamente detectará los archivos en 'data'
        // y enviará la petición como multipart/form-data
        post(route('register'), {
            // onFinish es un buen lugar para resetear campos sensibles como passwords
            // Los campos de archivo se resetean automáticamente en el estado de useForm,
            // pero el input visualmente no se limpia sin JS directo o un key change.
            // Resetearlos aquí asegura que el estado 'data' esté limpio para futuros envíos.
            onFinish: () => reset('password', 'password_confirmation', 'foto_perfil', 'banner_perfil'),
            // Podrías querer preservar el estado (excepto archivos) si hay errores de validación
            // preserveState: (page) => Object.keys(page.props.errors).length > 0,
        });
    };

    // Función para manejar el cambio en inputs de archivo
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        // Nos aseguramos de que hay archivos y tomamos solo el primero
        if (files.length > 0) {
            setData(name, files[0]);
        } else {
            // Si el usuario cancela la selección, reseteamos a null
            setData(name, null);
        }
    };


    return (
        <GuestLayout>
            <Head title="Register" />

            <form onSubmit={submit}>
                {/* Name */}
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Email */}
                <div className="mt-4">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Password */}
                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* Confirm Password */}
                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                {/* --- Input Foto Perfil --- */}
                <div className="mt-4">
                    <InputLabel htmlFor="foto_perfil" value="Profile Photo (Optional)" />
                    {/* Usamos un input estándar para archivos */}
                    <input
                        id="foto_perfil"
                        type="file"
                        name="foto_perfil" // Debe coincidir con el estado y el backend
                        className="mt-1 block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:file:bg-indigo-700 dark:file:text-indigo-100 dark:hover:file:bg-indigo-600"
                        onChange={handleFileChange} // Usamos el manejador común
                        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" // Sugiere tipos de archivo al navegador
                    />
                     {/* Mostramos el nombre del archivo seleccionado */}
                    {data.foto_perfil && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Selected: {data.foto_perfil.name}
                        </p>
                    )}
                    <InputError message={errors.foto_perfil} className="mt-2" />
                </div>
                {/* --- Fin Input Foto Perfil --- */}

                {/* --- Input Banner Perfil --- */}
                 <div className="mt-4">
                    <InputLabel htmlFor="banner_perfil" value="Banner Image (Optional)" />
                    <input
                        id="banner_perfil"
                        type="file"
                        name="banner_perfil" // Debe coincidir con el estado y el backend
                        className="mt-1 block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:file:bg-indigo-700 dark:file:text-indigo-100 dark:hover:file:bg-indigo-600"
                        onChange={handleFileChange} // Usamos el manejador común
                        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" // Sugiere tipos de archivo
                    />
                     {/* Mostramos el nombre del archivo seleccionado */}
                    {data.banner_perfil && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Selected: {data.banner_perfil.name}
                        </p>
                    )}
                    <InputError message={errors.banner_perfil} className="mt-2" />
                </div>
                {/* --- Fin Input Banner Perfil --- */}


                {/* Submit Button & Link */}
                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}