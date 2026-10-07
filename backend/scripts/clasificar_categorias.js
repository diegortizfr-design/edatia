const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const productos = await prisma.producto.findMany({
    where: { empresaId: 1, activo: true },
    select: { id: true, nombre: true, descripcion: true, sku: true }
  });

  const batchSize = 30;
  const resultados = [];

  for (let i = 0; i < productos.length; i += batchSize) {
    const lote = productos.slice(i, i + batchSize);
    
    const prompt = `
Eres un experto categorizador de tiendas virtuales de bebés.
A continuación te doy una lista de productos en formato JSON.
Tu tarea es clasificar CADA producto en UNA de estas 3 CATEGORÍAS PRINCIPALES (según lo que más tenga sentido):
1. Pañales y Cuidado
2. Juguetería
3. Variedades

Y además, asignarle una SUBCATEGORÍA corta, lógica y consistente. 
Por favor, agrupa los productos similares usando subcategorías estándar como:
"Ropa", "Aseo", "Muebles", "Alimentación", "Estimulación", "Lencería", "Paseo", "Accesorios", "Cremas", "Pañales".
No inventes más de 12 subcategorías distintas en total.

Devuelve ÚNICAMENTE un arreglo JSON válido con este formato para cada producto, sin texto adicional ni bloques de markdown (ni \`\`\`json):
[
  { "id": 1, "categoria": "Juguetería", "subcategoria": "Estimulación" }
]

Lista de productos:
${JSON.stringify(lote, null, 2)}
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
      });
      let text = response.text.trim();
      if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      if (text.startsWith('```')) text = text.replace(/```/g, '').trim();

      const jsonRes = JSON.parse(text);
      resultados.push(...jsonRes);
      
      await delay(5000);
    } catch (e) {
      console.error(`Error en el lote ${i/batchSize + 1}:`, e);
    }
  }

  // Imprimimos solo el JSON final
  console.log(JSON.stringify(resultados, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
