import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. LLAMADA AL WEBHOOK DE N8N (Para WhatsApp)
    // Reemplaza esta URL con la tuya de n8n
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.santisoft.cl/webhook/contactoLezcom'; 
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      console.log('Webhook de n8n gatillado con éxito');
    } catch (n8nError) {
      console.error('Error al gatillar el webhook de n8n:', n8nError);
      // No bloqueamos el envío de correo si n8n falla
    }

    // 2. ENVÍO DE CORREO POR NODEMAILER (Hostgator)
    const transporter = nodemailer.createTransport({
      host: 'mail.lezcom.cl', 
      port: 465,
      secure: true, 
      auth: {
        user: 'contacto@lezcom.cl',
        pass: 'Lezcom12#' // Reemplaza esto con la contraseña real del correo (mejor usar process.env.EMAIL_PASS)
      }
    });

    const mailOptions = {
      from: '"Web Lezcom" <contacto@lezcom.cl>', 
      to: 'contacto@lezcom.cl', 
      subject: `Nueva Cotización Web de: ${data.nombre}`,
      text: `
        Has recibido una nueva solicitud de cotización desde la página web:
        
        Nombre: ${data.nombre}
        Email: ${data.email}
        Teléfono: ${data.telefono}
        
        Detalle del Proyecto:
        ${data.detalle}
      `
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Contacto procesado con éxito' }, { status: 200 });
    
  } catch (error) {
    console.error("Error al procesar contacto:", error);
    return NextResponse.json({ error: 'Error al enviar el formulario' }, { status: 500 });
  }
}
