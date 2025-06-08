<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Genero;
use App\Models\Licencia;
use App\Models\Cancion;
use App\Models\Contenedor;
use Faker\Factory as Faker;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $generadorDatosFalsos = Faker::create('es_ES');

        $this->call([
            SpotifyGenresSeeder::class,
            LicenciaSeeder::class,
        ]);

        DB::table('cancion_contenedor')->truncate();
        DB::table('cancion_genero')->truncate();
        DB::table('loopzs_canciones')->truncate();
        DB::table('pertenece_user')->truncate();

        User::truncate();
        Cancion::truncate();
        Contenedor::truncate();

        $generosMusicales = Genero::all();
        $licencias = Licencia::all();

        if ($generosMusicales->isEmpty() || $licencias->isEmpty()) {
            return;
        }

        $usuarios = collect();
        for ($i = 1; $i <= 50; $i++) {
            $colorFondo = sprintf('%06x', mt_rand(0, 0xFFFFFF));
            $colorTexto = sprintf('%06x', mt_rand(0, 0xFFFFFF));

            $usuarios->push(
                User::create([
                    'name' => $generadorDatosFalsos->name(),
                    'email' => "usuario{$i}@example.com",
                    'password' => Hash::make('password'),
                    'foto_perfil' => "https://placehold.co/150x150/{$colorFondo}/{$colorTexto}",
                    'banner_perfil' => "https://placehold.co/800x200/{$colorFondo}/{$colorTexto}",
                    'email_verified_at' => Carbon::now(),
                ])
            );
        }

        $canciones = collect();
        for ($i = 1; $i <= 500; $i++) {
            $colorFondo = sprintf('%06x', mt_rand(0, 0xFFFFFF));
            $colorTexto = "FFF";

            $cancion = Cancion::create([
                'titulo'        => $generadorDatosFalsos->sentence(rand(3, 7), true),
                'duracion'      => rand(120, 300),
                'licencia_id'   => $licencias->random()->id,
                'foto_url'      => "https://placehold.co/300x300/{$colorFondo}/{$colorTexto}",
                'archivo_url'   => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($i % 16) + 1) . ".mp3",
                'publico'       => (bool) rand(0,1),
                'remix'         => false,
            ]);
            $cancion->generos()->attach(
                $generosMusicales->random(rand(1, min(3, $generosMusicales->count())))->pluck('id')->toArray()
            );
            $cancion->usuarios()->attach(
                $usuarios->random(rand(1, min(5, $usuarios->count())))->pluck('id')->toArray(),
                ['propietario' => false]
            );
            if ($cancion->usuarios->count() > 0) {
                $cancion->usuarios()->updateExistingPivot($cancion->usuarios->random()->id, ['propietario' => true]);
            }
            $canciones->push($cancion);
        }

        foreach ($canciones->random(50) as $cancionBase) {
            $colorFondo = sprintf('%06x', mt_rand(0, 0xFFFFFF));
            $colorTexto = "FFF";

            $remix = Cancion::create([
                'titulo'                => $generadorDatosFalsos->sentence(rand(3, 7), true) . ' (Remix)',
                'duracion'              => $cancionBase->duracion + rand(10,60),
                'licencia_id'           => $cancionBase->licencia_id,
                'foto_url'              => "https://placehold.co/300x300/{$colorFondo}/{$colorTexto}",
                'archivo_url'           => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($cancionBase->id % 16) + 1) . ".mp3",
                'publico'               => true,
                'remix'                 => true,
                'cancion_original_id'   => $cancionBase->id,
            ]);
            $remix->generos()->attach($cancionBase->generos->pluck('id')->toArray());
            $remix->usuarios()->attach(
                $usuarios->random(rand(1, min(5, $usuarios->count())))->pluck('id')->toArray(),
                ['propietario' => false]
            );
            if ($remix->usuarios->count() > 0) {
                $remix->usuarios()->updateExistingPivot($remix->usuarios->random()->id, ['propietario' => true]);
            }
            $canciones->push($remix);
        }

        $tiposContenedor = ['playlist','album','ep','single','loopz'];
        foreach ($tiposContenedor as $tipoContenedor) {
            for ($k = 1; $k <= 20; $k++) {
                $colorFondo = sprintf('%06x', mt_rand(0, 0xFFFFFF));
                $colorTexto = "FFF";

                $contenedor = Contenedor::create([
                    'nombre'        => ucfirst($tipoContenedor) . " - " . $generadorDatosFalsos->words(rand(1, 3), true),
                    'descripcion'   => $generadorDatosFalsos->sentence(rand(5, 15), true),
                    'publico'       => true,
                    'tipo'          => $tipoContenedor,
                    'imagen'        => "https://placehold.co/400x400/{$colorFondo}/{$colorTexto}",
                ]);
                $contenedor->canciones()->attach(
                    $canciones->random(rand(10,50))->pluck('id')->toArray()
                );
                // Adjuntar entre 1 y 5 usuarios al contenedor
                $propietariosContenedor = $usuarios->random(rand(1, min(5, $usuarios->count())));
                foreach ($propietariosContenedor as $propietario) {
                    $contenedor->usuarios()->attach($propietario->id, ['propietario' => true]);
                }

                $seguidores = $usuarios->whereNotIn('id', $propietariosContenedor->pluck('id'))
                                       ->random(rand(0, min(5, $usuarios->count() - $propietariosContenedor->count())));
                foreach ($seguidores as $seguidor) {
                    $contenedor->usuarios()->attach($seguidor->id, ['propietario' => false]);
                }
            }
        }

        foreach ($usuarios as $usuario) {
            $usuario->loopzCanciones()->attach(
                $canciones->random(rand(10, 30))->pluck('id')->toArray()
            );
        }
        DB::table('roles')->insert([
            'nombre' => 'Administrador',
        ]);
    }
}
