const sections = ["Veille", "Réviser", "Copilote", "Lois", "Bibliothèque", "Progression"];
const symbols = ["◷", "▤", "✳", "§", "▦", "↗"];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#accueil" aria-label="Officier Watch, accueil">
          <span className="brand-mark">OW</span><span>OFFICIER <b>WATCH</b></span>
        </a>
        <div className="nav-label">ESPACE DE TRAVAIL</div>
        <nav aria-label="Navigation principale">
          <a className="nav-item active" href="#accueil"><span>⌂</span>Accueil</a>
          {sections.map((section, index) => <a className="nav-item" href="#bientot" key={section}><span>{symbols[index]}</span>{section}</a>)}
        </nav>
        <div className="sidebar-foot"><span className="status-dot" /> Espace personnel</div>
      </aside>

      <section className="main-area" id="accueil">
        <header className="topbar"><span>PRÉPARATION AU CONCOURS</span><button className="profile" aria-label="Profil utilisateur">C</button></header>
        <div className="content">
          <div className="eyebrow"><span className="status-dot" /> TON ESPACE DE PRÉPARATION</div>
          <h1>Bonjour <span className="wave">👋</span></h1>
          <p className="intro">Ta veille, tes connaissances et tes révisions réunies au même endroit.</p>

          <div className="hero-card">
            <div className="hero-copy"><span className="hero-kicker">TON RENDEZ-VOUS HEBDOMADAIRE</span><h2>Comprendre l’actualité.<br />Être prête à en parler.</h2><p>Les informations seront présentées avec leurs sources et leur statut de vérification.</p><span className="coming-pill">Première veille en préparation</span></div>
            <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core">OW</div><span className="spark spark-one">✳</span><span className="spark spark-two">✦</span></div>
          </div>

          <div className="section-heading"><div><span className="eyebrow muted">TON PARCOURS</span><h2>Tout pour avancer</h2></div><span className="subtle">Les modules s’ouvriront progressivement</span></div>
          <div className="module-grid">
            <article className="module-card"><span className="module-icon lilac">◷</span><div><h3>Veille</h3><p>Les actualités importantes, avec leurs sources.</p></div><span className="module-arrow">↗</span></article>
            <article className="module-card"><span className="module-icon peach">▤</span><div><h3>Réviser</h3><p>Fixe les notions grâce à des exercices courts.</p></div><span className="module-arrow">↗</span></article>
            <article className="module-card"><span className="module-icon mint">✳</span><div><h3>Copilote</h3><p>Pose tes questions à partir de contenus sourcés.</p></div><span className="module-arrow">↗</span></article>
            <article className="module-card"><span className="module-icon butter">§</span><div><h3>Lois & réformes</h3><p>Repère clairement le statut des textes juridiques.</p></div><span className="module-arrow">↗</span></article>
          </div>
          <footer className="trust-note"><span>✳</span><p><b>La fiabilité avant tout.</b> Chaque information devra renvoyer à une source consultable.</p></footer>
        </div>
      </section>
    </main>
  );
}
