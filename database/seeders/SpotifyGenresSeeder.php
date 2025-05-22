<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use App\Models\Genero;

class SpotifyGenresSeeder extends Seeder
{
    public function run()
    {
        $tokenResponse = Http::asForm()
            ->withBasicAuth(
                config('services.spotify.client_id'),
                config('services.spotify.client_secret')
            )
            ->post('https://accounts.spotify.com/api/token', [
                'grant_type' => 'client_credentials',
            ]);

        if (! $tokenResponse->successful()) {
            $status = $tokenResponse->status();
            $body   = $tokenResponse->body() ?: '[sin cuerpo]';
            $this->command->error("Error obteniendo token Spotify: HTTP {$status} - {$body}");
            return;
        }

        $accessToken = $tokenResponse->json('access_token');
        $this->command->info("Access Token: {$accessToken}");

        $apiEndpoint = 'https://api.spotify.com/v1/recommendations/available-genre-seeds';
        $this->command->info("Llamando a: {$apiEndpoint}");

        $genresResponse = Http::withToken($accessToken)
            ->get($apiEndpoint);

        if ($genresResponse->status() === 404) {
            $genres = [
                'pop','hip hop','regueton','latin','rock','r&b','k-pop','edm','electronica','trap',
                'dance','house','reggae','metal','punk','jazz','clasica','soul','blues','funk',
                'alternativo','rock alternativo','indie','pop indie','hard rock','heavy metal','country',
                'synth pop','rap','acustico','ambiental','romantica','salsa','samba','bossa nova',
                'dubstep','deep house','techno','tech house','new age','punk rock','drum and bass',
                'dub','folk','flamenco','ska','rock psicodelico','rock and roll','grunge','emo',
                'metalcore','metal variado','trap latino','grindcore','black metal','death metal',
                'pop poderoso','post-dubstep','minimal techno','progressive house','chill','study',
                'sleep','relax','feliz','triste','dia lluvioso','verano','ejercicio','viaje por carretera',
                'fiesta','comedia','anime','peliculas','disney','bandas sonoras','teatro musical',
                'cantautor','compositor','show-tunes','opera','piano','guitarra','mpb','sertanejo',
                'pagode','forro','brazil','brasil','espanola','frances','aleman','italiana','iran','turca',
                'arabe','coreana','china','j-pop','j-rock','j-idol','j-dance','cantopop','mandopop',
                'malayo','india','indie','gospel','garage','groove','bluegrass','honky tonk','country',
                'britanico','breakbeat','idm','industrial','trip hop','ambient','world music','musica del mundo',
                'mexicana','argentina','colombiana','peruana','cubana','dominicana','venezolana',
                'musica andina','musica criolla','ninos','infantil','children','festividades','club'
            ];
        } elseif (! $genresResponse->successful()) {
            $status = $genresResponse->status();
            $body   = $genresResponse->body() ?: '[sin cuerpo]';
            return;
        } else {
            $genres = $genresResponse->json('genres', []);
        }

        foreach ($genres as $nombre) {
            Genero::updateOrCreate(
                ['nombre' => $nombre],
                ['nombre' => $nombre]
            );
        }

        $this->command->info('Se han importado ' . count($genres) . ' géneros.');
    }

}
