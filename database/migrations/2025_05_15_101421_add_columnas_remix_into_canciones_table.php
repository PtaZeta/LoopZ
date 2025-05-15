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
        Schema::table('canciones', function (Blueprint $table) {
            $table->boolean('remix')->default(false);
            $table->foreignId('cancion_original_id')->nullable()->constrained('canciones');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('canciones', function (Blueprint $table) {
            $table->dropForeign(['cancion_original_id']);
            $table->dropColumn('remix');
            $table->dropColumn('cancion_original_id');
        });
    }
};
