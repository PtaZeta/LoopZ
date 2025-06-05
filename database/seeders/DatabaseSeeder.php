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
use Carbon\Carbon; // Asegúrate de tener Carbon importado para email_verified_at

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('es_ES');

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

        $generos = Genero::all();
        $licencias = Licencia::all();

        if ($generos->isEmpty() || $licencias->isEmpty()) {
            return;
        }

        $usuarios = collect();
        for ($i = 1; $i <= 50; $i++) {
            $bgColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);
            $textColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);

            $usuarios->push(
                User::create([
                    'name' => $faker->name(),
                    'email' => "usuario{$i}@example.com",
                    'password' => Hash::make('password'),
                    // Eliminamos "?text=" para foto_perfil
                    'foto_perfil' => "https://placehold.co/150x150/{$bgColor}/{$textColor}",
                    // Eliminamos "?text=" para banner_perfil
                    'banner_perfil' => "https://placehold.co/800x200/{$bgColor}/{$textColor}",
                    'email_verified_at' => Carbon::now(),
                ])
            );
        }

        $canciones = collect();
        for ($i = 1; $i <= 500; $i++) {
            $bgColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT); // Genera un nuevo color para cada canción
            $textColor = "FFF"; // Color de texto blanco (si lo hubiera, pero lo eliminamos)

            $cancion = Cancion::create([
                'titulo'        => $faker->sentence(rand(3, 7), true),
                'duracion'      => rand(120, 300),
                'licencia_id'   => $licencias->random()->id,
                // Eliminamos "?text=" para foto_url de canción
                'foto_url'      => "https://placehold.co/300x300/{$bgColor}/{$textColor}",
                'archivo_url'   => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($i % 16) + 1) . ".mp3",
                'publico'       => (bool) rand(0,1),
                'remix'         => false,
            ]);
            $cancion->generos()->attach(
                $generos->random(rand(1, min(3, $generos->count())))->pluck('id')->toArray()
            );
            $cancion->usuarios()->attach($usuarios->random()->id, ['propietario' => true]);
            $canciones->push($cancion);
        }

        foreach ($canciones->random(50) as $cancion_base) {
            $bgColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT); // Nuevo color para remixes
            $textColor = "FFF";

            $remix = Cancion::create([
                'titulo'                => $faker->sentence(rand(3, 7), true) . ' (Remix)',
                'duracion'              => $cancion_base->duracion + rand(10,60),
                'licencia_id'           => $cancion_base->licencia_id,
                // Eliminamos "?text=" para foto_url de remix
                'foto_url'              => "https://placehold.co/300x300/{$bgColor}/{$textColor}",
                'archivo_url'           => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($cancion_base->id % 16) + 1) . ".mp3",
                'publico'               => true,
                'remix'                 => true,
                'cancion_original_id'   => $cancion_base->id,
            ]);
            $remix->generos()->attach($cancion_base->generos->pluck('id')->toArray());
            $remix->usuarios()->attach($usuarios->random()->id, ['propietario' => true]);
            $canciones->push($remix);
        }


        $tipos = ['playlist','album','ep','single','loopz'];
        foreach ($tipos as $tipo) {
            for ($k = 1; $k <= 20; $k++) {
                $bgColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT); // Nuevo color para contenedores
                $textColor = "FFF";

                $contenedor = Contenedor::create([
                    'nombre'        => ucfirst($tipo) . " - " . $faker->words(rand(1, 3), true),
                    'descripcion'   => $faker->sentence(rand(5, 15), true),
                    'publico'       => true,
                    'tipo'          => $tipo,
                    // Eliminamos "?text=" para imagen de contenedor
                    'imagen'        => "https://placehold.co/400x400/{$bgColor}/{$textColor}",
                ]);
                $contenedor->canciones()->attach(
                    $canciones->random(rand(10,50))->pluck('id')->toArray()
                );
                $propietario = $usuarios->random();
                $contenedor->usuarios()->attach($propietario->id, ['propietario'=>true]);
                $seguidores = $usuarios->where('id','!=',$propietario->id)->random(rand(5,15));
                foreach ($seguidores as $seguidor) {
                    $contenedor->usuarios()->attach($seguidor->id, ['propietario'=>false]);
                }
                if ($tipo === 'loopz') {
                    $contenedor->loopzusuarios()->attach($usuarios->random(rand(5, 15))->pluck('id')->toArray());
                }
            }
        }

        foreach ($usuarios as $usuario) {
            $usuario->loopzCanciones()->attach(
                $canciones->random(rand(10, 30))->pluck('id')->toArray()
            );
        }
    }
}
