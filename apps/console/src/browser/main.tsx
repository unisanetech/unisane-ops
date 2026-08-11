import React from 'react';
import { createRoot } from 'react-dom/client';
import '@material-symbols/font-400/outlined.css';
import '@unisane/ui/styles.css';
import '@unisane/data-table/styles.css';
import './layout.css';
import { App } from './app.js';

const root = document.getElementById('app');
if (!root) throw new Error('[UNISANE_OPS_ROOT_MISSING] #app');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
