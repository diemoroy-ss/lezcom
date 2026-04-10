"use client";

import React, { useState, useEffect, useRef } from 'react';

type Mensaje = {
  id: string;
  role: 'bot' | 'user';
  text: string;
};

export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 'init', role: 'bot', text: '¡Hola! 👋🏻 ¿En qué te podemos ayudar sobre tus proyectos de acero inoxidable?' }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, abierto]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTexto.trim()) return;

    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      role: 'user',
      text: inputTexto.trim()
    };

    const nuevosMensajes = [...mensajes, nuevoMensajeUsuario];
    setMensajes(nuevosMensajes);
    setInputTexto('');
    setCargando(true);

    try {
      // Llamada a nuestro endpoint interno, que a su vez llama al webhook de n8n
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pasamos el mensaje actual y todo el historial por si el bot (Evolution API) lo necesita para dar contexto
        body: JSON.stringify({ 
          mensaje: nuevoMensajeUsuario.text,
          historial: nuevosMensajes.map(m => ({ role: m.role, content: m.text }))
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const respuestaBot = data.respuesta || "Lo siento, no pude procesar eso correctamente.";
        
        setMensajes((prev) => [
          ...prev,
          { id: Date.now().toString() + 'bot', role: 'bot', text: respuestaBot }
        ]);
      } else {
        throw new Error("Error del servidor");
      }
    } catch (error) {
      console.error(error);
      setMensajes((prev) => [
        ...prev,
        { id: Date.now().toString() + 'err', role: 'bot', text: "Lo siento, estoy teniendo problemas de conexión en este momento. Por favor, contáctanos por WhatsApp." }
      ]);
    } finally {
      setCargando(false);
    }
  };

  const irAWhatsApp = () => {
    // Número oficial provisto
    const numero = "56986293496";
    const texto = encodeURIComponent("Hola, me gustaría conversar con un asesor comercial de Lezcom.");
    window.open(`https://wa.me/${numero}?text=${texto}`, '_blank');
  };

  return (
    <>
      {/* BOTÓN FLOTANTE O ICONO */}
      <div className="chat-widget-boton" onClick={() => setAbierto(!abierto)}>
        {abierto ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        )}
      </div>

      {/* PANEL DEL CHAT */}
      <div className={`chat-widget-panel ${abierto ? 'abierto' : 'cerrado'}`} aria-hidden={!abierto}>
        
        <div className="chat-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Soporte Lezcom</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Bot de asistencia</span>
          </div>
          <button onClick={() => setAbierto(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div className="chat-body">
          {mensajes.map((msg) => (
            <div key={msg.id} className={`mensaje ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          
          {cargando && (
            <div className="mensaje bot" style={{ fontStyle: 'italic', opacity: 0.7 }}>
              Escribiendo...
            </div>
          )}

          <div ref={mensajesEndRef} />
        </div>

        <div className="chat-footer">
          <form className="chat-form" onSubmit={enviarMensaje}>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Escribe tu mensaje..." 
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              disabled={cargando}
            />
            <button type="submit" className="chat-submit" disabled={!inputTexto.trim() || cargando}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>

          <button type="button" className="chat-whatsapp-btn" onClick={irAWhatsApp}>
            Hablar con un humano en WhatsApp
          </button>
        </div>

      </div>
    </>
  );
}
