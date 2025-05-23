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

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create('es_ES');

        $this->call([
            SpotifyGenresSeeder::class,
            LicenciaSeeder::class,
        ]);

        // ---
        ## Truncado de Tablas Pivote y Principales

        DB::table('cancion_contenedor')->truncate();
        DB::table('cancion_genero')->truncate();
        DB::table('loopzs_canciones')->truncate();
        DB::table('pertenece_user')->truncate(); // Usando 'pertenece_user' como indicaste

        User::truncate();
        Cancion::truncate();
        Contenedor::truncate();

        // ---
        ## Verificación de Datos Necesarios

        $generos = Genero::all();
        $licencias = Licencia::all();

        if ($generos->isEmpty()) {
            $this->command->error('No hay géneros. Por favor cree géneros primero.');
            return;
        }
        if ($licencias->isEmpty()) {
            $this->command->error('No hay licencias. Por favor cree licencias primero.');
            return;
        }

        // ---
        ## Creación de Usuarios

        $users = collect();
        for ($i = 1; $i <= 50; $i++) {
            $bgColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);
            $textColor = str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);

            $users->push(
                User::create([
                    'name' => $faker->name(),
                    'email' => "user{$i}@example.com",
                    'password' => Hash::make('password'),
                    // CORREGIDO: Usamos 'foto_perfil' y 'banner_perfil' como en tu modelo User
                    'foto_perfil' => "https://placehold.co/150x150/{$bgColor}/{$textColor}?text=" . urlencode($faker->firstName()),
                    'banner_perfil' => "https://placehold.co/800x200/{$bgColor}/{$textColor}?text=Banner"
                ])
            );
        }

        // ---
        ## Creación de Canciones

        $canciones = collect();
        for ($i = 1; $i <= 500; $i++) {
            $cancion = Cancion::create([
                'titulo'        => "Cancion {$i} - " . $faker->words(rand(1, 3), true),
                'duracion'      => rand(120, 300),
                'licencia_id'   => $licencias->random()->id,
                // Si la tabla canciones también tiene 'foto_url' como en tu modelo Cancion
                'foto_url'      => "https://placehold.co/300x300/" . str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT) . "/FFF?text=Song+Pic",
                'archivo_url'   => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($i % 16) + 1) . ".mp3",
                'publico'       => (bool) rand(0,1),
                'remix'         => false,
            ]);
            $cancion->generos()->attach(
                $generos->random(rand(1, min(3, $generos->count())))->pluck('id')->toArray()
            );
            $cancion->usuarios()->attach($users->random()->id, ['propietario' => true]);
            $canciones->push($cancion);
        }

        // ---
        ## Creación de Remixes

        foreach ($canciones->random(50) as $base) {
            $rmx = Cancion::create([
                'titulo'                => $base->titulo . ' (Remix)',
                'duracion'              => $base->duracion + rand(10,60),
                'licencia_id'           => $base->licencia_id,
                'foto_url'              => "https://placehold.co/300x300/" . str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT) . "/FFF?text=Remix+Pic", // También para remixes
                'archivo_url'           => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($base->id % 16) + 1) . ".mp3",
                'publico'               => true,
                'remix'                 => true,
                'cancion_original_id'   => $base->id,
            ]);
            $rmx->generos()->attach($base->generos->pluck('id')->toArray());
            $rmx->usuarios()->attach($users->random()->id, ['propietario' => true]);
            $canciones->push($rmx);
        }

        // ---
        ## Creación de Contenedores (Playlists, Álbumes, etc.)

        $tipos = ['playlist','album','ep','single','loopz'];
        foreach ($tipos as $tipo) {
            for ($k = 1; $k <= 20; $k++) {
                $cont = Contenedor::create([
                    'nombre'        => ucfirst($tipo) . " {$k} - " . $faker->words(rand(1, 2), true),
                    'descripcion'   => "Demo de {$tipo} {$k} " . $faker->sentence(rand(5, 10)),
                    'publico'       => true,
                    'tipo'          => $tipo,
                    'imagen'        => "https://placehold.co/400x400/" . str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT) . "/FFF?text=" . ucfirst($tipo), // Imagen para contenedores
                ]);
                $cont->canciones()->attach(
                    $canciones->random(rand(10,50))->pluck('id')->toArray()
                );
                $owner = $users->random();
                $cont->usuarios()->attach($owner->id, ['propietario'=>true]);
                $followers = $users->where('id','!=',$owner->id)->random(rand(5,15));
                foreach ($followers as $f) {
                    $cont->usuarios()->attach($f->id, ['propietario'=>false]);
                }
                if ($tipo === 'loopz') {
                    $cont->loopzusuarios()->attach($users->random(rand(5, 15))->pluck('id')->toArray());
                }
            }
        }

        // ---
        ## Adjuntar Canciones a "Loopz" de Usuarios

        foreach ($users as $usr) {
            $usr->loopzCanciones()->attach(
                $canciones->random(rand(10, 30))->pluck('id')->toArray()
            );
        }

        $this->command->info('✔️ Seeder masivo ejecutado: 50 usuarios, 550 canciones, 100 contenedores y datos relacionados.');
    }
}
