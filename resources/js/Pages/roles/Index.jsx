import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PencilIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function RolesIndex({ auth, users, roles, flash }) {
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [rolFiltroSeleccionado, setRolFiltroSeleccionado] = useState('');
    const [mostrandoModalEdicionUsuario, setMostrandoModalEdicionUsuario] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
    const [mostrandoModalCreacionRol, setMostrandoModalCreacionRol] = useState(false);
    const [nombreNuevoRol, setNombreNuevoRol] = useState('');
    const [mostrandoModalGestionRoles, setMostrandoModalGestionRoles] = useState(false);
    const [rolEditandoDetalle, setRolEditandoDetalle] = useState(null);
    const [nombreRolEditando, setNombreRolEditando] = useState('');

    useEffect(() => {
        if (flash && flash.success) {
        }
    }, [flash]);

    const manejarBusqueda = (e) => {
        const newSearchTerm = e.target.value;
        setTerminoBusqueda(newSearchTerm);
        router.get(route('roles.index'), {
            search: newSearchTerm,
            role_id: rolFiltroSeleccionado
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const manejarFiltroRol = (e) => {
        const newRoleId = e.target.value;
        setRolFiltroSeleccionado(newRoleId);
        router.get(route('roles.index'), {
            search: terminoBusqueda,
            role_id: newRoleId
        }, {
            preserveState: true,
            replace: true,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const abrirModalEdicionUsuario = (usuario) => {
        setUsuarioEditando(usuario);
        setRolesSeleccionados(usuario.roles ? usuario.roles.map(rol => rol.id) : []);
        setMostrandoModalEdicionUsuario(true);
    };

    const cerrarModalEdicionUsuario = () => {
        setMostrandoModalEdicionUsuario(false);
        setUsuarioEditando(null);
        setRolesSeleccionados([]);
    };

    const manejarCambioRolUsuario = (roleId, isChecked) => {
        if (isChecked) {
            setRolesSeleccionados(prev => [...prev, roleId]);
        } else {
            setRolesSeleccionados(prev => prev.filter(id => id !== roleId));
        }
    };

    const enviarCambioRolUsuario = () => {
        if (usuarioEditando) {
            router.put(route('users.updateRole', usuarioEditando.id), {
                role_ids: rolesSeleccionados,
            }, {
                onSuccess: () => {
                    cerrarModalEdicionUsuario();
                    router.reload({ only: ['users'] });
                }
            });
        }
    };

    const abrirModalCreacionRol = () => {
        setNombreNuevoRol('');
        setMostrandoModalCreacionRol(true);
    };

    const cerrarModalCreacionRol = () => {
        setMostrandoModalCreacionRol(false);
        setNombreNuevoRol('');
    };

    const enviarCreacionRol = () => {
        if (nombreNuevoRol.trim() !== '') {
            router.post(route('roles.store'), {
                nombre: nombreNuevoRol.trim(),
            }, {
                onSuccess: () => {
                    cerrarModalCreacionRol();
                    router.reload({ only: ['roles'] });
                }
            });
        }
    };

    const abrirModalGestionRoles = () => {
        setMostrandoModalGestionRoles(true);
        setRolEditandoDetalle(null);
        setNombreRolEditando('');
    };

    const cerrarModalGestionRoles = () => {
        setMostrandoModalGestionRoles(false);
        setRolEditandoDetalle(null);
        setNombreRolEditando('');
    };

    const manejarEdicionRolClick = (rol) => {
        setRolEditandoDetalle(rol);
        setNombreRolEditando(rol.nombre);
    };

    const enviarEdicionRol = () => {
        if (!rolEditandoDetalle || nombreRolEditando.trim() === '') {
            return;
        }

        if (nombreRolEditando.trim() === rolEditandoDetalle.nombre) {
            setRolEditandoDetalle(null);
            setNombreRolEditando('');
            cerrarModalGestionRoles();
            return;
        }

        router.put(route('roles.update', rolEditandoDetalle.id), {
            nombre: nombreRolEditando.trim(),
        }, {
            onSuccess: () => {
                setRolEditandoDetalle(null);
                setNombreRolEditando('');
                router.reload({ only: ['roles'] });
                cerrarModalGestionRoles();
            },
            onError: (errors) => {
                if (errors.nombre && errors.nombre.includes('has already been taken')) {
                    alert('Error: El nombre de rol ya existe. Por favor, elige un nombre diferente.');
                } else {
                    alert('Error al actualizar el rol. Por favor, inténtalo de nuevo.');
                }
            }
        });
    };

    const manejarEliminacionRol = (rolId) => {
        if (confirm('¿Estás seguro de que quieres eliminar este rol? Esta acción es irreversible.')) {
            router.delete(route('roles.destroy', rolId), {
                onSuccess: () => {
                    router.reload({ only: ['roles'] });
                },
                onError: () => {
                    alert("Error al eliminar el rol. Asegúrate de que no esté asignado a ningún usuario.");
                }
            });
        }
    };

    const sortedRoles = [...roles].sort((a, b) => a.id - b.id);

    return (
        <AuthenticatedLayout>
            <Head title="Administración" />

            <div className="py-12 pt-20">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-gray-800 overflow-hidden shadow-xl sm:rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">Usuarios y Roles</h3>
                            <div className="flex items-center space-x-4">
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
                                <div className="relative">
                                    <select
                                        value={rolFiltroSeleccionado}
                                        onChange={manejarFiltroRol}
                                        className="block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white"
                                    >
                                        <option value="">Todos los Roles</option>
                                        {roles.map((rol) => (
                                            <option key={rol.id} value={rol.id}>
                                                {rol.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={abrirModalCreacionRol}
                                    className="inline-flex items-center px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 text-sm font-medium shadow-md"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    Crear Rol
                                </button>
                                <button
                                    onClick={abrirModalGestionRoles}
                                    className="inline-flex items-center px-4 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200 text-sm font-medium shadow-md"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Gestionar Roles
                                </button>
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
                                                    {usuario.roles && usuario.roles.length > 0
                                                        ? usuario.roles.map(rol => rol.nombre).join(', ')
                                                        : 'Sin Rol'}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-center">
                                                    <button
                                                        onClick={() => abrirModalEdicionUsuario(usuario)}
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

            {mostrandoModalEdicionUsuario && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Editar Roles para {usuarioEditando?.name}</h3>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2">
                                Seleccionar Roles:
                            </label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {roles.map((rol) => (
                                    <div key={rol.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`user_role_${rol.id}`}
                                            checked={rolesSeleccionados.includes(rol.id)}
                                            onChange={(e) => manejarCambioRolUsuario(rol.id, e.target.checked)}
                                            className="form-checkbox h-5 w-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={`user_role_${rol.id}`} className="ml-2 text-gray-300 cursor-pointer">
                                            {rol.nombre}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cerrarModalEdicionUsuario}
                                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarCambioRolUsuario}
                                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrandoModalCreacionRol && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Crear Nuevo Rol</h3>
                        <div className="mb-4">
                            <label htmlFor="nombre_nuevo_rol" className="block text-gray-300 text-sm font-bold mb-2">
                                Nombre del Rol:
                            </label>
                            <input
                                type="text"
                                id="nombre_nuevo_rol"
                                value={nombreNuevoRol}
                                onChange={(e) => setNombreNuevoRol(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 text-white"
                                placeholder="Ej: Administrador, Editor, Usuario Básico"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cerrarModalCreacionRol}
                                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarCreacionRol}
                                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                                disabled={nombreNuevoRol.trim() === ''}
                            >
                                Crear Rol
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrandoModalGestionRoles && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Gestionar Roles</h3>
                            <button onClick={cerrarModalGestionRoles} className="text-gray-400 hover:text-white">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-md mb-4">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr className="bg-gray-700 text-gray-300">
                                        <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-sm font-semibold uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-sm font-semibold uppercase tracking-wider">
                                            Nombre
                                        </th>
                                        <th className="px-5 py-3 border-b-2 border-gray-600 text-center text-sm font-semibold uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedRoles.length > 0 ? (
                                        sortedRoles.map((rol) => (
                                            <tr key={rol.id} className="bg-gray-700 hover:bg-gray-600 border-b border-gray-600 text-gray-300">
                                                <td className="px-5 py-4 text-sm">{rol.id}</td>
                                                <td className="px-5 py-4 text-sm">
                                                    {rolEditandoDetalle?.id === rol.id ? (
                                                        <input
                                                            type="text"
                                                            value={nombreRolEditando}
                                                            onChange={(e) => setNombreRolEditando(e.target.value)}
                                                            className="w-full px-2 py-1 rounded bg-gray-600 border border-gray-500 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    ) : (
                                                        rol.nombre
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-center space-x-2">
                                                    {rolEditandoDetalle?.id === rol.id ? (
                                                        <button
                                                            onClick={enviarEdicionRol}
                                                            className="inline-flex items-center px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 text-xs font-medium"
                                                            disabled={nombreRolEditando.trim() === ''}
                                                        >
                                                            Guardar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => manejarEdicionRolClick(rol)}
                                                            className="inline-flex items-center px-3 py-1 rounded-md text-white bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200 text-xs font-medium"
                                                        >
                                                            <PencilIcon className="w-3 h-3 mr-1" /> Editar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => manejarEliminacionRol(rol.id)}
                                                        className="inline-flex items-center px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 text-xs font-medium"
                                                    >
                                                        <TrashIcon className="w-3 h-3 mr-1" /> Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-5 py-4 text-center text-gray-400">
                                                No hay roles definidos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
