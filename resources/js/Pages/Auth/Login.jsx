import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />
            <div className="max-w-xl w-full mx-auto p-8 bg-gray-900 rounded-md shadow-lg text-white mt-8 my-auto">
                <div className="flex justify-center mb-8">
                    <ApplicationLogo className="h-12 w-auto text-gray-200" />
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-500">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Email" className="text-gray-100 font-medium" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 rounded-md shadow-sm"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
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
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 rounded-md shadow-sm"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                        />

                        <InputError message={errors.password} className="mt-2 text-red-500" />
                    </div>

                    <div className="mb-6">
                         <label className="flex items-center text-gray-400 cursor-pointer">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                            />
                            <span className="ms-2 text-sm text-gray-500">
                                Recuérdame
                            </span>
                        </label>
                    </div>

                    <div className="flex items-center justify-end">
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="rounded-md text-sm text-gray-400 underline hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Has olvidado tu contraseña?
                            </Link>
                        )}

                        <PrimaryButton className="ms-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={processing}>
                            Log in
                        </PrimaryButton>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    ¿No tienes una cuenta?
                    <Link href={route('register')} className="text-blue-500 hover:underline ms-1">
                        Regístrate
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
