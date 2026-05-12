"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <nav className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* LOGO OFICIAL */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img 
          src="https://res.cloudinary.com/dtrsycv80/image/upload/v1772162241/My%20Brand/Sin_t%C3%ADtulo_500_x_262_px_zqnwah.png" 
          alt="Lezcom Spa Logo" 
          style={{ height: '45px', width: 'auto', objectFit: 'contain' }} 
        />
      </Link>

      {/* BOTÓN HAMBURGUESA (Solo visible en celular) */}
      <button 
        className="menu-toggle" 
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Abrir menú"
      >
        {menuAbierto ? '✕' : '☰'}
      </button>

      {/* ENLACES DEL MENÚ */}
      <div className={`nav-links ${menuAbierto ? 'abierto' : ''}`} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link href="/#proyectos" onClick={() => setMenuAbierto(false)} style={{ textDecoration: 'none', color: '#64748b', fontWeight: '600' }}>Proyectos</Link>
        <Link href="/#servicios" onClick={() => setMenuAbierto(false)} style={{ textDecoration: 'none', color: '#64748b', fontWeight: '600' }}>Servicios</Link>
        <Link href="/#historia" onClick={() => setMenuAbierto(false)} style={{ textDecoration: 'none', color: '#64748b', fontWeight: '600' }}>Nosotros</Link>
        <Link href="/blog" onClick={() => setMenuAbierto(false)} style={{ textDecoration: 'none', color: '#64748b', fontWeight: '600' }}>Blog</Link>
        <Link href="/contacto" onClick={() => setMenuAbierto(false)} style={{ textDecoration: 'none', color: '#64748b', fontWeight: '600' }}>Contacto</Link>
        <a 
          href="https://store.lezcom.cl" 
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primario"
          onClick={() => setMenuAbierto(false)}
          style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}
        >
          Tienda 🛒
        </a>
      </div>
    </nav>
  );
}
