"use client";

import React, { useState } from 'react';

export default function Contacto() {
  const [enviando, setEnviando] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    detalle: '',
    archivo: null as File | null
  });

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    
    try {
      const respuesta = await fetch('/api/contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formulario),
      });

      if (respuesta.ok) {
        alert("¡Gracias por tu solicitud! Nos pondremos en contacto contigo a la brevedad.");
        setFormulario({ nombre: '', email: '', telefono: '', detalle: '', archivo: null });
      } else {
        alert("Hubo un problema al enviar el mensaje. Por favor intenta más tarde.");
      }
    } catch (error) {
      alert("Error de conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section id="contacto" className="seccion" style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Contáctanos</span>
          <h2 style={{ fontSize: '2.5rem', color: '#0f172a', marginTop: '10px' }}>Inicia tu Proyecto</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '15px auto 0 auto' }}>
            Déjanos tus datos, cuéntanos tu idea, o agenda una reunión directamente en nuestro calendario.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          
          {/* Formulario */}
          <div style={{ flex: '1 1 500px', backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.5rem' }}>Cuéntanos tu idea</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '25px' }}>Comenzaremos a trabajar en tu cotización pronto.</p>

            <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Nombre Completo *</label>
                <input required type="text" value={formulario.nombre} onChange={e => setFormulario({...formulario, nombre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Correo Electrónico *</label>
                <input required type="email" value={formulario.email} onChange={e => setFormulario({...formulario, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="ejemplo@correo.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Teléfono *</label>
                <input required type="tel" value={formulario.telefono} onChange={e => setFormulario({...formulario, telefono: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="+56 9 1234 5678" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>Detalle *</label>
                <textarea required rows={5} value={formulario.detalle} onChange={e => setFormulario({...formulario, detalle: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }} placeholder="Describe las medidas, material, tipo de proyecto..."></textarea>
              </div>

              <button type="submit" disabled={enviando} className="btn-primario" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '1.05rem', marginTop: '10px', cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}>
                {enviando ? 'Enviando...' : 'ENVIAR SOLICITUD'}
              </button>
            </form>
          </div>

          {/* Agendamiento Calendar */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.5rem' }}>Agenda una Reunión</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '25px' }}>Elige un horario disponible para que conversemos sobre tu proyecto al instante.</p>
            
            <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '400px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <iframe src="https://calendar.google.com/calendar/embed?src=spalezcom%40gmail.com&ctz=UTC" style={{ border: 0, width: '100%', height: '100%' }} frameBorder="0" scrolling="no"></iframe>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
