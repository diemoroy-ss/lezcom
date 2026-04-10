"use client";

import React, { useState, useRef } from 'react';

export default function Proyectos() {
  const [imagenIndex, setImagenIndex] = useState<number | null>(null);
  const carruselRef = useRef<HTMLDivElement>(null);
  const CLOUD_NAME = "dtrsycv80"; 

  const proyectosRealizados = [
    { id: '1', titulo: 'Proyecto Reciente', publicId: 'IMG_20260226_161122_l5dapr' },
    { id: '2', titulo: 'Estructuras Metálicas', publicId: 'proyecto_2' }, 
    { id: '3', titulo: 'Mobiliario Industrial', publicId: 'proyecto_3' },
    { id: '4', titulo: 'Cortes de Precisión', publicId: 'proyecto_4' },
    { id: '5', titulo: 'Barandas Especiales', publicId: 'proyecto_5' },
  ];

  const moverCarrusel = (direccion: 'izq' | 'der') => {
    if (carruselRef.current) {
      const { scrollLeft, clientWidth } = carruselRef.current;
      const scrollAmount = clientWidth * 0.8; 
      const scrollTo = direccion === 'izq' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      carruselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const verImagenAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagenIndex !== null) {
      setImagenIndex(imagenIndex === 0 ? proyectosRealizados.length - 1 : imagenIndex - 1);
    }
  };

  const verImagenSiguiente = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagenIndex !== null) {
      setImagenIndex((imagenIndex + 1) % proyectosRealizados.length);
    }
  };

  return (
    <>
      <section id="proyectos" className="seccion" style={{ backgroundColor: '#ffffff', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Nuestro Portafolio</span>
            <h2 style={{ fontSize: '2.5rem', color: '#0f172a', marginTop: '10px' }}>Proyectos Destacados</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '15px auto 0 auto' }}>
              Desliza para explorar la calidad y precisión de nuestros trabajos realizados para diversos sectores industriales.
            </p>
          </div>

          <div className="carrusel-contenedor" ref={carruselRef}>
            {proyectosRealizados.map((proy, index) => (
              <div key={proy.id} className="carrusel-item">
                <div 
                  className="carrusel-img-wrapper" 
                  onClick={() => setImagenIndex(index)}
                >
                  <img 
                    src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_600,h_500,q_auto,f_auto/v1/${proy.publicId}`} 
                    alt={proy.titulo}
                    className="carrusel-img"
                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/600x500/e2e8f0/64748b?text=Proyecto+Lezcom"; }}
                  />
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>{proy.titulo}</h3>
                  <div style={{ width: '40px', height: '3px', backgroundColor: '#3b82f6', margin: '10px auto 0 auto', borderRadius: '2px' }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="carrusel-botones">
            <button className="btn-carrusel" onClick={() => moverCarrusel('izq')} aria-label="Anterior">&#10094;</button>
            <button className="btn-carrusel" onClick={() => moverCarrusel('der')} aria-label="Siguiente">&#10095;</button>
          </div>
        </div>
      </section>

      {/* MODAL: IMAGEN AMPLIADA CON NAVEGACIÓN */}
      {imagenIndex !== null && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
          onClick={() => setImagenIndex(null)}
        >
          <div 
            style={{ position: 'relative', width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setImagenIndex(null)} 
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#ffffff', zIndex: 10 }}
            >
              ✕
            </button>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <button 
                onClick={verImagenAnterior}
                style={{ position: 'absolute', left: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: '0.3s' }}
              >
                &#10094;
              </button>

              <img 
                src={`https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/v1/${proyectosRealizados[imagenIndex].publicId}`} 
                alt={proyectosRealizados[imagenIndex].titulo} 
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
              />

              <button 
                onClick={verImagenSiguiente}
                style={{ position: 'absolute', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: '0.3s' }}
              >
                &#10095;
              </button>
            </div>

            <p style={{ color: 'white', marginTop: '15px', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>
              {proyectosRealizados[imagenIndex].titulo}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
