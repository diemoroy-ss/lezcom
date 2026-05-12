import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh" }}>
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
