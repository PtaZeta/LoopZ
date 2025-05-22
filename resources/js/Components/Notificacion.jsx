import React from 'react';

export default function Notificacion({ mostrar, mensaje, tipo = 'success' }) {
    if (!mostrar) return null;

    const tiposClases = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
    };

    return (
        <div
            style={{
                animation: 'fadeSlideIn 0.3s ease-out forwards, fadeSlideOut 0.3s ease-in forwards 4.7s'
            }}
            className={`fixed bottom-6 right-6 ${tiposClases[tipo]} px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50`}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{mensaje}</span>
        </div>
    );
}
