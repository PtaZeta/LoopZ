const express = require('express');
const icy = require('icy');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/metadata', (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) {
        return res.status(400).json({ error: 'Falta el parámetro url' });
    }

    let respuestaEnviada = false;

    const solicitudCliente = icy.get(streamUrl, (respuesta) => {

        respuesta.on('metadata', (metadata) => {
            if (respuestaEnviada) return;
            const { StreamTitle } = icy.parse(metadata);
            res.json({ title: StreamTitle || 'Desconocido' });
            respuestaEnviada = true;
            respuesta.destroy();
            solicitudCliente.destroy();
        });

        respuesta.on('error', (err) => {
            if (respuestaEnviada) return;
            res.status(500).json({ error: 'Error al obtener metadata del stream o al procesar la respuesta.' });
            respuestaEnviada = true;
            respuesta.destroy();
            solicitudCliente.destroy();
        });
        const tiempoEsperaRespuesta = setTimeout(() => {
            if (!respuestaEnviada) {
                res.json({ title: 'Desconocido' });
                respuestaEnviada = true;
                respuesta.destroy();
                solicitudCliente.destroy();
            }
        }, 8000);

        respuesta.on('end', () => clearTimeout(tiempoEsperaRespuesta));
        respuesta.on('close', () => clearTimeout(tiempoEsperaRespuesta));
    });

    solicitudCliente.on('error', (err) => {
        respuestaEnviada = true;
        solicitudCliente.destroy();
    });

    const tiempoEsperaSolicitud = setTimeout(() => {
        if (!respuestaEnviada) {
            res.status(504).json({ error: 'Tiempo de espera agotado al intentar conectar con el stream.' });
            respuestaEnviada = true;
            solicitudCliente.destroy();
        }
    }, 12000);

    solicitudCliente.on('response', () => clearTimeout(tiempoEsperaSolicitud));
    solicitudCliente.on('error', () => clearTimeout(tiempoEsperaSolicitud));

    req.on('close', () => {
        if (!respuestaEnviada) {
            solicitudCliente.destroy();
        }
        clearTimeout(tiempoEsperaSolicitud);
    });
});

const PUERTO = process.env.PORT || 3001;
app.listen(PUERTO, () => {
});
