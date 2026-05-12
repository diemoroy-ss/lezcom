"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
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

export default function BlogPostDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!slug) return;

    async function loadPostData() {
      const db = getDb();
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        // Query post by slug
        const q = query(
          collection(db, "blogs"),
          where("slug", "==", slug),
          where("publicado", "==", true),
          limit(1)
        );
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setPost(null);
        } else {
          const doc = snap.docs[0];
          setPost({ id: doc.id, ...doc.data() } as BlogPost);
        }

        // Query recent posts to display as suggestions (filtered in-memory to prevent index errors)
        const recentQ = query(
          collection(db, "blogs"),
          where("publicado", "==", true)
        );
        const recentSnap = await getDocs(recentQ);
        const recentList: BlogPost[] = [];
        recentSnap.forEach((d) => {
          const data = { id: d.id, ...d.data() } as BlogPost;
          if (data.slug !== slug) {
            recentList.push(data);
          }
        });
        setRecentPosts(recentList.slice(0, 3));

      } catch (err) {
        console.error("Error loading blog details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPostData();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid rgba(59,130,246,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
        <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "600" }}>Cargando artículo...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "80px 5%", textAlign: "center" }}>
        <div style={{ maxWidth: "500px", margin: "100px auto" }}>
          <span style={{ fontSize: "3.5rem" }}>🤔</span>
          <h2 style={{ fontSize: "1.8rem", color: "#0f172a", fontWeight: "800", marginTop: "20px" }}>Artículo no encontrado</h2>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: "12px 0 30px" }}>El artículo que estás buscando no existe o ha sido despublicado.</p>
          <Link href="/blog" style={{ backgroundColor: "#3b82f6", color: "white", padding: "12px 25px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
            ⬅️ Volver al Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* SECCIÓN ARTÍCULO */}
      {/* CONTENEDOR FLEX PRINCIPAL */}
      <div className="blog-flex-container" style={{ display: "flex", gap: "40px", maxWidth: "1200px", margin: "0 auto", padding: "40px 5% 80px 5%" }}>
        
        {/* COLUMNA IZQUIERDA: CONTENIDO DEL ARTÍCULO (70%) */}
        <article style={{ flex: "2.3 1 0%", minWidth: "0px" }}>
          {/* Enlace Volver */}
          <Link 
            href="/blog" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px", 
              fontSize: "0.9rem", 
              color: "#64748b", 
              textDecoration: "none", 
              fontWeight: "bold",
              marginBottom: "30px",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#3b82f6"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
          >
            ⬅️ Volver a todos los artículos
          </Link>

          {/* Metadatos */}
          <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "12px" }}>
            <span>📅 {post.fecha ? new Date(post.fecha.seconds ? post.fecha.seconds * 1000 : post.fecha).toLocaleDateString("es-CL") : ""}</span>
            <span>•</span>
            <span>⏱️ {post.leido}</span>
          </div>

          {/* Título Principal */}
          <h1 
            style={{ 
              fontSize: "clamp(2rem, 4vw, 2.8rem)", 
              fontWeight: "800", 
              color: "#0f172a", 
              lineHeight: "1.2", 
              margin: "0 0 20px 0" 
            }}
          >
            {post.titulo}
          </h1>

          {/* Resumen */}
          <p 
            style={{ 
              fontSize: "1.1rem", 
              lineHeight: "1.6", 
              color: "#475569", 
              fontStyle: "italic", 
              margin: "0 0 35px 0",
              borderLeft: "4px solid #3b82f6",
              paddingLeft: "16px"
            }}
          >
            {post.resumen}
          </p>

          {/* Imagen principal */}
          {post.imagen && (
            <div 
              style={{ 
                width: "100%", 
                height: "clamp(200px, 40vh, 380px)", 
                borderRadius: "12px", 
                overflow: "hidden", 
                marginBottom: "40px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)"
              }}
            >
              <img 
                src={post.imagen} 
                alt={post.titulo} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={(e: any) => {
                  e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80";
                }}
              />
            </div>
          )}

          {/* Contenido HTML del Blog */}
          <div 
            className="blog-post-content"
            dangerouslySetInnerHTML={{ __html: post.contenido }}
            style={{
              fontSize: "1.025rem",
              lineHeight: "1.8",
              color: "#334155",
              textAlign: "justify"
            }}
          />

          {/* Etiquetas / Keywords */}
          {post.keywords && (
            <div style={{ marginTop: "50px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", marginRight: "10px" }}>
                Palabras Clave:
              </span>
              <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {post.keywords.split(",").map((kw, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      backgroundColor: "#f1f5f9", 
                      color: "#475569", 
                      fontSize: "0.8rem", 
                      padding: "4px 12px", 
                      borderRadius: "20px", 
                      fontWeight: "500" 
                    }}
                  >
                    #{kw.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* COLUMNA DERECHA: SIDEBAR DE BLOG (30%) */}
        <aside className="blog-sidebar" style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "30px", minWidth: "280px" }}>
          
          {/* Tarjeta: Entradas Anteriores (Miniaturas) */}
          {recentPosts.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(15, 23, 42, 0.02)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: "0 0 16px 0", borderBottom: "2px solid #3b82f6", paddingBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📰 Otras Publicaciones
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {recentPosts.map((rPost) => (
                  <div key={rPost.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Miniatura Circular */}
                    <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, backgroundColor: "#e2e8f0" }}>
                      <img 
                        src={rPost.imagen} 
                        alt={rPost.titulo} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        onError={(e: any) => {
                          e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=150&q=80";
                        }}
                      />
                    </div>
                    {/* Detalles */}
                    <div style={{ minWidth: "0px" }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: "700", margin: "0 0 4px 0", lineHeight: "1.3", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        <Link href={`/blog/${rPost.slug}`} style={{ textDecoration: "none", color: "#0f172a", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#3b82f6"} onMouseLeave={(e) => e.currentTarget.style.color = "#0f172a"}>
                          {rPost.titulo}
                        </Link>
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>⏱️ {rPost.leido}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarjeta: CTA Fabricante Local */}
          <div style={{ backgroundColor: "#0f172a", backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(15,23,42,0.08)" }}>
            <span style={{ color: "#3b82f6", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>¿Tienes un Proyecto?</span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#ffffff", margin: "0 0 10px 0", lineHeight: "1.3" }}>
              Fabricación Local a Medida
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.825rem", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              En Lezcom SpA diseñamos y fabricamos muebles comerciales y técnicos de acero inoxidable grado quirúrgico con entrega garantizada.
            </p>
            <Link 
              href="/contacto"
              style={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                textDecoration: "none",
                display: "inline-block",
                textAlign: "center",
                width: "100%",
                boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              📞 Solicitar Presupuesto
            </Link>
          </div>

        </aside>

      </div>

      {/* ARTÍCULOS SUGERIDOS */}
      {recentPosts.length > 0 && (
        <section style={{ padding: "60px 5%", maxWidth: "1200px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0f172a", marginBottom: "30px", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
            Artículos Recomendados
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
            {recentPosts.map((rPost) => (
              <div 
                key={rPost.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.02)",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ height: "160px", width: "100%", overflow: "hidden" }}>
                  <img src={rPost.imagen} alt={rPost.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: "bold", margin: "0 0 10px 0", lineHeight: "1.4" }}>
                      <Link href={`/blog/${rPost.slug}`} style={{ textDecoration: "none", color: "#0f172a" }}>
                        {rPost.titulo}
                      </Link>
                    </h4>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 16px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {rPost.resumen}
                    </p>
                  </div>
                  <Link href={`/blog/${rPost.slug}`} style={{ fontSize: "0.85rem", color: "#3b82f6", fontWeight: "bold", textDecoration: "none" }}>
                    Leer Artículo ➔
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estilos CSS embebidos para dar formato rico al HTML generado */}
      <style jsx global>{`
        @media (max-width: 991px) {
          .blog-flex-container {
            flex-direction: column !important;
          }
          .blog-sidebar {
            width: 100% !important;
            margin-top: 40px !important;
          }
        }
        .blog-post-content h2 {
          font-size: 1.6rem;
          color: #0f172a;
          font-weight: 800;
          margin: 35px 0 15px;
          line-height: 1.3;
        }
        .blog-post-content h3 {
          font-size: 1.3rem;
          color: #1e293b;
          font-weight: 700;
          margin: 25px 0 12px;
          line-height: 1.3;
        }
        .blog-post-content p {
          margin: 0 0 20px;
          color: #334155;
          line-height: 1.8;
        }
        .blog-post-content ul, .blog-post-content ol {
          margin: 0 0 24px;
          padding-left: 24px;
        }
        .blog-post-content li {
          margin-bottom: 8px;
          color: #334155;
        }
        .blog-post-content strong {
          color: #0f172a;
          font-weight: 700;
        }
        .blog-post-content blockquote {
          margin: 30px 0;
          padding: 16px 24px;
          border-left: 4px solid #3b82f6;
          background-color: #f0fdf4;
          font-style: italic;
          color: #1e293b;
        }
        .blog-post-content blockquote p {
          margin: 0;
        }
      `}</style>

    </div>
  );
}
