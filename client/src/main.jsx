import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminDataProvider } from './context/AdminContext.jsx';
import { ClientDataProvider } from './context/ClientContext.jsx';
import './index.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <AuthProvider>
    <AdminDataProvider>
      <ClientDataProvider>
        <App />
      </ClientDataProvider>
    </AdminDataProvider>
  </AuthProvider>
);
