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

        if (request()->has('search') && request()->input('search') != '') {
            $terminoBusqueda = '%' . request()->input('search') . '%';
            $query->where('name', 'like', $terminoBusqueda)
                  ->orWhere('email', 'like', $terminoBusqueda);
        }

        $users = $query->paginate(10);

        return Inertia::render('roles/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => request()->only('search'),
            'flash' => session('flash'),
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user->roles()->sync($request->input('role_ids', []));

        return redirect()->back();
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
        //
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
    public function update(UpdateRolRequest $request, Rol $rol)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Rol $rol)
    {
        //
    }
}
