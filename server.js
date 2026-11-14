 const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];
let ultimoLlamado = null;

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (ultimoLlamado) {
    res.write(`data: ${JSON.stringify(ultimoLlamado)}\n\n`);
  }

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

app.post('/', (req, res) => {
  const payload = req.body;
  console.log('Webhook recibido:', JSON.stringify(payload));

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

  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(ultimoLlamado)}\n\n`);
  });

  res.status(200).json({ status: 'Recibido con éxito' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de avisos activo en puerto ${PORT}`);
});
