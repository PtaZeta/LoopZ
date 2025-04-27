<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str; // Necesario para Str::slug

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Contenedor>
 */
class ContenedorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nombre = $this->faker->words(rand(2, 5));
        $nombre = implode(' ', $nombre);
        return [
            'nombre' => Str::title($nombre),
            'descripcion' => $this->faker->optional()->sentence(rand(5, 15)),
            'imagen' => $this->faker->imageUrl(640, 480, 'music', true),
            'publico' => $this->faker->boolean(75),
            'tipo' => $this->faker->randomElement(['playlist', 'album', 'ep', 'single']),
        ];
    }
}
