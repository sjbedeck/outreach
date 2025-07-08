import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './lib/supabaseClient';

// Log Supabase configuration for debugging
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing');
console.log('Supabase Client:', supabase ? 'Initialized' : 'Failed to initialize');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
