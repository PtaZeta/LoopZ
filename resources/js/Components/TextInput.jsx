import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type: tipo = 'text', className = '', estaEnfocado = false, ...props },
    ref,
) {
    const refLocal = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => refLocal.current?.focus(),
    }));

    useEffect(() => {
        if (estaEnfocado && refLocal.current) {
            refLocal.current.focus();
        }
    }, [estaEnfocado]);

    const classNameFinal = `rounded-md shadow-sm border-gray-600 bg-gray-800 text-gray-200 [&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_theme(colors.gray.800)] [&:-webkit-autofill]:![-webkit-text-fill-color:theme(colors.gray.200)] [&:-webkit-autofill:hover]:!bg-transparent [&:-webkit-autofill:focus]:!bg-transparent [&:-webkit-autofill:focus]:!border-transparent [&:-webkit-autofill:focus]:ring-2 [&:-webkit-autofill:focus]:ring-purple-500 [&:-webkit-autofill:focus]:ring-offset-gray-800 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

    return (
        <input
            {...props}
            type={tipo}
            className={classNameFinal}
            ref={refLocal}
        />
    );
});
