<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRolRequest;
use App\Http\Requests\UpdateRolRequest;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $roles = Rol::all();

        $query = User::with('roles');

        if ($request->has('search') && $request->input('search') != '') {
            $searchTerm = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('email', 'like', $searchTerm);
            });
        }

        if ($request->has('role_id') && $request->input('role_id') != '') {
            $roleId = $request->input('role_id');
            $query->whereHas('roles', function ($q) use ($roleId) {
                $q->where('rol_id', $roleId);
            });
        }

        $users = $query->paginate(10)->withQueryString();

        return Inertia::render('roles/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only('search', 'role_id'),
            'flash' => session('flash'),
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id', // Cada elemento del array (role_ids.*) debe existir en la tabla '
        ]);

        $user->roles()->sync($request->input('role_ids', []));

        return redirect()->back()->with('success', 'Roles del usuario actualizados correctamente.');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRolRequest $request)
    {
        Rol::create($request->validated());
        return redirect()->back();
    }

    /**
     * Display the specified resource.
     */
    public function show(Rol $rol)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Rol $rol)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRolRequest $request, Rol $role)
    {
        $validated = $request->validated();
        if ($role->nombre !== $validated['nombre']) {
            $role->nombre = $validated['nombre'];
            $role->save();
        }
        return redirect()->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Rol $role)
    {
        $role->usuarios()->detach();
        $role->delete();
        return redirect()->back();
    }
}
