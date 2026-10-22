import React from 'react';
import ReactDOM from 'react-dom/client';
import { FeatureCard } from './components/FeatureCard/FeatureCard';
import './styles/global.css';

const cards = [
  { theme: 'violet', eyebrow: 'DESIGN SYSTEM', title: 'Build with confidence', description: 'Reusable components, accessible patterns and a consistent visual language.' },
  { theme: 'mint', eyebrow: 'PERFORMANCE', title: 'Make every pixel count', description: 'Thoughtful interactions and fast, responsive experiences for every screen.' },
  { theme: 'peach', eyebrow: 'ENGINEERING', title: 'Designed to scale', description: 'Modular frontend patterns that keep growing applications maintainable.' },
] as const;
const href = 'https://github.com/faezemoradi8993/pixelcraft-ui';
function App() {
  return <main className="page">
    <header className="pageHeader"><h1>PixelCraft UI <span>/ FeatureCard</span></h1><p>Independent Figma reference · 3 theme variants · React + TypeScript</p></header>
    <section className="cards" aria-label="FeatureCard theme variants">
      {cards.map(card => <FeatureCard key={card.theme} {...card} href={href} />)}
    </section>
    <section className="mobileReview" aria-label="Mobile reference">
      <h2>Mobile review · 320px</h2>
      <div className="mobileFrame"><FeatureCard {...cards[0]} href={href} /></div>
    </section>
    <footer className="footer">Independent portfolio demo · No proprietary assets or source code</footer>
  </main>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);