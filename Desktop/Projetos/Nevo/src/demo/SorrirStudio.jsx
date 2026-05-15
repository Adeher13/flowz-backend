import { useEffect, useState } from 'react';
import './SorrirStudio.css';

const WHATSAPP = 'https://wa.me/5511999999999?text=Olá%20Dr.%20Felipe!%20Gostaria%20de%20agendar%20uma%20avaliação.';

export default function SorrirStudio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Sorrir Studio — Odontologia Estética | São Paulo';
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="ss2-root">

      {/* NAVBAR */}
      <nav className={`ss2-nav ${scrolled ? 'ss2-nav-scrolled' : ''}`}>
        <div className="ss2-nav-inner">
          <div className="ss2-logo">
            <span className="ss2-logo-icon">✦</span>
            <span className="ss2-logo-text">Sorrir Studio</span>
          </div>
          <div className="ss2-nav-links">
            <a href="#tratamentos">Tratamentos</a>
            <a href="#sobre">Sobre</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#localizacao">Localização</a>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-btn-nav">
            Agendar avaliação
          </a>
          <button className="ss2-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="ss2-mobile-menu">
            <a href="#tratamentos" onClick={() => setMenuOpen(false)}>Tratamentos</a>
            <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)}>Depoimentos</a>
            <a href="#localizacao" onClick={() => setMenuOpen(false)}>Localização</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-btn-nav" onClick={() => setMenuOpen(false)}>
              Agendar avaliação
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <div className="ss2-hero-wrap">
        <section className="ss2-hero">
          {/* Esquerda — texto */}
          <div className="ss2-hero-left">
            <div className="ss2-hero-eyebrow">
              <span>Odontologia Estética · CRO 45678 · São Paulo</span>
            </div>
            <h1>
              Seu sorriso perfeito<br />
              <strong>começa aqui.</strong>
            </h1>
            <p className="ss2-hero-subtitle">
              Especialistas em odontologia estética e saúde bucal — transformando sorrisos com tecnologia de ponta e cuidado humanizado.
            </p>
            <div className="ss2-hero-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-btn-primary">
                Agendar avaliação gratuita
              </a>
              <a href="#tratamentos" className="ss2-btn-ghost">Ver tratamentos</a>
            </div>
            <div className="ss2-stats">
              <div className="ss2-stat">
                <strong>+500</strong>
                <span>Pacientes atendidos</span>
              </div>
              <div className="ss2-stat-divider" />
              <div className="ss2-stat">
                <strong>12 anos</strong>
                <span>de experiência</span>
              </div>
              <div className="ss2-stat-divider" />
              <div className="ss2-stat">
                <strong>100%</strong>
                <span>Tecnologia de ponta</span>
              </div>
            </div>
          </div>

          {/* Direita — placeholder gradiente */}
          <div className="ss2-hero-right">
            <div className="ss2-hero-visual">
              <div className="ss2-hero-gradient-box">
                <div className="ss2-hero-float-badge">
                  <span className="ss2-hero-badge-icon">✦</span>
                  <div>
                    <p className="ss2-hero-badge-title">Sorrir Studio</p>
                    <p className="ss2-hero-badge-sub">Odontologia Estética</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="ss2-hero-cro">
              <p>Dr. Felipe Andrade · CRO 45678</p>
            </div>
          </div>
        </section>
      </div>

      {/* TRATAMENTOS */}
      <section className="ss2-section" id="tratamentos">
        <div className="ss2-container">
          <span className="ss2-section-badge">Nossos Tratamentos</span>
          <h2>Transformamos sorrisos com<br /><span className="ss2-gold">excelência e tecnologia</span></h2>
          <div className="ss2-tratamentos-grid">
            {[
              {
                icon: '🦷',
                title: 'Implante Dentário',
                desc: 'Substituição permanente de dentes perdidos com implantes de titânio de alta precisão, restaurando função e estética com naturalidade.',
              },
              {
                icon: '✨',
                title: 'Clareamento Dental',
                desc: 'Clareia até 8 tons em uma sessão com tecnologia LED de última geração, seguro e com resultado imediato e duradouro.',
              },
              {
                icon: '🔬',
                title: 'Ortodontia Invisível',
                desc: 'Alinhadores transparentes personalizados que corrigem o posicionamento dos dentes de forma discreta e confortável.',
              },
              {
                icon: '💎',
                title: 'Facetas de Porcelana',
                desc: 'Laminados cerâmicos ultrafinos que transformam o sorriso com forma, cor e textura perfeitas — durabilidade de décadas.',
              },
              {
                icon: '🌿',
                title: 'Tratamento de Gengiva',
                desc: 'Correção de gengiva aparente, inflamações e irregularidades gengivais com procedimentos minimamente invasivos.',
              },
              {
                icon: '👶',
                title: 'Odontopediatria',
                desc: 'Atendimento especializado para crianças em ambiente acolhedor, prevenindo problemas e formando hábitos saudáveis desde cedo.',
              },
            ].map((t, i) => (
              <div key={i} className="ss2-tratamento-card">
                <div className="ss2-tratamento-icon-wrap">
                  <span className="ss2-tratamento-icon">{t.icon}</span>
                </div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-card-link">
                  Saiba mais →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE O DR. */}
      <section className="ss2-section ss2-section-alt" id="sobre">
        <div className="ss2-container ss2-sobre">
          <div className="ss2-sobre-visual">
            <div className="ss2-sobre-gradient-box">
              <div className="ss2-sobre-inner-badge">
                <p className="ss2-sobre-inner-name">Dr. Felipe Andrade</p>
                <p className="ss2-sobre-inner-cro">CRO 45678 · SP</p>
              </div>
            </div>
          </div>
          <div className="ss2-sobre-text">
            <span className="ss2-section-badge">Sobre o Especialista</span>
            <h2>Referência em<br /><span className="ss2-gold">Odontologia Estética em SP</span></h2>
            <p>
              O <strong>Dr. Felipe Andrade</strong> é cirurgião-dentista especialista em estética e reabilitação oral com mais de <strong>12 anos de experiência</strong>. Formado pela Universidade de São Paulo e com especialização em Implantodontia e Prótese Dentária pelo <strong>Hospital das Clínicas de SP</strong>, ele combina técnica apurada com um olhar artístico único.
            </p>
            <p>
              Acredita que um sorriso bonito vai além da estética — é saúde, autoestima e qualidade de vida. Por isso, cada tratamento é planejado de forma individualizada, com atenção total ao conforto e ao resultado esperado pelo paciente.
            </p>
            <div className="ss2-credenciais">
              <div className="ss2-credencial">✅ Especialista em Implantodontia — CFO</div>
              <div className="ss2-credencial">✅ Mestrado em Prótese Dentária — USP</div>
              <div className="ss2-credencial">✅ Membro da Associação Brasileira de Odontologia (ABO)</div>
              <div className="ss2-credencial">✅ Tecnologia digital: scanner intraoral e planejamento 3D</div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>
              Agendar avaliação
            </a>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="ss2-section" id="depoimentos">
        <div className="ss2-container">
          <span className="ss2-section-badge">Depoimentos</span>
          <h2>O que os <span className="ss2-gold">pacientes</span> dizem</h2>
          <div className="ss2-depoimentos">
            {[
              {
                nome: 'Camila Ferreira',
                inicial: 'C',
                cor: '#1B4FD8',
                texto: 'Fiz minhas facetas de porcelana com o Dr. Felipe e o resultado foi incrível! Ele é extremamente cuidadoso e o atendimento é impecável. Mudou completamente minha autoestima. Super recomendo!',
              },
              {
                nome: 'Ricardo Almeida',
                inicial: 'R',
                cor: '#C9A84C',
                texto: 'Tinha medo de dentista e o Dr. Felipe me deixou completamente à vontade. Fiz o implante sem dor, com acompanhamento em todas as etapas. Resultado natural e perfeito. Clínica moderna e equipe incrível.',
              },
              {
                nome: 'Patrícia Gonçalves',
                inicial: 'P',
                cor: '#2e7d32',
                texto: 'Trouxe minha filha para a odontopediatria e ela amou! O Dr. Felipe tem uma paciência enorme com crianças. Hoje ela não tem mais medo de dentista. Ambiente acolhedor, atendimento humanizado e resultado excelente.',
              },
            ].map((d, i) => (
              <div key={i} className="ss2-depoimento">
                <div className="ss2-depoimento-header">
                  <div className="ss2-depoimento-avatar" style={{ background: d.cor }}>
                    {d.inicial}
                  </div>
                  <div>
                    <strong className="ss2-depoimento-nome">{d.nome}</strong>
                    <div className="ss2-depoimento-stars">★★★★★</div>
                  </div>
                </div>
                <p>"{d.texto}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCALIZAÇÃO */}
      <section className="ss2-section ss2-section-alt" id="localizacao">
        <div className="ss2-container ss2-contato">
          <div className="ss2-contato-text">
            <span className="ss2-section-badge">Localização</span>
            <h2>Onde nos <span className="ss2-gold">encontrar</span></h2>
            <div className="ss2-contato-info">
              <div className="ss2-contato-item">
                <div className="ss2-contato-item-icon">📍</div>
                <div>
                  <strong>Endereço</strong>
                  <p>Av. Paulista, 1578 — sala 302<br />Bela Vista, São Paulo - SP</p>
                </div>
              </div>
              <div className="ss2-contato-item">
                <div className="ss2-contato-item-icon">🕐</div>
                <div>
                  <strong>Horários de atendimento</strong>
                  <p>Segunda a Sexta: 8h às 19h<br />Sábados: 8h às 13h</p>
                </div>
              </div>
              <div className="ss2-contato-item">
                <div className="ss2-contato-item-icon">📱</div>
                <div>
                  <strong>Agendamento</strong>
                  <p>WhatsApp · Ligação · Online</p>
                </div>
              </div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>
              📱 Agendar pelo WhatsApp
            </a>
          </div>
          <div className="ss2-mapa">
            <iframe
              title="Localização Sorrir Studio Odontologia"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1!2d-46.6544!3d-23.5646!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzUyLjYiUyA0NsKwMzknMTUuOCJX!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="380"
              style={{ border: 0, borderRadius: '20px' }}
              allowFullScreen=""
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="ss2-cta">
        <div className="ss2-cta-inner">
          <div className="ss2-cta-visual">
            <div className="ss2-cta-gradient-box" />
          </div>
          <div className="ss2-cta-text">
            <div className="ss2-cta-quote-mark">"</div>
            <h2>
              Cada sorriso é único —<br />
              <span className="ss2-gold">e o seu merece ser perfeito.</span>
            </h2>
            <p>— Dr. Felipe Andrade · CRO 45678</p>
            <div className="ss2-cta-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-btn-primary ss2-btn-large">
                Agendar minha avaliação
              </a>
              <a href="#tratamentos" className="ss2-btn-ghost">
                Ver tratamentos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ss2-footer">
        <div className="ss2-footer-inner">
          <div className="ss2-footer-brand">
            <div className="ss2-footer-logo-wrap">
              <span className="ss2-footer-logo-icon">✦</span>
              <span className="ss2-footer-logo-text">Sorrir Studio</span>
            </div>
            <p>Odontologia estética e saúde bucal com excelência.<br />Transformando sorrisos em São Paulo desde 2013.</p>
            <div className="ss2-social-links">
              {/* Instagram */}
              <a href="https://www.instagram.com/sorrirstudio" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="ss2-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://www.facebook.com/sorrirstudio" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="ss2-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="ss2-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="ss2-footer-info">
            <h4>Localização</h4>
            <p>Av. Paulista, 1578 — sala 302<br />Bela Vista, São Paulo - SP</p>
            <p style={{ marginTop: '0.75rem' }}>Seg–Sex: 8h–19h · Sáb: 8h–13h</p>
          </div>
          <div className="ss2-footer-info">
            <h4>Links</h4>
            <a href="#tratamentos">Tratamentos</a>
            <a href="#sobre">Sobre o Dr. Felipe</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Agendar avaliação</a>
          </div>
        </div>
        <div className="ss2-footer-bottom">
          <p>© 2025 Sorrir Studio Odontologia — Dr. Felipe Andrade · CRO 45678</p>
          <p>Site desenvolvido por <strong style={{ color: '#C9A84C' }}>Nevo Soluções</strong></p>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="ss2-whatsapp-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  );
}
