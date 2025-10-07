import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AdminDataProvider } from './context/AdminContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // Import the AuthProvider
import './index.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(

  <AuthProvider>
    <AdminDataProvider>
      <App />
    </AdminDataProvider>
  </AuthProvider>

);
