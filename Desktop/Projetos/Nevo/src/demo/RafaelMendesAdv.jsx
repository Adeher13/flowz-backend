import { useEffect, useState } from 'react';
import './RafaelMendesAdv.css';

const WHATSAPP = 'https://wa.me/5511999999999?text=Olá%20Dr.%20Rafael!%20Gostaria%20de%20uma%20consulta.';

const areas = [
  { icon: '⚖️', title: 'Direito Civil', desc: 'Contratos, responsabilidade civil, cobranças e reparação de danos com atuação estratégica e personalizada.' },
  { icon: '🏭', title: 'Direito Trabalhista', desc: 'Defesa de empregados e empresas em ações trabalhistas, rescisões, horas extras e assédio moral.' },
  { icon: '🏢', title: 'Direito Empresarial', desc: 'Constituição e dissolução de empresas, contratos societários, recuperação judicial e fusões.' },
  { icon: '👨‍👩‍👧', title: 'Direito de Família', desc: 'Divórcio, guarda, alimentos, inventário e planejamento patrimonial com sensibilidade e discrição.' },
  { icon: '🔐', title: 'Direito Criminal', desc: 'Defesa criminal especializada em todas as fases do processo, do inquérito ao tribunal.' },
  { icon: '🏠', title: 'Direito Imobiliário', desc: 'Compra e venda, locações, usucapião, regularização de imóveis e contratos de financiamento.' },
];

const depoimentos = [
  { nome: 'Carlos Eduardo Barros', texto: 'O Dr. Rafael conduziu meu processo trabalhista com maestria. Em menos de 8 meses, obtivemos um acordo excelente. Profissionalismo e transparência do início ao fim.' },
  { nome: 'Fernanda Cristina Lopes', texto: 'Precisei de assessoria jurídica para abrir minha empresa. O escritório cuidou de tudo: contrato social, registros e licenças. Recomendo com toda a confiança.' },
  { nome: 'Roberto Augusto Meirelles', texto: 'Após um acidente, fui indicado ao Dr. Rafael para ação de indenização. O resultado superou minhas expectativas. Um profissional de altíssimo nível.' },
];

export default function RafaelMendesAdv() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Dr. Rafael Mendes — Advogado | São Paulo';
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="rm-root">

      {/* NAVBAR */}
      <nav className={`rm-nav ${scrolled ? 'rm-nav-scrolled' : ''}`}>
        <div className="rm-nav-inner">
          <div className="rm-logo">
            <span className="rm-logo-mark">M&amp;A</span>
            <div className="rm-logo-text">
              <strong>Mendes &amp; Associados</strong>
              <span>Advocacia</span>
            </div>
          </div>
          <div className="rm-nav-links">
            <a href="#areas">Áreas</a>
            <a href="#sobre">Sobre</a>
            <a href="#depoimentos">Casos</a>
            <a href="#contato">Contato</a>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-btn-nav">
            Consulta gratuita
          </a>
          <button className="rm-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="rm-mobile-menu">
            <a href="#areas" onClick={() => setMenuOpen(false)}>Áreas</a>
            <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)}>Casos</a>
            <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-btn-nav" onClick={() => setMenuOpen(false)}>
              Consulta gratuita
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="rm-hero">
        <div className="rm-hero-bg" aria-hidden="true" />
        <div className="rm-hero-inner">
          <div className="rm-hero-left">
            <div className="rm-hero-eyebrow">
              <span className="rm-eyebrow-line" />
              <span>OAB/SP 123.456 · São Paulo</span>
            </div>
            <h1>
              Defendemos seus direitos<br />
              com <em>excelência</em><br />
              e dedicação.
            </h1>
            <p className="rm-hero-subtitle">
              Mais de 15 anos de atuação estratégica em defesa dos seus interesses — com rigor, ética e resultados comprovados.
            </p>
            <div className="rm-hero-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-btn-primary">
                Consulta gratuita
              </a>
              <a href="#areas" className="rm-btn-ghost">Nossas áreas</a>
            </div>
            <div className="rm-stats">
              <div className="rm-stat">
                <strong>+15</strong>
                <span>Anos de experiência</span>
              </div>
              <div className="rm-stat-divider" />
              <div className="rm-stat">
                <strong>+800</strong>
                <span>Casos encerrados</span>
              </div>
              <div className="rm-stat-divider" />
              <div className="rm-stat">
                <strong>6</strong>
                <span>Áreas de atuação</span>
              </div>
            </div>
          </div>
          <div className="rm-hero-right">
            <div className="rm-photo-placeholder" aria-label="Dr. Rafael Mendes">
              <div className="rm-photo-gradient" />
              <div className="rm-photo-overlay">
                <div className="rm-oab-badge">OAB/SP 123.456</div>
              </div>
            </div>
          </div>
        </div>
        <div className="rm-hero-scroll-line" aria-hidden="true" />
      </section>

      {/* ÁREAS DE ATUAÇÃO */}
      <section className="rm-section rm-section-dark" id="areas">
        <div className="rm-container">
          <div className="rm-section-head">
            <span className="rm-badge">Áreas de Atuação</span>
            <h2>Excelência jurídica em <em>cada área</em></h2>
            <p className="rm-section-desc">
              Atuamos com profundidade técnica e visão estratégica nas principais áreas do direito, sempre com foco no resultado para o cliente.
            </p>
          </div>
          <div className="rm-areas-grid">
            {areas.map((a, i) => (
              <div key={i} className="rm-area-card">
                <div className="rm-area-icon">{a.icon}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
                <div className="rm-area-line" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="rm-section" id="sobre">
        <div className="rm-container rm-sobre">
          <div className="rm-sobre-photo">
            <div className="rm-sobre-placeholder">
              <div className="rm-sobre-gradient" />
            </div>
            <div className="rm-sobre-badge">Dr. Rafael Mendes<span>OAB/SP 123.456</span></div>
          </div>
          <div className="rm-sobre-text">
            <span className="rm-badge">Sobre o Dr. Rafael</span>
            <h2>Tradição e <em>autoridade</em><br />no direito paulista</h2>
            <p>
              O Dr. Rafael Mendes é formado pela <strong>Faculdade de Direito da USP</strong> e possui pós-graduação em Direito Empresarial pela <strong>FGV Direito SP</strong>. Com mais de 15 anos de atuação, fundou o escritório Mendes &amp; Associados com a missão de oferecer advocacia de excelência com atendimento personalizado.
            </p>
            <p>
              Reconhecido por sua abordagem <strong>estratégica e resolutiva</strong>, o Dr. Rafael acredita que cada cliente merece atenção dedicada e orientação clara — desde a consulta inicial até a conclusão do caso.
            </p>
            <div className="rm-credenciais">
              <div className="rm-credencial">Graduado em Direito — Faculdade de Direito da USP</div>
              <div className="rm-credencial">Pós-graduação em Direito Empresarial — FGV Direito SP</div>
              <div className="rm-credencial">Membro da OAB/SP — Comissão de Direito Civil</div>
              <div className="rm-credencial">+800 casos concluídos com êxito</div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-btn-primary rm-sobre-cta">
              Agendar consulta gratuita
            </a>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="rm-section rm-section-dark" id="depoimentos">
        <div className="rm-container">
          <div className="rm-section-head">
            <span className="rm-badge">Depoimentos</span>
            <h2>O que nossos <em>clientes</em> dizem</h2>
          </div>
          <div className="rm-depoimentos">
            {depoimentos.map((d, i) => (
              <div key={i} className="rm-depoimento">
                <div className="rm-depoimento-aspas">"</div>
                <p>{d.texto}</p>
                <div className="rm-depoimento-stars">★★★★★</div>
                <strong>— {d.nome}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section className="rm-section" id="contato">
        <div className="rm-container rm-contato">
          <div className="rm-contato-text">
            <span className="rm-badge">Localização</span>
            <h2>Onde nos <em>encontrar</em></h2>
            <div className="rm-contato-info">
              <div className="rm-contato-item">
                <div className="rm-contato-icon">📍</div>
                <div>
                  <strong>Endereço</strong>
                  <p>Av. Paulista, 1374 — 8º andar<br />Bela Vista, São Paulo — SP</p>
                </div>
              </div>
              <div className="rm-contato-item">
                <div className="rm-contato-icon">📞</div>
                <div>
                  <strong>Telefone &amp; WhatsApp</strong>
                  <p>(11) 99999-9999<br />Atendimento de segunda a sexta</p>
                </div>
              </div>
              <div className="rm-contato-item">
                <div className="rm-contato-icon">🕐</div>
                <div>
                  <strong>Horário</strong>
                  <p>Segunda a Sexta: 9h às 18h<br />Sábados com agendamento prévio</p>
                </div>
              </div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-btn-primary">
              Falar pelo WhatsApp
            </a>
          </div>
          <div className="rm-mapa">
            <iframe
              title="Mendes & Associados — Av. Paulista, São Paulo"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.09!2d-46.6543!3d-23.5646!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzUyLjYiUyA0NsKwMzknMTUuNSJX!5e0!3m2!1spt-BR!2sbr!4v1"
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
      <section className="rm-cta">
        <div className="rm-cta-inner">
          <div className="rm-cta-decoration" aria-hidden="true" />
          <div className="rm-cta-content">
            <span className="rm-badge rm-badge-light">Consulta gratuita</span>
            <h2>"O direito é a arte do bem e da equidade.<br /><em>Seu caso merece o melhor.</em>"</h2>
            <p>— Dr. Rafael Mendes · OAB/SP 123.456</p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-btn-primary rm-btn-large">
              Solicitar consulta gratuita
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="rm-footer">
        <div className="rm-footer-inner">
          <div className="rm-footer-brand">
            <div className="rm-footer-logo">
              <span className="rm-logo-mark">M&amp;A</span>
              <div>
                <strong>Mendes &amp; Associados</strong>
                <span>Advocacia</span>
              </div>
            </div>
            <p>Advocacia de excelência com mais de 15 anos de experiência. Atendimento personalizado em São Paulo e região.</p>
            <div className="rm-social-links">
              <a href="#" aria-label="LinkedIn" className="rm-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rm-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="rm-footer-col">
            <h4>Endereço</h4>
            <p>Av. Paulista, 1374 — 8º andar<br />Bela Vista, São Paulo — SP</p>
            <p style={{ marginTop: '0.75rem' }}>(11) 99999-9999</p>
          </div>
          <div className="rm-footer-col">
            <h4>Navegação</h4>
            <a href="#areas">Áreas de Atuação</a>
            <a href="#sobre">Sobre o Dr. Rafael</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Consulta gratuita</a>
          </div>
        </div>
        <div className="rm-footer-bottom">
          <p>© 2025 Mendes &amp; Associados — Dr. Rafael Mendes OAB/SP 123.456</p>
          <p>Site desenvolvido por <strong>Nevo Soluções</strong></p>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rm-whatsapp-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  );
}
