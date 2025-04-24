// resources/js/Components/Checkbox.jsx

import React from 'react';

export default function Checkbox({ className = '', id, name, value, checked, onChange, ...props }) {
    // Genera un ID único si no se proporciona uno, útil para la accesibilidad y el label
    const uniqueId = id || `checkbox_${name}_${value || Math.random().toString(36).substring(7)}`;

    return (
        // Usamos un contenedor relativo para facilitar el posicionamiento si fuera necesario
        // y `inline-flex` para que se alinee bien con el texto del label.
        <div className={`relative inline-flex items-center ${className}`}>
            {/* Input original: Oculto visualmente pero accesible */}
            <input
                type="checkbox"
                id={uniqueId}
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                // sr-only lo oculta visualmente pero lo mantiene para lectores de pantalla
                // peer permite que otros elementos reaccionen a su estado (:checked, :focus)
                className="peer sr-only"
                {...props} // Pasa otras props como disabled, required, etc.
            />

            {/* Elemento visual personalizado que simula el checkbox */}
            <span
                aria-hidden="true" // Oculto para lectores de pantalla (ya leen el input)
                className={`
                    w-4 h-4 inline-block shrink-0 // Tamaño y comportamiento base
                    rounded border border-gray-400 dark:border-gray-600 // Borde y redondeo
                    bg-white dark:bg-gray-700 // Fondo por defecto (modo claro/oscuro)
                    shadow-sm // Sombra sutil
                    transition duration-150 ease-in-out // Transición suave
                    flex items-center justify-center // Centrar el tick SVG

                    // --- Estilos basados en el estado del 'peer' (input) ---

                    // Estilo del anillo de foco (rosa, grosor reducido)
                    peer-focus:outline-none
                    peer-focus:ring-2 // Grosor del anillo reducido a 2
                    peer-focus:ring-pink-500/50 // Rosa con algo de transparencia para el foco
                    peer-focus:ring-offset-0 // Ajusta el offset si es necesario

                    // Estilo cuando está MARCADO (checked)
                    peer-checked:border-transparent // Oculta el borde normal
                    peer-checked:bg-gradient-to-r from-pink-500 to-rose-500 // ¡El gradiente! (Rosa a Rojo-Rosa)

                    // Estilo cuando está DESHABILITADO (disabled)
                    peer-disabled:opacity-50
                    peer-disabled:cursor-not-allowed
                    peer-disabled:peer-checked:bg-gradient-to-r peer-disabled:peer-checked:from-gray-400 peer-disabled:peer-checked:to-gray-500 // Gradiente gris si está deshabilitado y marcado
                `}
            >
                {/* SVG del Tick (Checkmark) */}
                <svg
                    // Oculto por defecto, se muestra cuando el input (peer) está checked
                    className={`w-3 h-3 ${checked ? 'block' : 'hidden'} text-white stroke-current`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4" // Grosor del tick
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
        </div>
    );
}
