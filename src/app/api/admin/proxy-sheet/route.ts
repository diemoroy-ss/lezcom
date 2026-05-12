import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookUrl = searchParams.get('url');

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Falta el parámetro "url" del webhook de n8n' }, { status: 400 });
    }

    console.log('API Proxy calling n8n URL:', webhookUrl);

    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error desde n8n: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { rawText: text };
      }
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Error in proxy-sheet API:', error);
    return NextResponse.json(
      { error: error.message || 'Error al conectar con el webhook a través de la API del servidor.' },
      { status: 500 }
    );
  }
}
