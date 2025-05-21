const express = require('express');
const icy = require('icy');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/metadata', (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) {
        // If the URL parameter is missing, send a 400 Bad Request response.
        return res.status(400).json({ error: 'Falta el parámetro url' });
    }

    // Use a flag to ensure we only send one response per request,
    // preventing "Headers already sent" errors.
    let responseSent = false;

    // icy.get returns the ClientRequest object. We need to capture this
    // to listen for errors that might occur before the 'response' event.
    const clientRequest = icy.get(streamUrl, (response) => {
        // This callback is executed if the initial HTTP connection and header parsing
        // are successful and a response object is received.

        // Listen for 'metadata' events from the stream.
        response.on('metadata', (metadata) => {
            if (responseSent) return; // If a response has already been sent, do nothing.
            const { StreamTitle } = icy.parse(metadata);
            res.json({ title: StreamTitle || 'Desconocido' });
            responseSent = true;
            response.destroy(); // Important: Close the stream once metadata is found.
            clientRequest.destroy(); // Also destroy the request to free resources.
        });

        // Listen for 'error' events on the *response* stream.
        // These errors typically occur after the connection is established,
        // during data transfer or if the stream abruptly ends.
        response.on('error', (err) => {
            if (responseSent) return; // If a response has already been sent, do nothing.
            console.error(`[Error en respuesta del stream ${streamUrl}]:`, err.message);
            res.status(500).json({ error: 'Error al obtener metadata del stream o al procesar la respuesta.' });
            responseSent = true;
            response.destroy(); // Close the stream.
            clientRequest.destroy(); // Also destroy the request.
        });

        // Add a timeout for receiving metadata from the response.
        // If no metadata or error occurs within this time, assume no metadata is available.
        const responseTimeout = setTimeout(() => {
            if (!responseSent) {
                console.warn(`[Timeout de metadata para ${streamUrl}]: No se recibió metadata a tiempo.`);
                res.json({ title: 'Desconocido (sin metadata)' }); // Respond with 'Desconocido'
                responseSent = true;
                response.destroy(); // Close the stream.
                clientRequest.destroy(); // Also destroy the request.
            }
        }, 8000); // 8 seconds timeout for metadata

        // Clear the timeout if the response stream ends or closes normally.
        response.on('end', () => clearTimeout(responseTimeout));
        response.on('close', () => clearTimeout(responseTimeout));
    });

    // Listen for 'error' events on the *clientRequest* object itself.
    // This is crucial for catching errors that occur *before* a full HTTP response
    // is received and parsed, such as:
    // - 'HPE_CR_EXPECTED': The parse error you were encountering.
    // - 'ENOTFOUND': DNS resolution failure (URL doesn't exist).
    // - 'ECONNREFUSED': Connection refused by the server.
    // - Other network-related errors.
    clientRequest.on('error', (err) => {
        if (responseSent) return; // If a response has already been sent, do nothing.
        console.error(`[Error de conexión/petición para ${streamUrl}]:`, err.message, `(Código: ${err.code})`);

        let errorMessage = 'Error al conectar con el servidor de streaming.';
        if (err.code === 'HPE_CR_EXPECTED') {
            errorMessage = 'Error de formato en la respuesta del servidor de streaming (falta CR).';
        } else if (err.code === 'ENOTFOUND') {
            errorMessage = 'URL de stream no encontrada o error de DNS.';
        } else if (err.code === 'ECONNREFUSED') {
            errorMessage = 'Conexión rechazada por el servidor de streaming.';
        }

        res.status(500).json({ error: errorMessage });
        responseSent = true;
        clientRequest.destroy(); // Ensure the request is closed to free resources.
    });

    // Add a timeout for the initial connection/request.
    // If no response or error occurs within this time, assume a connection issue.
    const requestTimeout = setTimeout(() => {
        if (!responseSent) {
            console.warn(`[Timeout de conexión para ${streamUrl}]: No se estableció conexión a tiempo.`);
            res.status(504).json({ error: 'Tiempo de espera agotado al intentar conectar con el stream.' });
            responseSent = true;
            clientRequest.destroy(); // Ensure the request is closed.
        }
    }, 12000); // 12 seconds timeout for connection

    // Clear the request timeout if a response is received or an error occurs on the request.
    clientRequest.on('response', () => clearTimeout(requestTimeout));
    clientRequest.on('error', () => clearTimeout(requestTimeout));

    // Handle client disconnection (e.g., user closes browser tab)
    req.on('close', () => {
        if (!responseSent) { // Only if a response hasn't been sent yet
            console.log(`[Cliente desconectado para ${streamUrl}]: Cerrando streams.`);
            clientRequest.destroy(); // Abort the ongoing request
        }
        clearTimeout(requestTimeout);
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor ICY escuchando en http://localhost:${PORT}`));
