import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { apiKey, sender, to, subject, htmlContent } = data;

    // Usamos la API key provista por el cliente en caliente, o en su defecto, la del servidor (.env)
    const activeApiKey = apiKey || process.env.BREVO_API_KEY;

    if (!activeApiKey) {
      return NextResponse.json(
        { error: 'API Key de Brevo no configurada. Por favor, añádela en la pestaña Configuración.' },
        { status: 400 }
      );
    }

    if (!to || !to.email) {
      return NextResponse.json(
        { error: 'Destinatario inválido o ausente.' },
        { status: 400 }
      );
    }

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Asunto o contenido del correo faltantes.' },
        { status: 400 }
      );
    }

    const recipient = {
      email: to.email,
      name: to.name || to.email.split('@')[0],
    };

    const activeSender = {
      name: sender?.name || process.env.BREVO_SENDER_NAME || 'Lezcom SpA',
      email: sender?.email || process.env.BREVO_SENDER_EMAIL || 'info@lezcom.cl',
    };

    // Llamada REST API de Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': activeApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: activeSender,
        to: [recipient],
        subject,
        htmlContent
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Brevo API Error Response:', result);
      return NextResponse.json(
        { error: result.message || 'Error de Brevo al enviar el correo.' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: 'Correo enviado con éxito', messageId: result.messageId },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Internal Error in send-email API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar el envío.' },
      { status: 500 }
    );
  }
}
