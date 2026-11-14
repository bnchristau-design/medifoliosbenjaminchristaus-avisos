const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lista de pantallas conectadas (computadora de la secretaria / TV)
let clients = [];
let ultimoLlamado = null;

// Ruta de conexión en tiempo real para la pantalla
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Si ya hubo un llamado reciente, mostrarlo al conectar
  if (ultimoLlamado) {
    res.write(`data: ${JSON.stringify(ultimoLlamado)}\n\n`);
  }

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Ruta que recibe el Webhook de Medifolios (POST)
app.post('/', (req, res) => {
  const payload = req.body;
  console.log('Webhook recibido:', JSON.stringify(payload));

  // Extraer nombre del paciente según la estructura del JSON de Medifolios
  // Se incluyen fallbacks por si el campo viene anidado
  const paciente = 
    payload?.data?.paciente?.nombre_completo || 
    payload?.data?.paciente_nombre || 
    payload?.paciente || 
    'Paciente en turno';

  const consultorio = 
    payload?.data?.consultorio || 
    payload?.consultorio || 
    'Consultorio Dr. Benjamín';

  ultimoLlamado = {
    paciente: paciente,
    consultorio: consultorio,
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  };

  // Notificar a todas las pantallas abiertas
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(ultimoLlamado)}\n\n`);
  });

  // Respuesta exacta que espera Medifolios
  res.status(200).json({ status: 'Recibido con éxito' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de avisos activo en puerto ${PORT}`);
});
