import "./ai-factory-mobile-fix.css";
import "./lib/factory-settings";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento root não encontrado');

const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
