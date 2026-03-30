import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminSetup from './pages/AdminSetup';
import { clearSession } from './services/odooApi';
import { ODOO_CONFIG, saveConfig, updateLiveConfig } from './config/odoo';
import './App.css';

// ── Intercept Magic Links (Token) before rendering ──
const urlParams = new URLSearchParams(window.location.search);
const tokenParam = urlParams.get('token');
if (tokenParam) {
  try {
    // Decode Base64 safely (using decodeURIComponent + escape to handle UTF-8 if needed, 
    // but the setup will generate basic ASCII base64 for URLs anyway)
    const newConfig = JSON.parse(atob(tokenParam));
    if (newConfig.db && newConfig.apiKey) {
      saveConfig(newConfig);
      updateLiveConfig(); // Update in-memory
      // Clean up the URL without reloading the entire page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (err) {
    console.error('Invalid Magic Link Token:', err);
  }
}

const STORAGE_KEY = 'fe_employee';

export default function App() {
  // Check if system is configured (Odoo details provided)
  const isConfigured = Boolean(ODOO_CONFIG.db && ODOO_CONFIG.apiKey);

  const [employee, setEmployee] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (emp) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emp)); 
    setEmployee(emp);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);                   
    clearSession();
    setEmployee(null);
  };

  // 1. If no Odoo configuration found in storage -> Show Setup
  if (!isConfigured) {
    return <AdminSetup />;
  }

  // 2. Otherwise flow normal Employee App
  return employee
    ? <Dashboard employee={employee} onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />;
}
