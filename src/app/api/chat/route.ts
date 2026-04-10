import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { mensaje, historial } = data; // Puedes enviar el historial completo o solo el mensaje actual

    // URL del Webhook de n8n para el Chat
    const N8N_CHAT_WEBHOOK = process.env.N8N_CHAT_WEBHOOK || 'https://n8n.santisoft.cl/webhook/chat-incoming';

    // Llamada sincrónica a n8n
    const respuestaN8n = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Enviamos el mensaje actual y el historial (si n8n lo necesita para contexto)
      body: JSON.stringify({ mensaje, historial }), 
    });

    if (!respuestaN8n.ok) {
      throw new Error(`Error de n8n: ${respuestaN8n.statusText}`);
    }

    // Esperamos que n8n responda con un JSON que tenga al menos { "respuesta": "..." }
    // o el texto plano. Adaptaremos esto según lo que devuelva tu webhook.
    const contentType = respuestaN8n.headers.get("content-type");
    let botMessage = "";

    if (contentType && contentType.indexOf("application/json") !== -1) {
      const json = await respuestaN8n.json();
      botMessage = json.respuesta || json.message || json.text || JSON.stringify(json);
    } else {
      botMessage = await respuestaN8n.text();
    }

    return NextResponse.json({ respuesta: botMessage }, { status: 200 });

  } catch (error) {
    console.error("Error en el chat proxy:", error);
    return NextResponse.json({ error: 'Hubo un error al comunicar con el bot.' }, { status: 500 });
  }
}
