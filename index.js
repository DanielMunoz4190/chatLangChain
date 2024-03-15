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

  if (!descripcion.trim()) {
    return res.redirect('/?error=Hey, no trates de romper esta humilde página.');
  }
  
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
      // Redirige de nuevo al formulario con un mensaje de error si el tipo no es válido
      res.redirect(`/?error=Tipo no válido. Por favor, selecciona una opción correcta.`);
      return;
  }

  const prompt = ChatPromptTemplate.fromMessages([["human", promptText]]);

  const model = new ChatOpenAI({
    apiKey: config.apiKey,
  });
  const outputParser = new StringOutputParser();
  
  const chain = prompt.pipe(model).pipe(outputParser);
  
  try {
    const response = await chain.invoke({});
    const formattedResponse = `<p>${response.replace(/\n/g, '<br>')}</p>`;
    // Envía de vuelta una página HTML con el contenido generado y mejorada estéticamente
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Respuesta Generada</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      height: 100vh;
    }
    #content {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      width: 100%;
    }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 10px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
    }
    a:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div id="content">
    <h2>Resultado:</h2>
    ${formattedResponse}
    <a href="/">Volver</a>
  </div>
</body>
</html>
    `);
  } catch (error) {
    console.error(error);
    // Redirige de nuevo al formulario con un mensaje de error si ocurre un error al generar la respuesta
    res.redirect(`/?error=Error al generar el contenido. Por favor, intenta de nuevo.`);
  }
});


app.get('/', async (req, res) => {
  const errorMessage = req.query.error ? `<p style="color: red; font-weight: bold;">${req.query.error}</p>` : '';
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Generador de Contenido</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      flex-direction: column;
      font-family: Arial, sans-serif;
      background-color: #f0f0f0;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    form {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    input[type="text"], input[type="submit"] {
      padding: 10px;
      margin: 10px 0;
      border-radius: 5px;
      border: 1px solid #ddd;
      width: calc(100% - 22px);
    }
    input[type="submit"] {
      background-color: #007bff;
      color: white;
      cursor: pointer;
    }
    input[type="submit"]:hover {
      background-color: #0056b3;
    }
    label {
      margin-right: 10px;
    }
    #errorMessage {
      color: red;
      font-weight: bold;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div id="content">
    ${errorMessage}
    <form action="/generate" method="post">
        <div>
          <input type="radio" id="cuento" name="tipo" value="cuento" checked>
          <label for="cuento">Cuento</label>
        </div>
        <div>
          <input type="radio" id="poema" name="tipo" value="poema">
          <label for="poema">Poema</label>
        </div>
        <div>
          <input type="radio" id="producto" name="tipo" value="producto">
          <label for="producto">Producto</label>
        </div>
        <div>
          <label for="descripcion">Descripción:</label><br>
          <input type="text" id="descripcion" name="descripcion">
        </div>
        <div>
          <input type="submit" value="Enviar">
        </div>
    </form>
  </div>
  <script>
  document.getElementById('content').querySelector('form').onsubmit = function(e) {
    const descripcion = document.getElementById('descripcion').value.trim();
    if (!descripcion) {
      e.preventDefault(); // Evita el envío del formulario
      alert('Hey, no trates de romper esta humilde página.');
    }
  };
</script>
</body>

</html>
  `;
  res.send(htmlContent);
});

app.use((req, res, next) => {
  res.status(404).send(`
<!DOCTYPE html>
<html>
<head>
  <title>Página no encontrada</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      height: 100vh;
    }
    h1 {
      color: #d9534f;
    }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 10px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
    }
    a:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <h1>404 - Página no encontrada</h1>
  <p>Lo sentimos, la página que estás buscando no existe.</p>
  <a href="/">Volver al inicio</a>
</body>
</html>
  `);
});


app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
