import express from 'express';
// No necesitas importar bodyParser, ya que express tiene su propia implementación
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
// Suponiendo que existe un archivo config.js para la configuración
import config from './config.js';
const app = express();
const port = 3000;

// Middleware para parsear cuerpos JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/generate', async (req, res) => {
  const { tipo, descripcion } = req.body;
  
  let promptText;
  switch (tipo) {
    case 'cuento':
      promptText = `Escribe un cuento corto sobre ${descripcion}`;
      break;
    case 'poema':
      promptText = `Escribe un poema corto sobre ${descripcion}`;
      break;
    case 'producto':
      promptText = `Genera la descripción de un producto sobre ${descripcion}`;
      break;
    default:
      return res.status(400).json({ error: 'No trates de romper esto y selecciona una opcion válida.'});
  }

  const prompt = ChatPromptTemplate.fromMessages([
    ["human", promptText],
  ]);

  const model = new ChatOpenAI({
    apiKey: config.apiKey, // Asegúrate de que tu archivo config.js exporta una propiedad apiKey
  });
  const outputParser = new StringOutputParser();
  
  const chain = prompt.pipe(model).pipe(outputParser);
  
  try {
    const response = await chain.invoke({});
    res.json({ formattedResponse: `<p>${response.replace(/\n/g, '<br>')}</p>` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '¡Ups! Parece que nuestro generador de contenidos tuvo un pequeño tropiezo. ¿Podrías intentarlo de nuevo?' });
  }
});

app.get('/', async (req, res) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Generador de Contenido</title>
  <style>
    body { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
    #responseContainer { margin-top: 20px; }
  </style>
</head>
<body>
  <form id="generateForm">
      <input type="radio" id="cuento" name="tipo" value="cuento" checked>
      <label for="cuento">Cuento</label><br>
      <input type="radio" id="poema" name="tipo" value="poema">
      <label for="poema">Poema</label><br>
      <input type="radio" id="producto" name="tipo" value="producto">
      <label for="producto">Producto</label><br>
      <label for="descripcion">Descripción:</label><br>
      <input type="text" id="descripcion" name="descripcion"><br><br>
      <input type="submit" value="Enviar">
  </form>
  <div id="responseContainer"></div>
  <script>
    document.getElementById('generateForm').onsubmit = async function(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      const descripcion = formData.get('descripcion');
      if (!descripcion) {
        document.getElementById('responseContainer').innerHTML = '<p style="color: red;">¿Intentas enviar un mensaje al vacío? Escribe algo interesante primero. 😉</p>';
        return;
      }
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const data = await response.json();
      if (data.error) {
        document.getElementById('responseContainer').innerHTML = '<p style="color: red;">' + data.error + '</p>';
        document.getElementById('responseContainer').innerHTML = data.formattedResponse;
      }
    };
  </script>
</body>
</html>
  `;
  res.send(htmlContent);
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
