import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function RolesIndex({ auth, users, roles, flash }) {
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [mostrandoModalEdicion, setMostrandoModalEdicion] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    // Cambiado para soportar múltiples roles seleccionados (almacena un array de IDs)
    const [rolesSeleccionados, setRolesSeleccionados] = useState([]);

    useEffect(() => {
        if (flash && flash.success) {
            console.log(flash.success);
        }
    }, [flash]);

    const manejarBusqueda = (e) => {
        setTerminoBusqueda(e.target.value);
        router.get(route('roles.index'), { search: e.target.value }, {
            preserveState: true,
            replace: true,
        });
    };

    const abrirModalEdicion = (usuario) => {
        setUsuarioEditando(usuario);
        // Inicializa los roles seleccionados con los IDs de los roles actuales del usuario
        // Asegúrate de que usuario.roles sea un array (cargado desde el backend)
        setRolesSeleccionados(usuario.roles ? usuario.roles.map(rol => rol.id) : []);
        setMostrandoModalEdicion(true);
    };

    const cerrarModalEdicion = () => {
        setMostrandoModalEdicion(false);
        setUsuarioEditando(null);
        setRolesSeleccionados([]); // Limpiar roles seleccionados al cerrar
    };

    // Maneja la selección/deselección de checkboxes para roles
    const manejarCambioRol = (roleId, isChecked) => {
        if (isChecked) {
            // Añade el ID del rol si está marcado
            setRolesSeleccionados(prev => [...prev, roleId]);
        } else {
            // Quita el ID del rol si está desmarcado
            setRolesSeleccionados(prev => prev.filter(id => id !== roleId));
        }
    };

    const enviarCambioRol = () => {
        if (usuarioEditando) {
            router.put(route('users.updateRole', usuarioEditando.id), {
                // <--- AQUÍ ESTÁ EL CAMBIO CLAVE PARA EL BACKEND --->
                // Enviar un array de IDs de roles al backend bajo la clave 'role_ids'
                role_ids: rolesSeleccionados,
            }, {
                onSuccess: () => {
                    cerrarModalEdicion();
                    // Recarga solo la data de usuarios para reflejar los cambios
                    router.reload({ only: ['users'] });
                },
                onError: (errors) => {
                    // Mantener el console.error para depuración, pero sin validaciones visuales
                    console.error("Error al actualizar el rol:", errors);
                }
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Gestión de Roles" />

            <div className="py-12 pt-20">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">Usuarios y Roles</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar usuarios..."
                                    value={terminoBusqueda}
                                    onChange={manejarBusqueda}
                                    className="pl-10 pr-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-md">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 to-pink-600 text-white">
                                        <th className="px-5 py-3 border-b-2 border-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
                                            Nombre
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-700 text-left text-sm font-semibold uppercase tracking-wider">
                                            Roles Actuales
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-700 text-center text-sm font-semibold uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length > 0 ? (
                                        users.data.map((usuario) => (
                                            <tr key={usuario.id} className="bg-gray-700 hover:bg-gray-600 border-b border-gray-600 text-gray-300">
                                                <td className="px-5 py-4 text-sm">
                                                    {usuario.id}
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    {usuario.name}
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    {usuario.email}
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    {/* Mostrar todos los roles separados por coma, o 'Sin Rol' */}
                                                    {usuario.roles && usuario.roles.length > 0
                                                        ? usuario.roles.map(rol => rol.nombre).join(', ')
                                                        : 'Sin Rol'}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-center">
                                                    <button
                                                        onClick={() => abrirModalEdicion(usuario)}
                                                        className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-md"
                                                    >
                                                        <PencilIcon className="w-4 h-4 mr-2" />
                                                        Editar Roles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-4 text-center text-gray-400">
                                                No se encontraron usuarios.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {users.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginación">
                                    {users.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                                ${link.active
                                                    ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}
                                                ${index === 0 ? 'rounded-l-md' : ''}
                                                ${index === users.links.length - 1 ? 'rounded-r-md' : ''}
                                                ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`
                                            }
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            preserveScroll
                                        />
                                    ))}
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Edición de Roles */}
            {mostrandoModalEdicion && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Roles para {usuarioEditando?.name}</h3>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2">
                                Seleccionar Roles:
                            </label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar"> {/* Añadido scrollbar si hay muchos roles */}
                                {/* Cambiado de select a checkboxes para selección múltiple */}
                                {roles.map((rol) => (
                                    <div key={rol.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`role_${rol.id}`}
                                            checked={rolesSeleccionados.includes(rol.id)}
                                            onChange={(e) => manejarCambioRol(rol.id, e.target.checked)}
                                            className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={`role_${rol.id}`} className="ml-2 text-gray-300 cursor-pointer">
                                            {rol.nombre}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cerrarModalEdicion}
                                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarCambioRol}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                // Eliminada la validación disabled. Un usuario puede no tener ningún rol.
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
