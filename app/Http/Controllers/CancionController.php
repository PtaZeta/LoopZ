<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCancionRequest;
use App\Http\Requests\UpdateCancionRequest;
use App\Models\Cancion;

class CancionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
    public function store(StoreCancionRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Cancion $cancion)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Cancion $cancion)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCancionRequest $request, Cancion $cancion)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cancion $cancion)
    {
        //
    }
}
