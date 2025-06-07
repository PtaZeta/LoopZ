import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        foto_perfil: null,
        banner_perfil: null,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onSuccess: () => {
                console.log('Registro exitoso. Se ha enviado un código de verificación.');
            },
            onFinish: () => {
                reset('password', 'password_confirmation', 'foto_perfil', 'banner_perfil');
            },
            onError: (formErrors) => {
                console.error('Errores en el registro:', formErrors);
            }
        });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            setData(name, files[0]);
        } else {
            setData(name, null);
        }
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="max-w-xl w-full mx-auto p-8 bg-gray-900 rounded-md shadow-lg text-gray-300 mt-8 my-auto">
                <div className="flex justify-center mb-8">
                    <ApplicationLogo className="h-12 w-auto text-gray-200" />
                </div>

                <form onSubmit={submit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="name" value="Usuario" className="text-gray-100 font-medium" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full bg-gray-800 border-gray-700 text-gray-200"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Email" className="text-gray-100 font-medium" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full bg-gray-800 border-gray-700 text-gray-200"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="password" value="Contraseña" className="text-gray-100 font-medium" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full bg-gray-800 border-gray-700 text-gray-200"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirmar contraseña"
                            className="text-gray-100 font-medium"
                        />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full bg-gray-800 border-gray-700 text-gray-200"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="foto_perfil" value="Foto de perfil (Opcional)" className="text-gray-100 font-medium" />
                        <input
                            id="foto_perfil"
                            type="file"
                            name="foto_perfil"
                            className={
                                'mt-1 block w-full text-sm rounded-md cursor-pointer ' +
                                'text-gray-300 border border-gray-700 bg-gray-800 ' +
                                'focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 ' +
                                'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 ' +
                                'file:text-sm file:font-semibold file:text-white ' +
                                'file:bg-gradient-to-r file:from-blue-500 file:to-pink-500 ' +
                                'hover:file:from-blue-600 hover:file:to-pink-600'
                            }
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        />
                        {data.foto_perfil && (
                            <p className="mt-1 text-sm text-gray-500">
                                Seleccionado: {data.foto_perfil.name}
                            </p>
                        )}
                        <InputError message={errors.foto_perfil} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="banner_perfil" value="Banner (Opcional)" className="text-gray-100 font-medium" />
                        <input
                            id="banner_perfil"
                            type="file"
                            name="banner_perfil"
                            className={
                                'mt-1 block w-full text-sm rounded-md cursor-pointer ' +
                                'text-gray-300 border border-gray-700 bg-gray-800 ' +
                                'focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 ' +
                                'file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 ' +
                                'file:text-sm file:font-semibold file:text-white ' +
                                'file:bg-gradient-to-r file:from-blue-500 file:to-pink-500 ' +
                                'hover:file:from-blue-600 hover:file:to-pink-600'
                            }
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        />
                        {data.banner_perfil && (
                            <p className="mt-1 text-sm text-gray-500">
                                Seleccionado: {data.banner_perfil.name}
                            </p>
                        )}
                        <InputError message={errors.banner_perfil} className="mt-2 text-red-500" />
                    </div>

                    <div className="flex items-center justify-end mt-4">
                        <Link
                            href={route('login')}
                            className="underline text-sm text-gray-400 hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800"
                        >
                            ¿Ya estás registrado?
                        </Link>
                        <PrimaryButton className="ms-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={processing}>
                            Registrar
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
