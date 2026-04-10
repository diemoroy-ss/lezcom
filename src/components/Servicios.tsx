import React from 'react';

export default function Servicios() {
  return (
    <section id="servicios" className="seccion" style={{ backgroundColor: '#0f172a', textAlign: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <span style={{ color: '#60a5fa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Nuestras Ventajas</span>
      <h2 style={{ fontSize: '2.5rem', color: '#ffffff', marginTop: '10px', marginBottom: '50px' }}>Por qué elegirnos</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {[
          { icon: '🛡️', title: 'Máxima Durabilidad', desc: 'Acero inoxidable de primer nivel, garantizando resistencia a la corrosión y el paso del tiempo.' },
          { icon: '⚙️', title: 'Precisión Industrial', desc: 'Cada corte y soldadura es realizado con rigor técnico para cumplir con los estándares más exigentes.' },
          { icon: '📐', title: 'Proyectos a Medida', desc: 'Diseñamos soluciones personalizadas que se adaptan exactamente a las necesidades de tu empresa o negocio.' }
        ].map((item, i) => (
          <div key={i} className="tarjeta-hover" style={{ padding: '40px 30px', backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#3b82f6' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '10px' }}>{item.title}</h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
