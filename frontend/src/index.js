import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Note: StrictMode disabled — it breaks @hello-pangea/dnd drag-and-drop
root.render(<App />);
