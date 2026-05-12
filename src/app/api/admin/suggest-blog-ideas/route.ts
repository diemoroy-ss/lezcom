import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { mode } = await request.json(); // mode: 'ideas' | 'calendar'

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY no configurada en el servidor.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = "";

    if (mode === 'ideas') {
      prompt = `Eres un estratega experto en marketing de contenidos B2B, consultor SEO y analista de mercado en Chile especializado en el sector industrial, gastronómico y clínico.
Tu tarea es proponer 5 ideas creativas, de alto impacto y de fácil posicionamiento en buscadores para artículos del blog de "Lezcom SpA", fabricante líder de mobiliario y soluciones personalizadas en acero inoxidable en Santiago de Chile.

REQUISITOS DE CADA IDEA:
- Debe abordar dolores, problemas y soluciones reales del mercado gastronómico (restaurantes, hoteles, cafeterías, casinos), clínico (laboratorios, clínicas, hospitales, farmacias) o residencial premium en Chile.
- Debe incluir palabras clave realistas y de alto volumen/intención comercial en Chile (ej. "mesones de acero en santiago", "campanas industriales mical", "normas higiénicas cocinas chilenas").
- Explicar brevemente por qué es una excelente oportunidad de negocio (SEO & Conversión).

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques markdown de código \`\`\`json, sin texto adicional fuera del JSON, solo el JSON puro):
{
  "ideas": [
    {
      "tema": "Título sugerido llamativo",
      "keywords": "palabra clave 1, palabra clave 2, palabra clave 3",
      "explicacion": "Breve explicación de por qué este tema solucionará un problema a tus clientes y cómo posicionará a Lezcom."
    },
    ... (proporciona exactamente 5 ideas robustas y variadas entre sectores)
  ]
}`;
    } else {
      prompt = `Eres un estratega experto en inbound marketing B2B, consultor SEO y planificador de contenidos especializado en la industria metalúrgica y gastronómica en Chile.
Tu misión es diseñar un Plan de Contenidos y Calendario Editorial de 4 semanas para el blog de "Lezcom SpA", fábrica chilena experta en soluciones personalizadas en acero inoxidable para cocinas industriales, casinos, clínicas y laboratorios.

REQUISITOS DEL CALENDARIO (4 SEMANAS):
- Cada semana debe enfocarse en un nicho de mercado diferente donde Lezcom tiene excelente rentabilidad (Semana 1: Gastronomía/Horeca, Semana 2: Laboratorios/Salud, Semana 3: Equipamiento Industrial/Bodegas, Semana 4: Diseño Residencial Premium o Normativas Sanitarias).
- Cada publicación debe estructurarse con:
  - Semana (ej: "Semana 1: Gastronomía & Cocinas")
  - Título sugerido del post.
  - Palabras clave objetivo (keywords) orientadas a la intención de compra en Chile.
  - Resumen/Descripción del enfoque estratégico.
  - Estructura propuesta (Secciones principales que debe tocar).

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO (sin bloques markdown de código \`\`\`json, sin texto adicional fuera del JSON, solo el JSON puro):
{
  "calendario": [
    {
      "semana": "Semana 1: Gastronomía Comercial",
      "titulo": "Título de alto impacto con palabras clave",
      "keywords": "palabra clave 1, palabra clave 2, etc.",
      "descripcion": "Descripción del objetivo del artículo y cómo posiciona las soluciones personalizadas de Lezcom SpA.",
      "secciones": ["Introducción al problema", "Por qué falla el equipamiento genérico", "La importancia del acero AISI 304 certificado", "Cómo cotizar mesas a medida en Santiago"]
    },
    ... (proporciona exactamente 4 semanas organizadas con excelente variedad)
  ]
}`;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed;
    try {
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
    console.error('Error en suggest-blog-ideas API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
