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
                'acoustic','afrobeat','alt-rock','alternative','ambient','anime',
                'black-metal','bluegrass','blues','bossanova','brazil','breakbeat',
                'british','cantopop','chicago-house','children','chill','classical',
                'club','comedy','country','dance','dancehall','death-metal','deep-house',
                'detroit-techno','disco','disney','drum-and-bass','dub','dubstep','edm',
                'electro','electronic','emo','folk','forro','french','funk','garage',
                'german','gospel','grindcore','groove','grunge','guitar','happy','hard-rock',
                'hardcore','hardstyle','heavy-metal','hip-hop','holidays','honky-tonk',
                'house','idm','indian','indie','indie-pop','industrial','iranian','j-dance',
                'j-idol','j-pop','j-rock','jazz','k-pop','kids','latin','latino','malay',
                'mandopop','metal','metal-misc','metalcore','minimal-techno','movies',
                'mpb','new-age','new-release','opera','pagode','party','piano','pop',
                'pop-film','post-dubstep','power-pop','progressive-house','psych-rock',
                'punk','punk-rock','r-n-b','rainy-day','reggae','reggaeton','road-trip',
                'rock','rock-n-roll','rockabilly','romance','sad','salsa','samba',
                'sertanejo','show-tunes','singer-songwriter','ska','sleep','songwriter',
                'soul','soundtracks','spanish','study','summer','synth-pop','tango',
                'tech-house','techno','trance','trip-hop','turkish','work-out','world-music'
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
