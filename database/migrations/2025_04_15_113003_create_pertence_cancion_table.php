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
        Schema::create('pertence_cancion', function (Blueprint $table) {
            $table->foreignId('cancion_id')->constrained()->onDelete('cascade');
            $table->morphs('pertenceable');
            $table->primary(['cancion_id', 'pertenceable_id', 'pertenceable_type']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pertence_cancion');
    }
};
