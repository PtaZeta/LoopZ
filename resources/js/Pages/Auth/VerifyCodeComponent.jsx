import React, { useState } from 'react';
import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import ApplicationLogo from '@/Components/ApplicationLogo';


export default function VerifyCodeComponent() {
    const [codigo, setCodigo] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');
        setProcessing(true);

        try {
            const response = await axios.post('/verificar-codigo', { codigo: codigo });

            setMensaje(response.data.message);
            console.log('Verificación exitosa:', response.data);

            router.visit(response.data.redirect || '/');

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Ocurrió un error inesperado al verificar el código.');
            }
            console.error('Error de verificación:', err.response ? err.response.data : err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Verificar Código" />

            <div className="max-w-xl w-full mx-auto p-8 bg-gray-900 rounded-md shadow-lg text-gray-300 mt-8 my-auto">
                <div className="flex justify-center mb-8">
                    <ApplicationLogo className="w-24 h-16 text-blue-400" />
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-400 mb-6">Verifica tu Cuenta</h1>
                <p className="text-center text-gray-300 mb-6">Hemos enviado un código de verificación a tu correo electrónico. Por favor, introdúcelo aquí para activar tu cuenta.</p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <InputLabel htmlFor="codigo" value="Código de 6 dígitos" className="text-gray-100 font-medium" />
                        <TextInput
                            id="codigo"
                            type="text"
                            name="codigo"
                            value={codigo}
                            className="mt-1 block w-full bg-gray-800 border-gray-700 text-gray-200 text-center"
                            autoComplete="off"
                            isFocused={true}
                            maxLength="6"
                            onChange={(e) => setCodigo(e.target.value)}
                            required
                        />
                        {error && <InputError message={error} className="mt-2 text-red-500" />}
                        {mensaje && <p className="mt-2 text-blue-400 text-sm">{mensaje}</p>}
                    </div>

                    <div className="flex items-center justify-center mt-6">
                        <PrimaryButton className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-center" disabled={processing}>
                            {processing ? 'Verificando...' : 'Verificar Cuenta'}
                        </PrimaryButton>
                    </div>
                </form>

                <p className="text-sm text-gray-400 text-center mt-6">
                    Este código es válido por 10 minutos. Si no lo usas a tiempo, tendrás que iniciar el proceso de registro de nuevo para obtener uno nuevo.
                </p>
            </div>
        </GuestLayout>
    );
}
