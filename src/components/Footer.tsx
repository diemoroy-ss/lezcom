"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer className="seccion" style={{ backgroundColor: '#020617', color: '#94a3b8', textAlign: 'center' }}>
      <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '20px' }}>¿Listo para empezar tu proyecto?</h2>
      <p style={{ marginBottom: '40px', fontSize: '1.1rem' }}>Visita nuestra tienda en línea para ver productos en stock, o contáctanos para cotizaciones especiales.</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '50px' }}>
        <a href="https://store.lezcom.cl" className="btn-primario" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '14px 30px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>Ir a store.lezcom.cl</a>
        <Link 
          href="/contacto" 
          style={{ 
            backgroundColor: isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', 
            color: 'white', 
            padding: '14px 30px', 
            borderRadius: '6px', 
            border: '1px solid rgba(255,255,255,0.2)', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '1rem', 
            transition: '0.3s',
            textDecoration: 'none',
            display: 'inline-block'
          }} 
          onMouseOver={() => setIsHovered(true)} 
          onMouseOut={() => setIsHovered(false)}
        >
          Solicitar Cotización
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px', fontSize: '0.95rem' }}>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Inicio</Link>
        <span>•</span>
        <Link href="/blog" style={{ color: '#94a3b8', textDecoration: 'none' }}>Blog IA</Link>
        <span>•</span>
        <Link href="/contacto" style={{ color: '#94a3b8', textDecoration: 'none' }}>Contacto</Link>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
        <div>&copy; {new Date().getFullYear()} Lezcom Spa. Todos los derechos reservados.</div>
        <div>
          <span style={{ opacity: 0.7 }}>
            sitio web desarrollado con IA con amor ❤️ por <a href="https://www.santisoft.cl" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>www.santisoft.cl</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
