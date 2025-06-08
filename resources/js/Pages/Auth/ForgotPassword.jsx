import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Recuperar contraseña" />
            <div className="max-w-xl w-full mx-auto p-8 bg-gray-900 rounded-md shadow-lg text-white mt-8 my-auto">
                <div className="flex justify-center mb-8">
                    <ApplicationLogo className="h-12 w-auto text-gray-200" />
                </div>

                <div className="mb-6 text-sm text-gray-400 text-center">
                    ¿Has olvidado tu contraseña? No te preocupes. Indícanos tu dirección de correo electrónico y te enviaremos un enlace para restablecerla.
                </div>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-500 text-center">
                        {status}
                    </div>
                )}

                <form onSubmit={submit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="email" value="Correo electrónico" className="text-gray-100 font-medium" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 rounded-md shadow-sm"
                            autoComplete="email"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                        />

                        <InputError message={errors.email} className="mt-2 text-red-500" />
                    </div>

                    <div className="flex items-center justify-end mt-6">
                        <PrimaryButton className="ms-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={processing}>
                            Enviar enlace de recuperación
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
