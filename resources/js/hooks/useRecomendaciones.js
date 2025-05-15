import axios from 'axios';

export async function obtenerCancionesRecomendadas(seedSongId = null) {
    try {
        const response = await axios.post('/api/recomendaciones', { seedSongId });
        console.log('[useRecs] got', response.data.length, 'recs');
        return response.data;
    } catch (error) {
        console.error('Error al obtener recomendaciones:', error);
        return [];
    }
}
