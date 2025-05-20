const express = require('express');
const icy = require('icy');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/metadata', (req, res) => {
  const streamUrl = req.query.url;

  if (!streamUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    icy.get(streamUrl, function (response) {
      response.on('metadata', function (metadata) {
        const parsed = icy.parse(metadata);
        res.json({ title: parsed.StreamTitle || 'Desconocido' });
        response.destroy();
      });

      response.on('error', err => {
        res.status(500).json({ error: 'No se pudo obtener metadata' });
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'URL inválida o stream no disponible' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor ICY escuchando en http://localhost:${PORT}`);
});
