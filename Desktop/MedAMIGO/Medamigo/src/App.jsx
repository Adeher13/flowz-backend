import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import AccessControl from '@/components/AccessControl';
import WhatsAppButton from '@/components/WhatsAppButton';
import HomePage from '@/pages/HomePage';
import ProfileAnalysisPage from '@/pages/ProfileAnalysisPage';
import ChancesCalculatorPage from '@/pages/ChancesCalculatorPage';
import SimulationsPage from '@/pages/SimulationsPage';
import ProfilePage from '@/pages/ProfilePage';
import MeuPerfilPage from '@/pages/MeuPerfilPage';
import AdminSetupPage from '@/pages/AdminSetupPage';
import AdminLayout from '@/components/AdminLayout';
import RecommendedUniversitiesPage from '@/pages/RecommendedUniversitiesPage';
import DashboardPage from '@/pages/DashboardPage';
import { SimulationsProvider } from '@/contexts/SimulationsContext';
import { useToast } from './components/ui/use-toast';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminSimulationsPage from '@/pages/AdminSimulationsPage';
// Admin questões: substituir a página que usava Supabase por versão local (read-only)
import AdminQuestoesLocalPage from '@/pages/admin/AdminQuestoesLocalPage';
import AdminGerenciarSimuladosPage from '@/pages/admin/AdminGerenciarSimuladosPage';
import AdminFaculdadesPage from '@/pages/admin/AdminFaculdadesPageNew';
import AdminAlunosPage from '@/pages/admin/AdminAlunosPage';
import AdminRelatoriosPage from '@/pages/admin/AdminRelatoriosPage';
import AdminConfiguracoesPage from '@/pages/admin/AdminConfiguracoesPage';
import AdminRaioXPage from '@/pages/admin/AdminRaioXPage';
import AdminSimuladosAlunosPage from '@/pages/admin/AdminSimuladosAlunosPage';
import AdminRoute from '@/components/AdminRoute';
import AlunosSimuladosPage from '@/pages/AlunosSimuladosPage';
import VerRaioXPage from '@/pages/VerRaioXPage';
import PrepararDocumentosPage from '@/pages/PrepararDocumentosPage';
import ProvasAnterioresPage from '@/pages/ProvasAnterioresPage';
import AdminCriarSimuladoPage from '@/pages/admin/AdminCriarSimuladoPage';

// Placeholder components
const ComingSoon = ({ pageName }) => {
  const { toast } = useToast();
  React.useEffect(() => {
    toast({
      title: '🚧 Em Construção!',
      description: `A página ${pageName} ainda não foi implementada.`,
    });
  }, [pageName, toast]);

  return (
    <div className='flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8'>
      <h1 className='text-2xl font-bold text-gray-700'>Página em Construção</h1>
      <p className='text-gray-500 mt-2'>
        A funcionalidade de {pageName} estará disponível em breve!
      </p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50'>
        <Navigation />
        <SimulationsProvider>
          <Routes>
            {/* Public Routes */}
            <Route path='/' element={<HomePage />} />
            <Route path='/admin-setup' element={<AdminSetupPage />} />

            {/* Admin and Dashboard Routes - All authenticated pages */}
            <Route element={<AdminLayout />}>
              {/* Main Dashboard and Student Pages - COM controle de acesso */}
              <Route
                path='/dashboard'
                element={
                  <AccessControl>
                    <DashboardPage />
                  </AccessControl>
                }
              />
              <Route
                path='/analise-perfil'
                element={
                  <AccessControl>
                    <ProfileAnalysisPage />
                  </AccessControl>
                }
              />
              <Route
                path='/calculadora-chances'
                element={
                  <AccessControl>
                    <ChancesCalculatorPage />
                  </AccessControl>
                }
              />
              <Route
                path='/simulados'
                element={
                  <AccessControl>
                    <SimulationsPage />
                  </AccessControl>
                }
              />
              <Route
                path='/simulados-disponiveis'
                element={
                  <AccessControl>
                    <AlunosSimuladosPage />
                  </AccessControl>
                }
              />
              <Route
                path='/ver-raio-x'
                element={
                  <AccessControl>
                    <VerRaioXPage />
                  </AccessControl>
                }
              />
              <Route
                path='/meu-perfil-antigo'
                element={
                  <AccessControl>
                    <ProfilePage />
                  </AccessControl>
                }
              />
              <Route
                path='/perfil'
                element={
                  <AccessControl>
                    <MeuPerfilPage />
                  </AccessControl>
                }
              />
              <Route
                path='/recommended-universities'
                element={
                  <AccessControl>
                    <RecommendedUniversitiesPage />
                  </AccessControl>
                }
              />
              <Route
                path='/preparar-documentos'
                element={
                  <AccessControl>
                    <PrepararDocumentosPage />
                  </AccessControl>
                }
              />
              <Route
                path='/provas-anteriores'
                element={
                  <AccessControl>
                    <ProvasAnterioresPage />
                  </AccessControl>
                }
              />

              {/* Admin Pages */}
              <Route element={<AdminRoute />}>
                <Route
                  path='/admin/dashboard'
                  element={<AdminDashboardPage />}
                />
                <Route
                  path='/admin/criar-simulado'
                  element={<AdminCriarSimuladoPage />}
                />
                <Route
                  path='/admin/questoes'
                  element={<AdminQuestoesLocalPage />}
                />
                <Route
                  path='/admin/gerenciar-simulados'
                  element={<AdminGerenciarSimuladosPage />}
                />
                <Route
                  path='/admin/faculdades'
                  element={<AdminFaculdadesPage />}
                />
                <Route path='/admin/alunos' element={<AdminAlunosPage />} />
                <Route
                  path='/admin/relatorios'
                  element={<AdminRelatoriosPage />}
                />
                <Route
                  path='/admin/configuracoes'
                  element={<AdminConfiguracoesPage />}
                />
                <Route path='/admin/raio-x' element={<AdminRaioXPage />} />
                <Route
                  path='/admin/simulados-alunos'
                  element={<AdminSimuladosAlunosPage />}
                />
              </Route>
              <Route
                path='/dashboard/meus-simulados'
                element={
                  <AccessControl>
                    <ComingSoon pageName='Meus Simulados' />
                  </AccessControl>
                }
              />
              <Route
                path='/dashboard/historico'
                element={
                  <AccessControl>
                    <ComingSoon pageName='Histórico' />
                  </AccessControl>
                }
              />
              <Route
                path='/dashboard/analise'
                element={
                  <AccessControl>
                    <ComingSoon pageName='Raio-X Acadêmico' />
                  </AccessControl>
                }
              />
              <Route
                path='/dashboard/configuracoes'
                element={
                  <AccessControl>
                    <ComingSoon pageName='Configurações' />
                  </AccessControl>
                }
              />
            </Route>
          </Routes>
        </SimulationsProvider>
        <Toaster />
        <WhatsAppButton />
      </div>
    </Router>
  );
}

export default App;
