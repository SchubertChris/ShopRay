import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './sass/style.scss';

document.addEventListener('contextmenu', (e) => {
  if ((e.target as HTMLElement).tagName === 'IMG') {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
