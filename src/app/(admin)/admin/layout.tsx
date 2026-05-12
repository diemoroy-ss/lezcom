import React from 'react';
import './admin.css';

export const metadata = {
  title: 'Lezcom - Admin Panel de Correos Masivos',
  description: 'Panel administrativo premium para control de campañas de correo masivo vía Brevo',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root">
      {children}
    </div>
  );
}
