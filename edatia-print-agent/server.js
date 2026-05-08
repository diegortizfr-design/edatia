const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.USB = require('escpos-usb'); // Soporte para impresoras USB en Windows/Linux/Mac

const app = express();
app.use(cors()); // Permitir que el ERP web se comunique con este servidor local
app.use(express.json());

const PORT = 8080;

// Endpoint principal de impresión
app.post('/print', (req, res) => {
  const { texto, anchoPapel, cortarPapel = true } = req.body;

  if (!texto) {
    return res.status(400).json({ error: 'No se envió texto para imprimir' });
  }

  try {
    // Buscar dispositivos USB conectados
    const device = new escpos.USB(); 
    
    // Configurar la impresora
    const options = { encoding: 'GB18030' }; // Encoding genérico que funciona bien en térmicas
    const printer = new escpos.Printer(device, options);

    // Abrir conexión e imprimir
    device.open(function (error) {
      if (error) {
        console.error('Error al abrir la impresora:', error);
        return res.status(500).json({ error: 'Impresora no detectada o en uso' });
      }

      const paperSize = anchoPapel === 58 ? 32 : 48; // Caracteres por línea aprox.
      
      printer
        .align('ct')
        .text(texto)
        .feed(2); // Avanzar papel

      if (cortarPapel) {
        printer.cut();
      }

      printer.close();
      
      console.log('Ticket impreso correctamente');
      return res.json({ success: true, message: 'Impreso correctamente' });
    });

  } catch (err) {
    console.error('Excepción de hardware:', err);
    return res.status(500).json({ error: 'Fallo al conectar con el hardware USB', details: err.message });
  }
});

// Endpoint de diagnóstico
app.get('/status', (req, res) => {
  res.json({ 
    status: 'online', 
    agent: 'Edatia Print Agent', 
    version: '1.0.0' 
  });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🖨️  EDATIA PRINT AGENT INICIADO`);
  console.log(`========================================`);
  console.log(`El agente local está escuchando peticiones del ERP en:`);
  console.log(`http://localhost:${PORT}/print`);
  console.log(`Asegúrese de tener su impresora POS térmica conectada por USB.`);
});
