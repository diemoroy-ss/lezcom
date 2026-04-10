import React from 'react';
import Link from 'next/link';
import Proyectos from '@/components/Proyectos';
import Servicios from '@/components/Servicios';
import Nosotros from '@/components/Nosotros';

export default function Home() {
  return (
    <>
      {/* HERO SECTION */}
      <header className="seccion" style={{ textAlign: 'center', backgroundColor: '#1e293b', color: 'white', backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' }}>
        <h1 className="hero-titulo" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', margin: '0 0 20px 0', fontWeight: '800', lineHeight: '1.1' }}>
          Especialistas en <span style={{ color: '#cbd5e1' }}>Acero Inoxidable</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
          Diseñamos y fabricamos soluciones metálicas de alta durabilidad y precisión. 
          Calidad industrial y estética impecable para cada uno de tus proyectos.
        </p>
        <div className="hero-botones" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <a 
            href="/CatalogoLezcom.pdf" 
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primario"
            style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px 30px', fontSize: '1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' }}
          >
            📄 Ver Catálogo
          </a>
          <Link 
            href="/contacto"
            style={{ backgroundColor: 'transparent', color: '#f8fafc', border: '2px solid #64748b', padding: '13px 30px', fontSize: '1.1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', textDecoration: 'none', display: 'inline-block' }}
          >
            ✏️ Cotizar Proyecto
          </Link>
        </div>
      </header>
      
      <Proyectos />
      <Servicios />
      <Nosotros />
    </>
  );
}