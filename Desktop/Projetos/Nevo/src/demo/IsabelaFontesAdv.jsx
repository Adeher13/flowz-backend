import { useEffect, useState } from 'react';
import './IsabelaFontesAdv.css';

const WHATSAPP = 'https://wa.me/5521999999999?text=Olá%20Dra.%20Isabela!%20Gostaria%20de%20agendar%20uma%20consulta.';

const areas = [
  { num: '01', title: 'Direito de Família', desc: 'Assessoria jurídica completa em todos os conflitos familiares, com sensibilidade e determinação para proteger seus direitos.' },
  { num: '02', title: 'Divórcio', desc: 'Divórcio consensual ou litigioso com acompanhamento humanizado, garantindo partilha justa e proteção patrimonial.' },
  { num: '03', title: 'Pensão Alimentícia', desc: 'Fixação, revisão e execução de alimentos para filhos e ex-cônjuges, com agilidade e eficiência processual.' },
  { num: '04', title: 'Guarda de Filhos', desc: 'Guarda unilateral, compartilhada e internacional — sempre priorizando o melhor interesse da criança.' },
  { num: '05', title: 'Inventário & Herança', desc: 'Inventário judicial e extrajudicial, partilha de bens e planejamento sucessório para proteger seu patrimônio.' },
  { num: '06', title: 'Direito da Mulher', desc: 'Defesa integral dos direitos da mulher: violência doméstica, Lei Maria da Penha, medidas protetivas e indenizações.' },
];

const depoimentos = [
  { nome: 'Mariana Cavalcante', texto: 'A Dra. Isabela cuidou do meu processo de divórcio com uma competência e delicadeza que eu jamais esperava. Ela me fez sentir segura em cada etapa. Sou eternamente grata.' },
  { nome: 'Tatiana Rocha de Souza', texto: 'Minha batalha pela guarda dos meus filhos foi árdua, mas a Dra. Isabela esteve ao meu lado em cada audiência. Conquistamos a guarda compartilhada. Uma advogada brilhante.' },
  { nome: 'Renata Esteves Maia', texto: 'Precisei de ajuda urgente com uma medida protetiva. A resposta foi imediata e o resultado, impecável. Profissional altamente capacitada e de absoluta confiança.' },
];

export default function IsabelaFontesAdv() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Dra. Isabela Fontes — Advogada | Rio de Janeiro';
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="if-root">

      {/* NAVBAR */}
      <nav className={`if-nav ${scrolled ? 'if-nav-scrolled' : ''}`}>
        <div className="if-nav-inner">
          <div className="if-logo">
            <div className="if-logo-monogram">IF</div>
            <div className="if-logo-text">
              <strong>Isabela Fontes</strong>
              <span>Advocacia</span>
            </div>
          </div>
          <div className="if-nav-links">
            <a href="#areas">Áreas</a>
            <a href="#sobre">Sobre</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#contato">Contato</a>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-btn-nav">
            Agendar consulta
          </a>
          <button className="if-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="if-mobile-menu">
            <a href="#areas" onClick={() => setMenuOpen(false)}>Áreas</a>
            <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)}>Depoimentos</a>
            <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-btn-nav" onClick={() => setMenuOpen(false)}>
              Agendar consulta
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="if-hero">
        <div className="if-hero-bg" aria-hidden="true" />
        <div className="if-hero-inner">
          <div className="if-hero-left">
            <div className="if-hero-eyebrow">
              <span className="if-eyebrow-dot" />
              <span>OAB/RJ 98.765 · Rio de Janeiro</span>
            </div>
            <h1>
              Sua segurança jurídica<br />
              é a nossa<br />
              <em>prioridade.</em>
            </h1>
            <p className="if-hero-subtitle">
              Advocacia especializada em Direito de Família com sensibilidade, rigor técnico e dedicação total a cada cliente.
            </p>
            <div className="if-hero-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-btn-primary">
                Agendar consulta
              </a>
              <a href="#areas" className="if-btn-ghost">Nossas especialidades</a>
            </div>
            <div className="if-stats">
              <div className="if-stat">
                <strong>+12</strong>
                <span>Anos de experiência</span>
              </div>
              <div className="if-stat-divider" />
              <div className="if-stat">
                <strong>+600</strong>
                <span>Famílias atendidas</span>
              </div>
              <div className="if-stat-divider" />
              <div className="if-stat">
                <strong>100%</strong>
                <span>Dedicação</span>
              </div>
            </div>
          </div>
          <div className="if-hero-right">
            <div className="if-hero-frame">
              <div className="if-photo-placeholder">
                <div className="if-photo-bg" />
              </div>
              <div className="if-hero-card">
                <p>Dra. Isabela Fontes</p>
                <span>OAB/RJ 98.765</span>
              </div>
              <div className="if-hero-ornament" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* ÁREAS */}
      <section className="if-section if-section-rose" id="areas">
        <div className="if-container">
          <div className="if-section-head">
            <span className="if-badge">Especialidades</span>
            <h2>Áreas em que <em>atuamos</em></h2>
            <p className="if-section-desc">
              Especialização profunda em Direito de Família e áreas correlatas, com atendimento humanizado e resultados que transformam vidas.
            </p>
          </div>
          <div className="if-areas-grid">
            {areas.map((a, i) => (
              <div key={i} className="if-area-card">
                <div className="if-area-num">{a.num}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
                <div className="if-area-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="if-section" id="sobre">
        <div className="if-container if-sobre">
          <div className="if-sobre-visual">
            <div className="if-sobre-photo">
              <div className="if-sobre-bg" />
            </div>
            <div className="if-sobre-quote">
              <p>"O direito de família exige técnica e coração — eu ofereço os dois."</p>
              <span>— Dra. Isabela Fontes</span>
            </div>
          </div>
          <div className="if-sobre-text">
            <span className="if-badge">Sobre a Dra. Isabela</span>
            <h2>Referência em<br /><em>Direito de Família</em><br />no Rio de Janeiro</h2>
            <p>
              A Dra. Isabela Fontes é especialista em Direito de Família, formada pela <strong>Universidade do Estado do Rio de Janeiro (UERJ)</strong> com pós-graduação em Direito de Família e Sucessões pela <strong>PUC-Rio</strong>. Ao longo de mais de 12 anos de carreira, construiu uma trajetória de excelência jurídica e impacto humano real.
            </p>
            <p>
              Fundou o escritório <strong>Isabela Fontes Advocacia</strong> com a convicção de que cada família merece uma defesa sensível, técnica e estratégica — especialmente nos momentos mais delicados da vida.
            </p>
            <div className="if-credenciais">
              <div className="if-credencial">Graduada em Direito — UERJ</div>
              <div className="if-credencial">Pós-graduação em Direito de Família e Sucessões — PUC-Rio</div>
              <div className="if-credencial">Membro da OAB/RJ — Comissão de Direito de Família</div>
              <div className="if-credencial">Palestrante em congressos jurídicos sobre Direito da Mulher</div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-btn-primary if-sobre-cta">
              Agendar consulta
            </a>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="if-section if-section-rose" id="depoimentos">
        <div className="if-container">
          <div className="if-section-head">
            <span className="if-badge">Depoimentos</span>
            <h2>Histórias de quem <em>confiou</em> em nós</h2>
          </div>
          <div className="if-depoimentos">
            {depoimentos.map((d, i) => (
              <div key={i} className="if-depoimento">
                <div className="if-depoimento-top">
                  <div className="if-depoimento-avatar">
                    {d.nome.split(' ')[0][0]}{d.nome.split(' ')[1]?.[0] || ''}
                  </div>
                  <div>
                    <strong className="if-depoimento-nome">{d.nome}</strong>
                    <div className="if-depoimento-stars">★★★★★</div>
                  </div>
                </div>
                <p>"{d.texto}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section className="if-section" id="contato">
        <div className="if-container if-contato">
          <div className="if-contato-text">
            <span className="if-badge">Contato &amp; Localização</span>
            <h2>Estamos aqui<br />para <em>te ajudar</em></h2>
            <p className="if-contato-intro">
              Agende sua consulta e dê o primeiro passo para resolver sua situação com segurança e tranquilidade.
            </p>
            <div className="if-contato-info">
              <div className="if-contato-item">
                <div className="if-contato-icon">📍</div>
                <div>
                  <strong>Endereço</strong>
                  <p>Rua do Ouvidor, 60 — 12º andar<br />Centro, Rio de Janeiro — RJ</p>
                </div>
              </div>
              <div className="if-contato-item">
                <div className="if-contato-icon">📱</div>
                <div>
                  <strong>WhatsApp</strong>
                  <p>(21) 99999-9999<br />Atendimento de segunda a sexta</p>
                </div>
              </div>
              <div className="if-contato-item">
                <div className="if-contato-icon">🕐</div>
                <div>
                  <strong>Horário</strong>
                  <p>Segunda a Sexta: 9h às 18h<br />Consultas também por videoconferência</p>
                </div>
              </div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-btn-primary">
              Agendar pelo WhatsApp
            </a>
          </div>
          <div className="if-mapa">
            <iframe
              title="Isabela Fontes Advocacia — Rio de Janeiro"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.28!2d-43.1755!3d-22.9041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDU0JzE0LjgiUyA0M8KwMTAnMzEuOCJX!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="380"
              style={{ border: 0, borderRadius: '16px', display: 'block' }}
              allowFullScreen=""
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="if-cta">
        <div className="if-cta-inner">
          <div className="if-cta-ornament-left" aria-hidden="true" />
          <div className="if-cta-ornament-right" aria-hidden="true" />
          <div className="if-cta-content">
            <span className="if-badge">Primeiro passo</span>
            <h2>Você não precisa<br />enfrentar isso <em>sozinha.</em></h2>
            <p>Fale com a Dra. Isabela Fontes — OAB/RJ 98.765 — e encontre a solução que você merece.</p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-btn-primary if-btn-large">
              Agendar consulta gratuita
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="if-footer">
        <div className="if-footer-inner">
          <div className="if-footer-brand">
            <div className="if-footer-logo">
              <div className="if-logo-monogram if-monogram-sm">IF</div>
              <div>
                <strong>Isabela Fontes Advocacia</strong>
                <span>OAB/RJ 98.765</span>
              </div>
            </div>
            <p>Advocacia especializada em Direito de Família com mais de 12 anos de experiência. Atendimento humanizado no Rio de Janeiro.</p>
            <div className="if-social-links">
              <a href="#" aria-label="Instagram" className="if-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="if-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="if-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="if-footer-col">
            <h4>Endereço</h4>
            <p>Rua do Ouvidor, 60 — 12º andar<br />Centro, Rio de Janeiro — RJ</p>
            <p style={{ marginTop: '0.75rem' }}>(21) 99999-9999</p>
          </div>
          <div className="if-footer-col">
            <h4>Navegação</h4>
            <a href="#areas">Áreas de Atuação</a>
            <a href="#sobre">Sobre a Dra. Isabela</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Agendar consulta</a>
          </div>
        </div>
        <div className="if-footer-bottom">
          <p>© 2025 Isabela Fontes Advocacia — Dra. Isabela Fontes OAB/RJ 98.765</p>
          <p>Site desenvolvido por <strong>Nevo Soluções</strong></p>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="if-whatsapp-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  );
}
