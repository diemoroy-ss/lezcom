import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { htmlContent, rubro } = await request.json();

    if (!htmlContent || htmlContent.trim().length < 20) {
      return NextResponse.json(
        { error: 'El contenido HTML de la plantilla está vacío o es demasiado corto.' },
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Eres un experto en email marketing B2B, copywriting de ventas y entregabilidad de correos electrónicos (email deliverability). Tu misión es analizar y mejorar plantillas HTML de correo para que:
1. NO sean clasificadas como "Promociones" o "Spam" por Gmail y otros clientes de correo.
2. Aborden los PROBLEMAS REALES del cliente antes de presentar soluciones.
3. Conecten emocionalmente con el dolor del prospecto para generar respuestas.

CONTEXTO:
- La plantilla es para una empresa chilena llamada "Lezcom SpA" que fabrica productos en acero inoxidable.
- Lezcom fabrica: mesones industriales, lavamanos, equipos gastronómicos, pasamanos, escaleras, estructuras, piezas a medida, suministros industriales.
- Diferenciadores clave: fabricación LOCAL en Santiago (sin importaciones), plazos comprometidos, certificación MINSAL para alimentos, flexibilidad ante cambios, desde planos técnicos, control de calidad documentado, proveedor único (estándar + a medida).
- El rubro objetivo del correo es: "${rubro || 'Industrial'}"
- Los correos son de prospección B2B (contacto inicial con empresas)
- Se envían a través de Brevo (ex-Sendinblue) desde info@lezcom.cl

PLANTILLA ACTUAL A ANALIZAR:
\`\`\`html
${htmlContent}
\`\`\`

CRITERIOS DE EVALUACIÓN (cada uno de 0 a 10):
1. **Personalización**: ¿Usa variables dinámicas como {{Representante}}, {{RazonSocial}} al inicio?
2. **Simplicidad HTML**: ¿Evita tablas complejas, imágenes y CSS pesado?
3. **Ratio texto/HTML**: ¿Tiene suficiente texto natural vs. código?
4. **Palabras de spam**: ¿Evita palabras como GRATIS, OFERTA, DESCUENTO, signos $ o %?
5. **Tono conversacional**: ¿Suena como un correo personal, no un newsletter?
6. **Un solo CTA**: ¿Tiene máximo 1-2 enlaces?
7. **Pregunta de cierre**: ¿Termina con una pregunta que invite a responder?
8. **Asunto <title>**: ¿Tiene un asunto en <title> natural y específico?
9. **Empatía con problemas del cliente**: ¿El correo PRIMERO identifica un dolor o problema real del rubro del cliente ANTES de hablar de Lezcom? Un buen correo B2B abre con empatía ("Sabemos que en su rubro X es un problema...") y no solo lista capacidades. Puntúa 0 si solo habla de lo que Lezcom hace, 10 si empatiza profundamente con problemas reales del rubro.
10. **Estructura Problema→Solución**: ¿El correo sigue la estructura: saludo → problema del cliente → solución de Lezcom → diferenciador → CTA con pregunta? Puntúa 0 si solo lista capacidades sin contexto, 10 si cada solución responde a un problema específico mencionado antes.

RESPONDE ÚNICAMENTE EN ESTE FORMATO JSON EXACTO (sin markdown, sin bloques de código):
{
  "puntuacion_total": <número del 0 al 100>,
  "diagnostico": {
    "personalización": <0-10>,
    "simplicidad_html": <0-10>,
    "ratio_texto": <0-10>,
    "palabras_spam": <0-10>,
    "tono_conversacional": <0-10>,
    "cta_unico": <0-10>,
    "pregunta_cierre": <0-10>,
    "asunto_title": <0-10>,
    "empatia_problemas": <0-10>,
    "estructura_problema_solucion": <0-10>
  },
  "problemas": ["problema 1 específico", "problema 2 específico"],
  "mejoras_aplicadas": ["mejora 1 aplicada", "mejora 2 aplicada"],
  "html_mejorado": "<el HTML completo mejorado aquí, listo para copiar>"
}

REGLAS PARA EL HTML MEJORADO (OBLIGATORIAS):
- Mantén TODAS las variables dinámicas {{Representante}}, {{RazonSocial}}, {{Rubro}}, {{Pitch_Personalizado}}, etc.
- El HTML debe ser un documento completo con <!DOCTYPE html>, <html lang="es">, <head> con <title> personalizado, y <body>
- El asunto en <title> debe ser específico para el rubro y contener {{RazonSocial}}
- ⚠️ CRÍTICO — NO uses bloques <style> en el <head>. Gmail los elimina completamente. TODO el CSS debe ir como atributo style="" inline en cada elemento HTML.
- El botón CTA DEBE tener style="display:inline-block;background-color:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:6px;" directamente en la etiqueta <a>
- Fuente Arial o Helvetica, texto negro #1a1a1a sobre fondo blanco #ffffff
- Máximo 1 enlace externo (https://www.lezcom.cl)
- Sin imágenes externas, sin tablas de diseño complejas
- Comenzar con "Hola {{Representante}}," como primera línea
- OBLIGATORIO: Incluir un párrafo de "problema/dolor del cliente" ANTES de listar soluciones. Usar un div con fondo rosado sutil (background-color:#fef3f2;border-left:4px solid #f87171) para destacar el problema, seguido de un div azul (background-color:#f0f7ff;border-left:4px solid #3b82f6) para las soluciones.
- Cada solución listada debe responder directamente a un problema mencionado antes.
- Terminar con una pregunta directa que invite al cliente a responder
- Firma simple con nombre, cargo, Lezcom SpA y enlace web`;

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
      // Si falla el parse, devolver el texto crudo para depuración
      return NextResponse.json({
        error: 'La IA devolvió una respuesta inesperada. Intenta de nuevo.',
        rawResponse: responseText.substring(0, 500)
      }, { status: 422 });
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (error: any) {
    console.error('Error en improve-template API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
