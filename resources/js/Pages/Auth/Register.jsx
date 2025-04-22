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
            onFinish: () => reset('password', 'password_confirmation', 'foto_perfil', 'banner_perfil'),
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

            <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-md shadow-lg text-gray-300">
                <div className="flex justify-center mb-8">
                    <Link href="/" className="text-2xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                        LoopZ
                    </Link>
                </div>

                <form onSubmit={submit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="name" value="Name" className="text-gray-400" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Email" className="text-gray-400" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="password" value="Password" className="text-gray-400" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password"
                            className="text-gray-400"
                        />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="foto_perfil" value="Profile Photo (Optional)" className="text-gray-400" />
                        <input
                            id="foto_perfil"
                            type="file"
                            name="foto_perfil"
                            className="mt-1 block w-full text-sm text-gray-300 border border-gray-700 rounded-md cursor-pointer bg-gray-800 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        />
                        {data.foto_perfil && (
                            <p className="mt-1 text-sm text-gray-500">
                                Selected: {data.foto_perfil.name}
                            </p>
                        )}
                        <InputError message={errors.foto_perfil} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-4">
                        <InputLabel htmlFor="banner_perfil" value="Banner Image (Optional)" className="text-gray-400" />
                        <input
                            id="banner_perfil"
                            type="file"
                            name="banner_perfil"
                            className="mt-1 block w-full text-sm text-gray-300 border border-gray-700 rounded-md cursor-pointer bg-gray-800 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                        />
                        {data.banner_perfil && (
                            <p className="mt-1 text-sm text-gray-500">
                                Selected: {data.banner_perfil.name}
                            </p>
                        )}
                        <InputError message={errors.banner_perfil} className="mt-2 text-red-500" />
                    </div>

                    <div className="flex items-center justify-end mt-4">
                        <PrimaryButton className="ms-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={processing}>
                            Register
                        </PrimaryButton>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    ¿Ya tienes una cuenta?
                    <Link href={route('login')} className="text-blue-500 hover:underline ms-1">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
