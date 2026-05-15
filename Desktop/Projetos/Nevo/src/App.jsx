import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar, Footer, WhatsAppButton, CookieBanner, Breadcrumb } from './components';
import {
  Home, SitesParaClinicas, Automacao, Integracoes, SitesLP, TermosPrivacidade, Blog, BlogPost,
  SaoPauloLP, RioDeJaneiroLP, CuritibaLP, BrasiliaLP, BeloHorizonteLP, FortalezaLP, CriacaoSitesBH, Diagnostico,
} from './pages';
import SamiraSodre from './demo/SamiraSodre';
import MentePlenaPsicologia from './demo/MentePlenaPsicologia';
import SorrirStudio from './demo/SorrirStudio';
import RafaelMendesAdv from './demo/RafaelMendesAdv';
import IsabelaFontesAdv from './demo/IsabelaFontesAdv';
import LuminaEstetica from './demo/LuminaEstetica';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const { pathname } = useLocation();
  const isDemo = pathname.startsWith('/demo');

  return (
    <>
      <ScrollToTop />
      {!isDemo && <Navbar />}
      {!isDemo && <Breadcrumb />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servicos/sites-para-clinicas" element={<SitesParaClinicas />} />
          <Route path="/servicos/automacao" element={<Automacao />} />
          <Route path="/servicos/integracoes-crm" element={<Integracoes />} />
          <Route path="/sites" element={<SitesLP />} />
          <Route path="/termos" element={<TermosPrivacidade />} />
          <Route path="/privacidade" element={<TermosPrivacidade />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/sao-paulo" element={<SaoPauloLP />} />
          <Route path="/rio-de-janeiro" element={<RioDeJaneiroLP />} />
          <Route path="/curitiba" element={<CuritibaLP />} />
          <Route path="/brasilia" element={<BrasiliaLP />} />
          <Route path="/belo-horizonte" element={<BeloHorizonteLP />} />
          <Route path="/fortaleza" element={<FortalezaLP />} />
          <Route path="/criacao-sites-belo-horizonte" element={<CriacaoSitesBH />} />
          <Route path="/diagnostico" element={<Diagnostico />} />
          {/* DEMO — links ocultos para apresentar a clientes */}
          <Route path="/demo/samira" element={<SamiraSodre />} />
          <Route path="/demo/psicologo" element={<MentePlenaPsicologia />} />
          <Route path="/demo/dentista" element={<SorrirStudio />} />
          <Route path="/demo/advogado" element={<RafaelMendesAdv />} />
          <Route path="/demo/advogada" element={<IsabelaFontesAdv />} />
          <Route path="/demo/estetica" element={<LuminaEstetica />} />
        </Routes>
      </main>
      {!isDemo && <Footer />}
      {!isDemo && <WhatsAppButton />}
      <CookieBanner />
    </>
  );
}

export default App;
