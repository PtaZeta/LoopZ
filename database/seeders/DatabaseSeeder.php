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

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            SpotifyGenresSeeder::class,
            LicenciaSeeder::class,
        ]);
        DB::table('cancion_contenedor')->truncate();
        DB::table('cancion_genero')->truncate();
        DB::table('loopzs_canciones')->truncate();
        DB::table('loopzs_contenedores')->truncate();

        User::truncate();
        Cancion::truncate();
        Contenedor::truncate();

        $generos = Genero::all();
        $licencias = Licencia::all();

        if ($generos->isEmpty()) {
            $this->command->error('No hay géneros. Por favor cree géneros primero.');
        }
        if ($licencias->isEmpty()) {
            $this->command->error('No hay licencias. Por favor cree licencias primero.');
        }

        $users = collect();
        for ($i = 1; $i <= 50; $i++) {
            $users->push(
                User::create([
                    'name' => "Usuario{$i}",
                    'email' => "user{$i}@example.com",
                    'password' => Hash::make('password'),
                ])
            );
        }

        $canciones = collect();
        for ($i = 1; $i <= 500; $i++) {
            $cancion = Cancion::create([
                'titulo'       => "Cancion {$i}",
                'duracion'     => rand(120, 300),
                'licencia_id'  => $licencias->random()->id,
                'archivo_url'  => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($i % 16) + 1) . ".mp3",
                'publico'      => (bool) rand(0,1),
                'remix'        => false,
            ]);
            $cancion->generos()->attach(
                $generos->random(rand(1, min(3, $generos->count())))->pluck('id')->toArray()
            );
            $canciones->push($cancion);
        }

        foreach ($canciones->random(50) as $base) {
            $rmx = Cancion::create([
                'titulo'               => $base->titulo . ' (Remix)',
                'duracion'             => $base->duracion + rand(10,60),
                'licencia_id'          => $base->licencia_id,
                'archivo_url'          => "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-" . (($base->id % 16) + 1) . ".mp3",
                'publico'              => true,
                'remix'                => true,
                'cancion_original_id'  => $base->id,
            ]);
            $rmx->generos()->attach($base->generos->pluck('id')->toArray());
            $canciones->push($rmx);
        }

        $tipos = ['playlist','album','ep','single','loopz'];
        foreach ($tipos as $tipo) {
            for ($k = 1; $k <= 20; $k++) {
                $cont = Contenedor::create([
                    'nombre'      => ucfirst($tipo) . " {$k}",
                    'descripcion' => "Demo de {$tipo} {$k}",
                    'publico'     => true,
                    'tipo'        => $tipo,
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
                    $cont->loopzusuarios()->attach($users->random(10)->pluck('id')->toArray());}
            }
        }

        foreach ($users as $usr) {
            $usr->loopzCanciones()->attach(
                $canciones->random(20)->pluck('id')->toArray()
            );
        }

        $this->command->info('✔️ Seeder masivo ejecutado: 50 usuarios, 550 canciones, 1000+ pivot entries, 100 contenedores.');
    }
}
