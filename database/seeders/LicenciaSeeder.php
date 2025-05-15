<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LicenciaSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('licencias')->insert([
            [
                'codigo' => 'todos_derechos',
                'nombre' => 'Todos los derechos reservados',
                'descripcion' => 'No se permite copiar, distribuir ni modificar esta canción.',
                'url' => null,
                'requiere_atribucion' => false,
                'es_dominio_publico' => false,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'codigo' => 'cc_by_4',
                'nombre' => 'CC BY 4.0',
                'descripcion' => 'Permite copiar y modificar la obra, siempre que se mencione al autor original.',
                'url' => 'https://creativecommons.org/licenses/by/4.0/',
                'requiere_atribucion' => true,
                'es_dominio_publico' => false,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'codigo' => 'cc0',
                'nombre' => 'CC0 (Dominio público)',
                'descripcion' => 'Se puede usar, modificar y distribuir sin necesidad de atribuir al autor.',
                'url' => 'https://creativecommons.org/publicdomain/zero/1.0/',
                'requiere_atribucion' => false,
                'es_dominio_publico' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}
