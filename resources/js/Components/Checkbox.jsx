import React from 'react';

export default function Checkbox({ className = '', id, name, value, checked, onChange, ...props }) {
    const uniqueId = id || `checkbox_${name}_${value || Math.random().toString(36).substring(7)}`;

    return (
        <div className={`relative inline-flex items-center ${className}`}>
            <input
                type="checkbox"
                id={uniqueId}
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="peer sr-only"
                {...props}
            />

            <span
                aria-hidden="true"
                className={`
                    w-4 h-4 inline-block shrink-0
                    rounded border border-gray-400 dark:border-gray-600
                    bg-white dark:bg-gray-700
                    shadow-sm
                    transition duration-150 ease-in-out
                    flex items-center justify-center
                    peer-focus:outline-none
                    peer-focus:ring-2
                    peer-focus:ring-pink-500/50
                    peer-focus:ring-offset-0
                    peer-checked:border-transparent
                    peer-checked:bg-gradient-to-r from-pink-500 to-rose-500
                    peer-disabled:opacity-50
                    peer-disabled:cursor-not-allowed
                    peer-disabled:peer-checked:bg-gradient-to-r peer-disabled:peer-checked:from-gray-400 peer-disabled:peer-checked:to-gray-500
                `}
            >
                <svg
                    className={`w-3 h-3 ${checked ? 'block' : 'hidden'} text-white stroke-current`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </span>
        </div>
    );
}
