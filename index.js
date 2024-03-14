import express from 'express';
import bodyParser from 'body-parser';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const OPENAI_API_KEY = "es un secreto, jiji";
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/generate', async (req, res) => {
  const { tipo, descripcion } = req.body; // Extrae tipo y descripción del cuerpo de la solicitud

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
      return res.status(400).send('Tipo no válido.');
  }

  const prompt = ChatPromptTemplate.fromMessages([
    ["human", promptText],
  ]);

  const model = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
  });
  const outputParser = new StringOutputParser();
  
  const chain = prompt.pipe(model).pipe(outputParser);
  
  try {
    const response = await chain.invoke({});
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al generar la respuesta.');
  }
});

app.get('/', async (req, res) => {
    res.send('¡Hola, mundo!');
}
);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
