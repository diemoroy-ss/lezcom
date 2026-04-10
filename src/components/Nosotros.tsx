import React from 'react';

export default function Nosotros() {
  return (
    <section id="historia" className="seccion" style={{ backgroundColor: '#f1f5f9', minHeight: 'calc(100vh - 200px)' }}>
      <div className="historia-grid" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '50px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '20px' }}>Nuestra Historia</h2>
          <div style={{ width: '60px', height: '4px', backgroundColor: '#3b82f6', marginBottom: '25px', borderRadius: '2px' }}></div>
          <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '15px' }}>
            Lezcom Spa nació a partir de una visión clara: entender el acero inoxidable no solo como un material, sino como la base para crear estructuras sólidas, higiénicas y duraderas. Desde el primer día, el compromiso con la excelencia técnica y la calidad ha sido el motor que impulsa cada proyecto.
          </p>
          <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '15px' }}>
            Con el paso del tiempo, esa experiencia se ha fortalecido y hoy mira hacia el futuro con una nueva energía. La integración de una nueva generación al equipo marca un proceso de modernización y mejora continua, incorporando nuevas tecnologías y enfoques innovadores, sin perder la esencia que nos caracteriza.
          </p>
          <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.7' }}>
            Así, combinamos trayectoria y renovación para seguir ofreciendo soluciones confiables, eficientes y de alto estándar, asegurando que nuestro compromiso con la calidad trascienda el tiempo.
          </p>
        </div>
        <div className="historia-foto" style={{ flex: '1 1 400px', backgroundColor: '#ffffff', height: '350px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <img 
            src="https://res.cloudinary.com/dtrsycv80/image/upload/v1772212245/Diseño_sin_título_7_xcr1d5.png" 
            alt="Historia Lezcom Spa" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
      </div>
    </section>
  );
}
