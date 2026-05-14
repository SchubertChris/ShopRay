import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './sass/style.scss'; // WICHTIG: Hier wird das Stylesheet geladen
import { IMAGES } from './config/images';

// Bild-URLs als CSS Custom Properties ins Root-Element injizieren
// → kein Inline-Style in Komponenten nötig; SCSS liest diese Variablen direkt
const docRoot = document.documentElement;
if (IMAGES.hero.home) {
  docRoot.style.setProperty('--img-hero-home', `url(${IMAGES.hero.home})`);
  docRoot.style.setProperty('--img-hero-home-overlay', 'rgba(0,0,0,0.38)');
}
if (IMAGES.hero.about) {
  docRoot.style.setProperty('--img-hero-about', `url(${IMAGES.hero.about})`);
  docRoot.style.setProperty('--img-hero-about-overlay', 'rgba(0,0,0,0.38)');
}
if (IMAGES.hero.shop) {
  docRoot.style.setProperty('--img-hero-shop', `url(${IMAGES.hero.shop})`);
  docRoot.style.setProperty('--img-hero-shop-overlay', 'rgba(0,0,0,0.38)');
}
if (IMAGES.auth) {
  docRoot.style.setProperty('--img-auth', `url(${IMAGES.auth})`);
}

// Rechtsklick auf Bilder global sperren
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
