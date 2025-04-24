<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cancion_contenedor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cancion_id')->constrained('canciones')->onDelete('cascade');
            $table->foreignId('contenedor_id')->constrained('contenedores')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cancion_contenedor');
    }
};
