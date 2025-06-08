import axios from 'axios';

const URL_RECOMENDACIONES = '/api/recomendaciones';

export async function obtenerCancionesRecomendadas(idCancionOrigen = null) {
    try {
        const respuesta = await axios.post(URL_RECOMENDACIONES, { idCancionOrigen });
        return respuesta.data;
    } catch (error) {
        return [];
    }
}
