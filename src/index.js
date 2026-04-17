import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { JobsProvider } from './context/JobsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <JobsProvider>
        <App />
      </JobsProvider>
    </AuthProvider>
  </React.StrictMode>
);
