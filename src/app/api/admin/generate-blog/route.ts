import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { topic, keywords, tone } = await request.json();

    if (!topic || topic.trim().length < 5) {
      return NextResponse.json(
        { error: 'El tema del blog es obligatorio y debe tener al menos 5 caracteres.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY no configurada en el servidor.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Eres un redactor experto en marketing de contenidos, redacción SEO (Search Engine Optimization) y copywriter profesional para el sector industrial, comercial y gastronómico.
Tu misión es generar un artículo de blog altamente optimizado para buscadores (Google SEO) sobre una empresa chilena de fabricación de soluciones en acero inoxidable llamada "Lezcom SpA" (o simplemente Lezcom).

INFORMACIÓN SOBRE EL ARTÍCULO A GENERAR:
- Tema / Tópico: "${topic}"
- Keywords objetivo adicionales a incorporar de forma natural: "${keywords || 'acero inoxidable, soluciones industriales'}"
- Tono: "${tone || 'Profesional e Informativo'}"
- Idioma: Español (Chile)

CONTEXTO DE LEZCOM SPA:
- Fábrica chilena de acero inoxidable en Santiago.
- Fabricación LOCAL y personalizada (sin plazos largos de importación). Plazos de entrega garantizados por escrito.
- Cumple con normativas sanitarias vigentes del Ministerio de Salud (MINSAL) de Chile, ideal para alimentos, farmacéuticas y laboratorios.
- Productos comunes: Mesas y mesones industriales gastronómicos, lavamanos de acero inoxidable, campanas industriales extractoras, estanterías, carros de transporte, pasamanos, escaleras metálicas, cubiertas de cocina, piezas especiales y muebles a medida según planos técnicos.
- Garantía de calidad de grado alimenticio AISI 304 y AISI 316.

REQUERIMIENTOS DEL ARTÍCULO (SEO):
1. **Título Atractivo**: Un H1 comercial, informativo, llamativo y que incluya la palabra clave principal de forma natural.
2. **Slug amigable**: Versión optimizada del título para URL (ejemplo: "ventajas-mesas-acero-inoxidable-cocinas-industriales").
3. **Resumen / Meta-Descripción**: Un resumen de 140-160 caracteres con un alto CTR para buscadores.
4. **Contenido Rico en HTML**: Un artículo extenso (entre 800 y 1200 palabras) con estructura HTML semántica:
   - Usa etiquetas <h2> y <h3> para estructurar subtemas.
   - Párrafos fluidos, dinámicos, fáciles de leer.
   - Listas con viñetas (<ul><li>) o numeradas si corresponde para mejorar la legibilidad.
   - Secciones destacadas o consejos útiles.
   - Incorpora de forma natural llamadas a la acción (CTA) invitando a cotizar en Lezcom con enlaces relativos a "/contacto" o destacando que pueden cotizar vía WhatsApp.
5. **Keywords Sugeridas**: Lista de 5 a 10 palabras clave separadas por comas.
6. **Tiempo de lectura estimado**: Ejemplo "5 min de lectura".
7. **Búsqueda / Propuesta de Imagen**: Describe brevemente una imagen ideal para el artículo o sugiere una palabra clave en inglés para un buscador de imágenes (ejemplo para Unsplash: "stainless-steel-commercial-kitchen").

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques markdown de código \`\`\`json, sin texto adicional fuera del JSON, solo el JSON puro):
{
  "titulo": "Título SEO optimizado",
  "slug": "slug-url-amigable",
  "resumen": "Resumen conciso del post para meta description (140-160 caracteres)",
  "contenido": "<p>Introducción del artículo...</p><h2>Subtitulo 1</h2><p>...</p>",
  "keywords": "palabra clave 1, palabra clave 2, palabra clave 3, acero inoxidable chile",
  "metaDescription": "Meta descripción atractiva para SEO",
  "leido": "6 min de lectura",
  "sugerenciaImagenQuery": "industrial-kitchen-stainless-steel"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Intentar parsear JSON limpio
    let parsed;
    try {
      // Limpiar posibles bloques markdown
      const cleaned = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        error: 'La IA devolvió una respuesta inesperada. Por favor, intenta de nuevo.',
        rawResponse: responseText.substring(0, 1000)
      }, { status: 422 });
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (error: any) {
    console.error('Error en generate-blog API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
