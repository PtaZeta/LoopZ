import axios from 'axios';

const RECOMENDACIONES_URL = '/api/recomendaciones';

export async function obtenerCancionesRecomendadas(seedSongId = null) {
    try {
        const response = await axios.post(RECOMENDACIONES_URL, { seedSongId });
        return response.data;
    } catch (error) {
        console.error('Error al obtener recomendaciones:', error);
        return [];
    }
}
