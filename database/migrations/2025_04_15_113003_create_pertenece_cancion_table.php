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
        Schema::create('pertenece_cancion', function (Blueprint $table) {
            $table->foreignId('cancion_id')->constrained('canciones')->onDelete('cascade');
            $table->morphs('perteneceable');
            $table->primary(['cancion_id', 'perteneceable_id', 'perteneceable_type']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pertenece_cancion');
    }
};
