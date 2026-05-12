"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  imagen: string;
  keywords: string;
  metaDescription: string;
  fecha: any;
  leido: string;
  publicado: boolean;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadPosts() {
      const db = getDb();
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "blogs"),
          where("publicado", "==", true),
          orderBy("fecha", "desc")
        );
        const snap = await getDocs(q);
        const list: BlogPost[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as BlogPost);
        });
        setPosts(list);
      } catch (err) {
        console.error("Error loading blog posts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts = posts.filter(
    (post) =>
      post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.resumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.keywords.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* HEADER SECTION */}
      <section 
        style={{ 
          padding: "80px 5% 60px 5%", 
          backgroundColor: "#0f172a", 
          backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white", 
          textAlign: "center" 
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <span 
            style={{ 
              color: "#3b82f6", 
              fontWeight: "bold", 
              textTransform: "uppercase", 
              letterSpacing: "1.5px", 
              fontSize: "0.85rem",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              padding: "6px 12px",
              borderRadius: "20px",
              display: "inline-block",
              marginBottom: "16px"
            }}
          >
            Blog de Ingeniería & Tendencias
          </span>
          <h1 
            style={{ 
              fontSize: "clamp(2rem, 4vw, 3.5rem)", 
              fontWeight: "800", 
              margin: "0 0 16px 0", 
              lineHeight: "1.2",
              color: "#ffffff"
            }}
          >
            Soluciones en <span style={{ color: "#cbd5e1" }}>Acero Inoxidable</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#94a3b8", lineHeight: "1.6", margin: "0 auto 30px auto" }}>
            Aprende sobre normativas de higiene, diseño gastronómico, fabricación industrial y consejos prácticos para maximizar la vida útil de tus estructuras metálicas.
          </p>

          {/* Barra de búsqueda integrada */}
          <div style={{ position: "relative", maxWidth: "500px", margin: "0 auto" }}>
            <input 
              type="text"
              placeholder="🔍 Buscar artículos..."
              style={{
                width: "100%",
                padding: "14px 20px 14px 45px",
                borderRadius: "30px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.07)",
                color: "#ffffff",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.3s, background-color 0.3s"
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6";
                e.target.style.backgroundColor = "rgba(255,255,255,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.backgroundColor = "rgba(255,255,255,0.07)";
              }}
            />
            <span style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}></span>
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <section style={{ padding: "60px 5%", maxWidth: "1200px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ backgroundColor: "#ffffff", borderRadius: "12px", height: "380px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <div style={{ height: "200px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite" }} />
                <div style={{ padding: "20px" }}>
                  <div style={{ height: "15px", backgroundColor: "#e2e8f0", width: "40%", marginBottom: "15px", borderRadius: "4px" }} />
                  <div style={{ height: "25px", backgroundColor: "#e2e8f0", width: "85%", marginBottom: "10px", borderRadius: "4px" }} />
                  <div style={{ height: "15px", backgroundColor: "#e2e8f0", width: "100%", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "16px" }}>🔍</span>
            <h3>No se encontraron artículos</h3>
            <p style={{ fontSize: "0.95rem" }}>Prueba buscando con otros términos.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
            {filteredPosts.map((post) => (
              <article 
                key={post.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(15, 23, 42, 0.03)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(15, 23, 42, 0.03)";
                }}
              >
                {/* Image */}
                <div style={{ height: "200px", width: "100%", overflow: "hidden", backgroundColor: "#e2e8f0" }}>
                  <img 
                    src={post.imagen} 
                    alt={post.titulo} 
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                    onError={(e: any) => {
                      e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#64748b", fontWeight: "600", marginBottom: "10px" }}>
                      <span>📅 {post.fecha ? new Date(post.fecha.seconds ? post.fecha.seconds * 1000 : post.fecha).toLocaleDateString("es-CL") : ""}</span>
                      <span>⏱️ {post.leido}</span>
                    </div>

                    <h3 style={{ fontSize: "1.2rem", color: "#0f172a", fontWeight: "800", margin: "0 0 10px 0", lineHeight: "1.4" }}>
                      <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                        {post.titulo}
                      </Link>
                    </h3>

                    <p style={{ fontSize: "0.875rem", color: "#475569", lineHeight: "1.6", marginBottom: "20px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {post.resumen}
                    </p>
                  </div>

                  <Link 
                    href={`/blog/${post.slug}`}
                    style={{ 
                      fontSize: "0.9rem", 
                      color: "#3b82f6", 
                      fontWeight: "bold", 
                      textDecoration: "none", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "6px" 
                    }}
                  >
                    Leer Artículo Completo ➔
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CTA BANNER */}
      <section style={{ padding: "80px 5%", backgroundColor: "#0f172a", color: "#ffffff", textAlign: "center" }}>
        <div style={{ maxWidth: "650px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "16px" }}>¿Tienes un proyecto en mente?</h2>
          <p style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "30px" }}>
            Somos fabricantes líderes de soluciones a medida en acero inoxidable. Contáctanos hoy para recibir una cotización personalizada y planos técnicos de tu diseño.
          </p>
          <Link 
            href="/contacto"
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "15px 35px",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              textDecoration: "none",
              display: "inline-block",
              boxShadow: "0 4px 15px rgba(59,130,246,0.4)",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            ✏️ Cotizar Proyecto
          </Link>
        </div>
      </section>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
