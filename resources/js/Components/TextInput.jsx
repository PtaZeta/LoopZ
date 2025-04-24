// resources/js/Components/TextInput.jsx

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused && localRef.current) {
            localRef.current.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-md shadow-sm ' +
                'border-gray-400 dark:border-gray-600 ' +
                'bg-white dark:bg-gray-800 ' +
                'text-gray-900 dark:text-gray-200 ' +
                '[&:-webkit-autofill]:!bg-transparent ' +
                '[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_theme(colors.white)] ' +
                'dark:[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_theme(colors.gray.800)] ' +
                'dark:[&:-webkit-autofill]:![-webkit-text-fill-color:theme(colors.gray.200)] ' +
                '[&:-webkit-autofill:hover]:!bg-transparent ' +
                '[&:-webkit-autofill:focus]:!bg-transparent ' +
                'dark:[&:-webkit-autofill:hover]:!bg-transparent ' +
                'dark:[&:-webkit-autofill:focus]:!bg-transparent ' +
                '[&:-webkit-autofill:focus]:!border-transparent [&:-webkit-autofill:focus]:ring-2 [&:-webkit-autofill:focus]:ring-purple-500 ' +
                'dark:[&:-webkit-autofill:focus]:ring-offset-gray-800 ' +
                'focus:outline-none ' +
                'focus:border-transparent ' +
                'focus:ring-2 focus:ring-purple-500 ' +
                'dark:focus:ring-offset-gray-800 ' +

                'disabled:opacity-50 disabled:cursor-not-allowed ' +

                className
            }
            ref={localRef}
        />
    );
});
