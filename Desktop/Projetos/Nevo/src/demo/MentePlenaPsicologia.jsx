import { useEffect, useState } from 'react';
import './MentePlenaPsicologia.css';

const WHATSAPP = 'https://wa.me/5531999999999?text=Olá%20Dra.%20Ana!%20Gostaria%20de%20agendar%20uma%20consulta.';

export default function MentePlenaPsicologia() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.title = 'Dra. Ana Beatriz Lemos — Psicóloga | Belo Horizonte';
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="mp-root">

      {/* NAVBAR */}
      <nav className={`mp-nav ${scrolled ? 'mp-nav-scrolled' : ''}`}>
        <div className="mp-nav-inner">
          <div className="mp-logo">
            <span className="mp-logo-mark">MP</span>
            <div className="mp-logo-text">
              <span className="mp-logo-title">Mente Plena</span>
              <span className="mp-logo-sub">Psicologia</span>
            </div>
          </div>
          <div className="mp-nav-links">
            <a href="#sobre">Sobre</a>
            <a href="#abordagem">Abordagem</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href="#contato">Contato</a>
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-btn-nav">
            Agendar consulta
          </a>
          <button className="mp-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="mp-mobile-menu">
            <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
            <a href="#abordagem" onClick={() => setMenuOpen(false)}>Abordagem</a>
            <a href="#depoimentos" onClick={() => setMenuOpen(false)}>Depoimentos</a>
            <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-btn-nav" onClick={() => setMenuOpen(false)}>
              Agendar consulta
            </a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <div className="mp-hero-wrap">
        <section className="mp-hero">

          {/* Esquerda — texto */}
          <div className="mp-hero-left">
            <div className="mp-hero-eyebrow">
              <span>Psicóloga · CRP 04/12345 · Belo Horizonte</span>
            </div>
            <h1>
              Transforme sua relação<br />
              com suas emoções e<br />
              <em>reconquiste o equilíbrio</em>
            </h1>
            <p className="mp-hero-subtitle">
              Atendimento em Terapia Cognitivo-Comportamental (TCC) para ansiedade,
              depressão, desenvolvimento pessoal e relacionamentos.
            </p>
            <div className="mp-hero-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-btn-primary">
                Agendar consulta
              </a>
              <a href="#abordagem" className="mp-btn-ghost">Conhecer abordagem</a>
            </div>
            <div className="mp-stats">
              <div className="mp-stat">
                <strong>+200</strong>
                <span>Pacientes atendidos</span>
              </div>
              <div className="mp-stat-divider" />
              <div className="mp-stat">
                <strong>8 anos</strong>
                <span>de experiência</span>
              </div>
              <div className="mp-stat-divider" />
              <div className="mp-stat">
                <strong>98%</strong>
                <span>de satisfação</span>
              </div>
            </div>
          </div>

          {/* Direita — foto placeholder com gradiente */}
          <div className="mp-hero-right">
            <div className="mp-hero-photo-wrap">
              <div className="mp-hero-photo" />
              <div className="mp-hero-crp">
                <p>CRP 04/12345</p>
              </div>
              <div className="mp-hero-deco-dot mp-hero-deco-dot-1" />
              <div className="mp-hero-deco-dot mp-hero-deco-dot-2" />
            </div>
          </div>

        </section>
      </div>

      {/* SOBRE */}
      <section className="mp-section" id="sobre">
        <div className="mp-container mp-sobre">
          <div className="mp-sobre-photo-wrap">
            <div className="mp-sobre-photo" />
            <div className="mp-sobre-badge">CRP 04/12345</div>
          </div>
          <div className="mp-sobre-text">
            <span className="mp-section-badge">Sobre a profissional</span>
            <h2>Dra. Ana Beatriz Lemos —<br /><span className="mp-sage">cuidado com presença</span></h2>
            <p>
              Formada em Psicologia pela UFMG, com especialização em
              <strong> Terapia Cognitivo-Comportamental</strong> pelo Instituto Mineiro de TCC,
              a Dra. Ana Beatriz Lemos dedica sua prática clínica a oferecer um espaço de
              escuta genuína, livre de julgamentos.
            </p>
            <p>
              Com <strong>8 anos de experiência</strong>, já acompanhou mais de 200 pacientes
              em processos terapêuticos voltados ao autoconhecimento, regulação emocional
              e superação de bloqueios. Acredita que cada pessoa carrega em si a capacidade
              de transformação — o papel do terapeuta é iluminar esse caminho.
            </p>
            <div className="mp-credenciais">
              <div className="mp-credencial">Especialista em Terapia Cognitivo-Comportamental (TCC)</div>
              <div className="mp-credencial">Formação em Terapia de Aceitação e Compromisso (ACT)</div>
              <div className="mp-credencial">Atendimento presencial e online (telemedicina)</div>
              <div className="mp-credencial">Sigilo e ética em todos os atendimentos</div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>
              Agendar consulta
            </a>
          </div>
        </div>
      </section>

      {/* ABORDAGEM / SERVIÇOS */}
      <section className="mp-section mp-section-bege" id="abordagem">
        <div className="mp-container">
          <div className="mp-section-header">
            <span className="mp-section-badge">Abordagem & Serviços</span>
            <h2>Como posso te <span className="mp-sage">ajudar</span></h2>
            <p className="mp-section-desc">
              Cada processo terapêutico é único. Trabalho com técnicas baseadas em evidências,
              adaptadas à história e necessidades de cada pessoa.
            </p>
          </div>
          <div className="mp-cards-grid">
            {[
              {
                num: '01',
                title: 'Terapia Individual',
                desc: 'Espaço acolhedor e sigiloso para explorar emoções, padrões de pensamento e desenvolver ferramentas práticas para o dia a dia.',
              },
              {
                num: '02',
                title: 'Terapia de Casal',
                desc: 'Facilitação do diálogo e resolução de conflitos, fortalecendo a comunicação e reconectando parceiros através de um olhar empático.',
              },
              {
                num: '03',
                title: 'Ansiedade e Depressão',
                desc: 'Tratamento especializado com técnicas de TCC comprovadas para transtornos de ansiedade, depressão e síndrome do pânico.',
              },
              {
                num: '04',
                title: 'Desenvolvimento Pessoal',
                desc: 'Autoconhecimento, estabelecimento de metas, gestão de emoções e construção de uma vida alinhada com seus valores mais profundos.',
              },
            ].map((card, i) => (
              <div key={i} className="mp-card">
                <span className="mp-card-num">{card.num}</span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-card-link">
                  Saiba mais →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="mp-section" id="depoimentos">
        <div className="mp-container">
          <div className="mp-section-header">
            <span className="mp-section-badge">Depoimentos</span>
            <h2>Histórias de <span className="mp-sage">transformação</span></h2>
          </div>
          <div className="mp-depoimentos-grid">
            {[
              {
                iniciais: 'CM',
                nome: 'Camila M.',
                cor: 'linear-gradient(135deg, #7A9E7E, #5a7e5e)',
                texto: 'Cheguei à terapia completamente perdida. A Dra. Ana me ajudou a entender meus padrões, a ter compaixão comigo mesma. Hoje me sinto inteira de um jeito que não sabia que era possível.',
              },
              {
                iniciais: 'RP',
                nome: 'Rafael P.',
                cor: 'linear-gradient(135deg, #b0956e, #8a7050)',
                texto: 'Fui por conta da ansiedade que estava me paralisando no trabalho. Com as ferramentas da TCC, aprendi a identificar os gatilhos e a responder diferente. Mudou minha vida profissional e pessoal.',
              },
              {
                iniciais: 'LF',
                nome: 'Letícia F.',
                cor: 'linear-gradient(135deg, #9e8a7a, #7e6a5a)',
                texto: 'A Dra. Ana tem um dom especial para acolher sem julgar. O processo de terapia de casal salvou meu relacionamento. Hoje nos comunicamos de um jeito completamente diferente.',
              },
            ].map((d, i) => (
              <div key={i} className="mp-depoimento">
                <div className="mp-depoimento-stars">★★★★★</div>
                <p>"{d.texto}"</p>
                <div className="mp-depoimento-autor">
                  <div className="mp-avatar" style={{ background: d.cor }}>{d.iniciais}</div>
                  <strong>{d.nome}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO / LOCALIZAÇÃO */}
      <section className="mp-section mp-section-bege" id="contato">
        <div className="mp-container mp-contato">
          <div className="mp-contato-text">
            <span className="mp-section-badge">Localização & Contato</span>
            <h2>Pronto para <span className="mp-sage">dar o primeiro passo</span>?</h2>
            <p className="mp-contato-intro">
              O atendimento acontece em um ambiente aconchegante e totalmente reservado,
              no coração de Belo Horizonte. Também disponível online.
            </p>
            <div className="mp-contato-infos">
              <div className="mp-contato-item">
                <div className="mp-contato-icon">📍</div>
                <div>
                  <strong>Consultório</strong>
                  <p>Av. do Contorno, 4520 — sala 302<br />Serra, Belo Horizonte — MG</p>
                </div>
              </div>
              <div className="mp-contato-item">
                <div className="mp-contato-icon">🕐</div>
                <div>
                  <strong>Horários</strong>
                  <p>Segunda a sexta: 8h às 19h<br />Sábados: 8h às 13h</p>
                </div>
              </div>
              <div className="mp-contato-item">
                <div className="mp-contato-icon">💻</div>
                <div>
                  <strong>Atendimento Online</strong>
                  <p>Teleconsulta disponível para todo o Brasil</p>
                </div>
              </div>
            </div>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-btn-whatsapp">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Agendar pelo WhatsApp
            </a>
          </div>
          <div className="mp-mapa">
            <iframe
              title="Localização Mente Plena Psicologia"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3751.3!2d-43.9400!3d-19.9340!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDU2JzAyLjQiUyA0M8KwNTYnMjQuMCJX!5e0!3m2!1spt-BR!2sbr!4v1"
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
      <section className="mp-cta">
        <div className="mp-cta-inner">
          <div className="mp-cta-photo" />
          <div className="mp-cta-text">
            <span className="mp-section-badge mp-section-badge-light">Uma palavra da Dra. Ana</span>
            <h2>"Pedir ajuda é um ato<br /><em>de coragem e amor-próprio.</em><br />Estou aqui para caminhar<br />ao seu lado."</h2>
            <p>— Dra. Ana Beatriz Lemos · CRP 04/12345</p>
            <div className="mp-cta-actions">
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-btn-primary mp-btn-large">
                Agendar minha consulta
              </a>
              <a href="#sobre" className="mp-btn-ghost">Conhecer mais</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mp-footer">
        <div className="mp-footer-inner">
          <div className="mp-footer-brand">
            <div className="mp-footer-logo-wrap">
              <span className="mp-logo-mark mp-logo-mark-sm">MP</span>
              <div className="mp-logo-text">
                <span className="mp-logo-title">Mente Plena</span>
                <span className="mp-logo-sub">Psicologia</span>
              </div>
            </div>
            <p>Terapia Cognitivo-Comportamental com acolhimento,<br />ética e escuta genuína. BH e online.</p>
            <div className="mp-social-links">
              <a href="https://www.instagram.com/menteplenapsicologia" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="mp-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="mp-social-link">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
          <div className="mp-footer-info">
            <h4>Localização</h4>
            <p>Av. do Contorno, 4520 — sala 302<br />Serra, Belo Horizonte — MG</p>
            <p style={{ marginTop: '0.75rem' }}>Presencial · Online para todo o Brasil</p>
          </div>
          <div className="mp-footer-info">
            <h4>Links</h4>
            <a href="#sobre">Sobre a Dra. Ana</a>
            <a href="#abordagem">Abordagem & Serviços</a>
            <a href="#depoimentos">Depoimentos</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">Agendar consulta</a>
          </div>
        </div>
        <div className="mp-footer-bottom">
          <p>© 2025 Dra. Ana Beatriz Lemos — CRP 04/12345</p>
          <p>Site desenvolvido por <strong style={{ color: '#7A9E7E' }}>Nevo Soluções</strong></p>
        </div>
      </footer>

      {/* WHATSAPP FLUTUANTE */}
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mp-whatsapp-float" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

    </div>
  );
}
