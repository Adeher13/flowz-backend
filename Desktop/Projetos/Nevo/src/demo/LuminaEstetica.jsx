import { useEffect, useState } from 'react';
import './LuminaEstetica.css';

const WHATSAPP = 'https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20agendar%20uma%20avaliação%20na%20Lumina%20Estética.';

const tratamentos = [
  { icon: '✨', title: 'Botox & Toxina', desc: 'Suavização de rugas de expressão com técnica avançada e resultado natural, preservando sua expressividade.' },
  { icon: '💉', title: 'Preenchimento', desc: 'Restauração de volume facial com ácido hialurônico de alta densidade, para contornos mais definidos.' },
  { icon: '🌿', title: 'Bioestimuladores', desc: 'Estímulo à produção de colágeno nativo para rejuvenescimento profundo e duradouro da pele.' },
  { icon: '🫧', title: 'Limpeza de Pele', desc: 'Protocolo completo de higienização e extração com ativos selecionados para uma pele radiante.' },
  { icon: '🌸', title: 'Peeling Químico', desc: 'Renovação celular acelerada com ácidos profissionais, uniformizando o tom e a textura da pele.' },
  { icon: '🤍', title: 'Drenagem Linfática', desc: 'Técnica manual especializada para redução de inchaço, modelagem corporal e bem-estar profundo.' },
];

const diferenciais = [
  { icon: '🏅', titulo: 'Profissionais certificadas', desc: 'Equipe com formação em medicina estética e atualização constante nos melhores protocolos internacionais.' },
  { icon: '🔬', titulo: 'Tecnologia de ponta', desc: 'Equipamentos e ativos de última geração, selecionados para resultados visíveis com total segurança.' },
  { icon: '💎', titulo: 'Experiência personalizada', desc: 'Cada atendimento começa por uma avaliação individual, criando um plano de tratamento único para você.' },
];

const depoimentos = [
  { nome: 'Gabriela Ferreira', avatar: 'GF', texto: 'A Lumina transformou minha relação com o espelho. O resultado do preenchimento ficou completamente natural — todo mundo notou que eu estava diferente, mas ninguém soube o quê. Exatamente o que eu queria.' },
  { nome: 'Renata Almeida', avatar: 'RA', texto: 'Fiz o protocolo de bioestimuladores e a minha pele está visivelmente mais firme e luminosa. O ambiente é sofisticado e o atendimento é extremamente atencioso. Me senti cuidada do início ao fim.' },
  { nome: 'Camila Duarte', avatar: 'CD', texto: 'O botox foi feito com tanta precisão que minha expressão ficou idêntica, só sem as rulinhas. Voltei uma semana depois para mostrar para a equipe o quanto eu estava feliz. Recomendo demais!' },
];

export default function LuminaEstetica() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Lumina Estética Avançada | São Paulo';
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="le-root">

      {/* NAVBAR */}
      <nav className={`le-nav ${scrolled ? 'le-nav-scrolled' : ''}`}>
        <div className="le-nav-inner">
          <div className="le-logo">
            <span className="le-logo-mark">L</span>
            <div className="le-logo-text">
              <strong>Lumina</strong>
              <em>Estética Avançada</em>
            </div>
          </div>
          <div className="le-nav-links">
            <a href="#tratamentos">Tratamentos</a>
            <a href="#sobre">Sobre</a>
            <a href="#resultados">Resultados</a>
            <a href="#contato">Contato</a>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="le-btn-nav">
            Agendar avaliação
          </a>
          <button className="le-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="le-mobile-menu">
            <a href="#tratamentos" onClick={() => setMenuOpen(false)}>Tratamentos</a>
            <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
            <a href="#resultados" onClick={() => setMenuOpen(false)}>Resultados</a>
            <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="le-btn-nav le-btn-nav-mobile" onClick={() => setMenuOpen(false)}>
              Agendar avaliação
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="le-hero">
        <div className="le-hero-bg" />
        <div className="le-hero-inner">
          <div className="le-hero-content">
            <div className="le-hero-eyebrow">
              <span className="le-line" />
              <span>Estética Avançada · São Paulo</span>
            </div>
            <h1>
              Realce sua beleza natural com<br />
              <span className="le-rose">tratamentos de alta performance</span>
            </h1>
            <p className="le-hero-sub">
              Protocolos estéticos de excelência, personalizados para revelar
              o melhor da sua pele com segurança e sofisticação.
            </p>
            <div className="le-hero-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="le-btn-primary">
                Agendar avaliação gratuita
              </a>
              <a href="#tratamentos" className="le-btn-ghost">Ver tratamentos</a>
            </div>
            <div className="le-stats">
              <div className="le-stat">
                <strong>+800</strong>
                <span>Procedimentos</span>
              </div>
              <div className="le-stat-divider" />
              <div className="le-stat">
                <strong>5 anos</strong>
                <span>de excelência</span>
              </div>
              <div className="le-stat-divider" />
              <div className="le-stat">
                <strong>Equipe</strong>
                <span>especializada</span>
              </div>
            </div>
          </div>
          <div className="le-hero-visual">
            <div className="le-hero-photo-frame">
              <div className="le-hero-photo-gradient" />
              <div className="le-hero-orb le-hero-orb-1" />
              <div className="le-hero-orb le-hero-orb-2" />
            </div>
            <div className="le-hero-badge">
              <span className="le-badge-icon">✦</span>
              <span>Avaliação sem compromisso</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRATAMENTOS */}
      <section className="le-section le-section-light" id="tratamentos">
        <div className="le-container">
          <div className="le-section-header">
            <span className="le-badge">Nossos Tratamentos</span>
            <h2>Cuidados que <span className="le-rose">transformam</span></h2>
            <p className="le-section-sub">
              Cada procedimento é realizado com ativos de alta concentração e técnicas
              refinadas, para resultados que respeitam e realçam a sua beleza.
            </p>
          </div>
          <div className="le-tratamentos-grid">
            {tratamentos.map((t, i) => (
              <div key={i} className="le-trat-card">
                <div className="le-trat-icon">{t.icon}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <span className="le-trat-link">Saiba mais →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POR QUE ESCOLHER */}
      <section className="le-section le-section-rose" id="resultados">
        <div className="le-container">
          <div className="le-section-header le-section-header-center">
            <span className="le-badge le-badge-dark">Por que a Lumina</span>
            <h2>Uma clínica pensada <span className="le-rose-dark">para você</span></h2>
          </div>
          <div className="le-diferenciais-grid">
            {diferenciais.map((d, i) => (
              <div key={i} className="le-diferencial-card">
                <div className="le-diferencial-icon">{d.icon}</div>
                <h3>{d.titulo}</h3>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="le-section le-section-light" id="sobre">
        <div className="le-container le-sobre">
          <div className="le-sobre-visual">
            <div className="le-sobre-photo-mock">
              <div className="le-sobre-gradient" />
              <div className="le-sobre-tag">
                <span>✦</span>
                <span>Há 5 anos cuidando de você</span>
              </div>
            </div>
          </div>
          <div className="le-sobre-text">
            <span className="le-badge">Sobre a clínica</span>
            <h2>Onde a ciência encontra <span className="le-rose">a arte de cuidar</span></h2>
            <p>
              A Lumina Estética Avançada nasceu da visão de que todo tratamento deve começar por
              um <strong>olhar genuíno</strong> sobre quem está à nossa frente. Cada procedimento
              é precedido de uma avaliação criteriosa, garantindo que o protocolo escolhido
              esteja em completa harmonia com os objetivos e com a singularidade de cada cliente.
            </p>
            <p>
              Nossa equipe é formada por especialistas em medicina estética, constantemente
              atualizados com as melhores técnicas nacionais e internacionais. Trabalhamos
              com <strong>marcas premium</strong> e equipamentos de última geração, em um
              ambiente pensado para proporcionar conforto, privacidade e bem-estar.
            </p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="le-btn-primary" style={{ marginTop: '2rem', display: 'inline-flex' }}>
              Conhecer a clínica
            </a>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="le-section le-section-cream" id="depoimentos">
        <div className="le-container">
          <div className="le-section-header le-section-header-center">
            <span className="le-badge">Depoimentos</span>
            <h2>O que nossas clientes <span className="le-rose">dizem</span></h2>
          </div>
          <div className="le-depoimentos-grid">
            {depoimentos.map((d, i) => (
              <div key={i} className="le-depoimento">
                <div className="le-depoimento-stars">★★★★★</div>
                <p>"{d.texto}"</p>
                <div className="le-depoimento-author">
                  <div className="le-avatar">{d.avatar}</div>
                  <strong>{d.nome}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCALIZAÇÃO */}
      <section className="le-section le-section-light" id="contato">
        <div className="le-container le-contato">
          <div className="le-contato-text">
            <span className="le-badge">Localização & Contato</span>
            <h2>Venha nos <span className="le-rose">visitar</span></h2>
            <div className="le-contato-infos">
              <div className="le-contato-item">
                <span className="le-contato-icon">📍</span>
                <div>
                  <strong>Endereço</strong>
                  <p>Av. Brigadeiro Faria Lima, 2369 — Sala 804<br />Jardim Paulistano, São Paulo – SP</p>
                </div>
              </div>
              <div className="le-contato-item">
                <span className="le-contato-icon">🕐</span>
                <div>
                  <strong>Horários de atendimento</strong>
                  <p>Segunda a Sexta: 9h às 20h<br />Sábados: 9h às 15h</p>
                </div>
              </div>
              <div className="le-contato-item">
                <span className="le-contato-icon">📞</span>
                <div>
                  <strong>Fale conosco</strong>
                  <p>(11) 99999-9999 · contato@luminaestetica.com.br</p>
                </div>
              </div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="le-btn-whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Agendar pelo WhatsApp
            </a>
          </div>
          <div className="le-mapa-placeholder">
            <div className="le-mapa-inner">
              <span className="le-mapa-pin">📍</span>
              <p>Av. Brig. Faria Lima, 2369</p>
              <span>Jardim Paulistano · SP</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="le-footer">
        <div className="le-footer-inner">
          <div className="le-footer-brand">
            <div className="le-logo le-logo-footer">
              <span className="le-logo-mark">L</span>
              <div className="le-logo-text">
                <strong>Lumina</strong>
                <em>Estética Avançada</em>
              </div>
            </div>
            <p>Tratamentos estéticos de alta performance<br />em um ambiente de luxo e cuidado em São Paulo.</p>
            <div className="le-social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="le-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="le-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="le-footer-col">
            <h4>Tratamentos</h4>
            <a href="#tratamentos">Botox & Toxina</a>
            <a href="#tratamentos">Preenchimento</a>
            <a href="#tratamentos">Bioestimuladores</a>
            <a href="#tratamentos">Peeling Químico</a>
            <a href="#tratamentos">Drenagem Linfática</a>
          </div>
          <div className="le-footer-col">
            <h4>Clínica</h4>
            <a href="#sobre">Sobre a Lumina</a>
            <a href="#resultados">Por que nos escolher</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#contato">Localização</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Agendar avaliação</a>
          </div>
          <div className="le-footer-col">
            <h4>Contato</h4>
            <p>Av. Brig. Faria Lima, 2369<br />Jardim Paulistano · SP</p>
            <p style={{ marginTop: '0.75rem' }}>Seg–Sex: 9h–20h<br />Sáb: 9h–15h</p>
            <p style={{ marginTop: '0.75rem' }}>(11) 99999-9999</p>
          </div>
        </div>
        <div className="le-footer-bottom">
          <p>© 2025 Lumina Estética Avançada — São Paulo</p>
          <p>Site desenvolvido por <strong>Nevo Soluções</strong></p>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="le-whatsapp-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
