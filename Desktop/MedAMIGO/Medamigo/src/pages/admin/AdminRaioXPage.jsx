import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Search,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  FileText,
  Filter,
  ArrowLeft,
  Target,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  MapPin,
  DollarSign,
  Building2,
  ChevronRight,
  X,
  Plus,
  Download,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AdminRaioXPage = () => {
  // Função para liberar Raio-X antes do prazo
  const handleLiberarRaioX = async (analysisId) => {
    try {
      console.log('Tentando liberar Raio-X, analysisId=', analysisId);
      // Atualizar somente o status para compatibilidade com o schema atual
      const { data, error, status } = await supabase
        .from('analyses')
        .update({ status: 'liberada' })
        .eq('id', analysisId)
        .select();

      console.log('Resposta do Supabase (update):', { status, data, error });

      if (error) {
        // Logar erro detalhado para ajudar no diagnóstico (PGRST204, RLS, etc)
        console.error('Erro retornado pelo Supabase ao liberar Raio-X:', error);
        throw error;
      }

      toast({
        title: 'Raio-X liberado!',
        description: 'A análise foi liberada para o aluno.',
      });
      await fetchAnalyses();
    } catch (error) {
      console.error('Falha ao liberar Raio-X:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao liberar',
        description:
          (error && (error.message || error.details || error.hint)) ||
          'Não foi possível liberar o Raio-X. Veja o console para mais detalhes.',
      });
    }
  };
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed
  const [viewDetailAnalysis, setViewDetailAnalysis] = useState(null);

  // Estados para faculdades recomendadas
  const [faculdadesRecomendadas, setFaculdadesRecomendadas] = useState([]);
  const [loadingFaculdades, setLoadingFaculdades] = useState(false);

  // Estados para adicionar faculdades
  const [showAddFaculdadeModal, setShowAddFaculdadeModal] = useState(false);
  const [todasFaculdades, setTodasFaculdades] = useState([]);
  const [searchFaculdade, setSearchFaculdade] = useState('');

  // Estados para PDF
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  // Buscar faculdades quando viewDetailAnalysis mudar
  useEffect(() => {
    if (viewDetailAnalysis) {
      fetchFaculdadesRecomendadas();
    }
  }, [viewDetailAnalysis]);

  const fetchFaculdadesRecomendadas = async () => {
    if (!viewDetailAnalysis) return;

    setLoadingFaculdades(true);
    console.log('Buscando faculdades recomendadas...');
    try {
      const profileData = viewDetailAnalysis.profile_data_json || {};
      const aiResult = viewDetailAnalysis.ai_analysis_result_json || {};

      console.log('=== DADOS DO PERFIL ===');
      console.log(
        'profileData completo:',
        JSON.stringify(profileData, null, 2)
      );
      console.log('Estados de interesse:', profileData.statesOfInterest);
      console.log('Tipo de instituição:', profileData.institutionType);
      console.log('Método de seleção:', profileData.selectionMethod);
      console.log('FIES:', {
        aceita_fies: profileData.aceita_fies,
        fiesNeed: profileData.fiesNeed,
      });
      console.log('Estrangeiro:', {
        aceita_estrangeiro: profileData.aceita_estrangeiro,
        originCountry: profileData.originCountry,
      });
      console.log('======================');

      // Mapear nomes de estados para siglas
      const stateToSigla = {
        Acre: 'AC',
        Alagoas: 'AL',
        Amapá: 'AP',
        Amazonas: 'AM',
        Bahia: 'BA',
        Ceará: 'CE',
        'Distrito Federal': 'DF',
        'Espírito Santo': 'ES',
        Goiás: 'GO',
        Maranhão: 'MA',
        'Mato Grosso': 'MT',
        'Mato Grosso do Sul': 'MS',
        'Minas Gerais': 'MG',
        Pará: 'PA',
        Paraíba: 'PB',
        Paraná: 'PR',
        Pernambuco: 'PE',
        Piauí: 'PI',
        'Rio de Janeiro': 'RJ',
        'Rio Grande do Norte': 'RN',
        'Rio Grande do Sul': 'RS',
        Rondônia: 'RO',
        Roraima: 'RR',
        'Santa Catarina': 'SC',
        'São Paulo': 'SP',
        Sergipe: 'SE',
        Tocantins: 'TO',
      };

      // Construir query baseado no perfil do aluno
      let query = supabase.from('faculdades').select('*');

      console.log('Query inicial criada');

      // Filtrar por estados de interesse (usando siglas)
      if (
        profileData.statesOfInterest &&
        profileData.statesOfInterest.length > 0
      ) {
        // Converter nomes de estados para siglas
        const siglas = profileData.statesOfInterest.map((state) => {
          // Se já for uma sigla (2 caracteres), usar direto
          if (state.length === 2) {
            return state.toUpperCase();
          }
          // Caso contrário, converter nome para sigla
          return stateToSigla[state] || state.toUpperCase();
        });

        query = query.in('sigla', siglas);
        console.log('Filtro de estados aplicado (siglas):', siglas);
      }

      // Filtrar por tipo de administração (Privada, Pública, etc)
      if (
        profileData.institutionType &&
        profileData.institutionType !== 'Ambas'
      ) {
        query = query.eq('administracao', profileData.institutionType);
        console.log('Filtro de tipo aplicado:', profileData.institutionType);
      }

      // Filtrar por método de seleção/processo (Prova, Enem, Análise Curricular, etc)
      if (profileData.selectionMethod) {
        query = query.ilike('processo', `%${profileData.selectionMethod}%`);
        console.log(
          'Filtro de método de seleção aplicado:',
          profileData.selectionMethod
        );
      }

      // Filtrar por aceita estrangeiro (baseado na resposta Sim/Não do formulário)
      // Regra: se o aluno for DO EXTERIOR (respondeu Sim) -> mostrar apenas faculdades que aceitam estrangeiros
      // Se o aluno NÃO for do exterior (respondeu Não) -> NÃO aplicar filtro (mostrar todas as faculdades)
      if (profileData.aceita_estrangeiro === true) {
        query = query.eq('aceita_estrangeiro', true);
        console.log(
          'Filtro: aluno DO EXTERIOR - mostrando apenas faculdades que aceitam estrangeiros'
        );
      } else {
        console.log(
          'Filtro: aluno BRASILEIRO - mostrando todas as faculdades (incluindo as que aceitam estrangeiros)'
        );
      }

      // Filtrar por FIES (se o aluno precisa)
      if (profileData.aceita_fies === true) {
        query = query.eq('aceita_fies', true);
        console.log('Filtro de FIES aplicado: true');
      }

      // Executar query
      let { data, error } = await query;

      console.log('Resultado da query:', { data, error, total: data?.length });

      if (error) throw error;

      // Se não encontrou nenhuma com os filtros, buscar sem filtros (mostrar todas)
      if (!data || data.length === 0) {
        console.log(
          'Nenhuma faculdade encontrada com filtros, buscando todas...'
        );
        const { data: allData, error: allError } = await supabase
          .from('faculdades')
          .select('*')
          .limit(10);

        if (allError) throw allError;
        data = allData || [];
        console.log('Total de faculdades sem filtro:', data.length);
      } // Mapear para formato exibível e ordenar por compatibilidade
      const isExterior =
        profileData.studentLocation === 'Exterior' ||
        profileData.aceita_estrangeiro === true;
      const maxCompatibilidade = isExterior ? 89 : 92;
      const minCompatibilidade = 75;

      const faculdades = (data || [])
        .map((fac, index) => {
          // Calcular compatibilidade baseada na posição e perfil do aluno
          // Primeira faculdade tem compatibilidade máxima, depois decresce
          let compatibilidade = maxCompatibilidade - index * 2;

          // Ajustes baseados nos critérios da faculdade
          if (fac.administracao === profileData.institutionType) {
            compatibilidade += 1;
          }

          if (profileData.aceita_fies && fac.aceita_fies) {
            compatibilidade += 1;
          }

          if (profileData.aceita_estrangeiro && fac.aceita_estrangeiro) {
            compatibilidade += 1;
          }

          // Garantir que está dentro dos limites
          compatibilidade = Math.max(
            minCompatibilidade,
            Math.min(maxCompatibilidade, Math.round(compatibilidade))
          );

          return {
            nome: fac.nome || 'Instituição',
            compatibilidade,
            tipoProcesso: fac.processo || 'Análise de Perfil',
            mensalidade: fac.mensalidade
              ? fac.mensalidade
              : fac.administracao === 'Pública'
              ? 'Gratuita'
              : 'Não informado',
            distancia: `${fac.cidade}, ${fac.sigla}` || 'N/A',
            regiao: fac.regiao,
            proximaVaga: 'Consultar instituição',
            diferenciais: [
              fac.administracao === 'Pública'
                ? 'Ensino gratuito'
                : 'Instituição privada',
              fac.aceita_fies ? 'Aceita FIES' : 'Não aceita FIES',
              fac.aceita_estrangeiro
                ? 'Aceita estrangeiros'
                : 'Apenas brasileiros',
              fac.obtem_novo_titulo ? 'Novo título médico' : 'Transferência',
            ].filter(Boolean),
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));

      if (faculdades.length === 0) {
        faculdades.push({
          nome: 'Nenhuma universidade encontrada com os critérios do aluno',
          compatibilidade: 0,
          tipoProcesso: 'N/A',
          mensalidade: 'N/A',
          distancia: 'N/A',
          proximaVaga: 'N/A',
          diferenciais: [
            'Ajuste os filtros no perfil do aluno',
            'Ou adicione mais universidades no sistema',
          ],
        });
      }

      console.log('Faculdades processadas:', faculdades);
      setFaculdadesRecomendadas(faculdades);
    } catch (error) {
      console.error('Erro ao buscar faculdades:', error);
      setFaculdadesRecomendadas([
        {
          nome: 'Erro ao carregar universidades',
          compatibilidade: 0,
          tipoProcesso: 'Erro',
          mensalidade: 'N/A',
          distancia: 'N/A',
          proximaVaga: 'N/A',
          diferenciais: ['Verifique a conexão com o banco de dados'],
        },
      ]);
    } finally {
      setLoadingFaculdades(false);
    }
  };

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      console.log('=== INICIANDO BUSCA DE ANÁLISES ===');

      // Buscar análises com informações do usuário
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Análises encontradas:', analysesData?.length || 0);
      console.log(
        'Dados completos das análises:',
        JSON.stringify(analysesData, null, 2)
      );

      // Log detalhado de cada análise
      if (analysesData && analysesData.length > 0) {
        analysesData.forEach((a, index) => {
          console.log(`Análise ${index + 1}:`, {
            id: a.id,
            user_id: a.user_id,
            student_name: a.student_name,
            created_at: a.created_at,
            has_profile_data: !!a.profile_data_json,
            profile_fullName: a.profile_data_json?.fullName,
          });
        });
      }

      if (analysesError) {
        console.error('Erro ao buscar análises:', analysesError);
        throw analysesError;
      }

      if (!analysesData || analysesData.length === 0) {
        console.log('Nenhuma análise encontrada no banco');
        setAnalyses([]);
        setLoading(false);
        return;
      }

      // Buscar informações dos usuários (apenas para user_id válidos)
      const userIds = [
        ...new Set(
          analysesData.map((a) => a.user_id).filter((id) => id !== null)
        ),
      ];
      console.log('User IDs para buscar perfis:', userIds);

      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        console.log('Perfis encontrados:', profiles?.length || 0);
        console.log('Dados dos perfis:', profiles);

        if (profilesError) {
          console.error('Erro ao buscar perfis:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Criar mapa de usuários
      const userMap = {};
      if (profilesData) {
        profilesData.forEach((profile) => {
          userMap[profile.user_id] = profile;
        });
      }

      // Adicionar informações do usuário às análises
      // Prioridade: user_profiles.full_name > analyses.student_name > "Usuário não identificado"
      const analysesWithUsers = analysesData.map((analysis) => {
        const userName =
          analysis.user_id && userMap[analysis.user_id]?.full_name
            ? userMap[analysis.user_id].full_name
            : analysis.student_name || 'Usuário não identificado';

        const userAvatar =
          analysis.user_id && userMap[analysis.user_id]?.avatar_url
            ? userMap[analysis.user_id].avatar_url
            : null;

        console.log(`Análise ID ${analysis.id}:`, {
          user_id: analysis.user_id,
          student_name: analysis.student_name,
          profile_found: !!userMap[analysis.user_id],
          final_user_name: userName,
        });

        return {
          ...analysis,
          user_name: userName,
          user_avatar: userAvatar,
        };
      });

      console.log(
        '=== TOTAL DE ANÁLISES CARREGADAS:',
        analysesWithUsers.length,
        '==='
      );
      console.log(
        'Análises processadas:',
        analysesWithUsers.map((a) => ({
          id: a.id,
          user_name: a.user_name,
          user_id: a.user_id,
          student_name: a.student_name,
        }))
      );
      setAnalyses(analysesWithUsers || []);
    } catch (error) {
      console.error('Erro ao buscar análises:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar análises',
        description: 'Não foi possível carregar as análises.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (analysisId) => {
    if (!confirm('Tem certeza que deseja excluir esta análise?')) return;

    console.log('Tentando excluir análise:', analysisId);

    try {
      const { data, error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId)
        .select();

      console.log('Resultado da exclusão:', { data, error });

      if (error) throw error;

      toast({
        title: 'Análise excluída',
        description: 'A análise foi removida com sucesso.',
      });

      fetchAnalyses();
    } catch (error) {
      console.error('Erro ao excluir análise:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a análise.',
      });
    }
  };

  // Buscar todas as faculdades disponíveis
  const fetchTodasFaculdades = async () => {
    try {
      const { data, error } = await supabase
        .from('faculdades')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTodasFaculdades(data || []);
    } catch (error) {
      console.error('Erro ao buscar faculdades:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar a lista de faculdades.',
      });
    }
  };

  // Adicionar faculdade à recomendação do aluno
  const handleAdicionarFaculdade = (faculdade) => {
    // Verificar se já existe
    const jaExiste = faculdadesRecomendadas.some((f) => f.id === faculdade.id);
    if (jaExiste) {
      toast({
        title: 'Faculdade já adicionada',
        description: 'Esta instituição já está na lista de recomendações.',
      });
      return;
    }

    // Calcular compatibilidade padrão
    const profileData = viewDetailAnalysis.profile_data_json || {};
    const isExterior =
      profileData.studentLocation === 'Exterior' ||
      profileData.aceita_estrangeiro === true;
    const maxCompatibilidade = isExterior ? 89 : 92;

    // Criar objeto de faculdade recomendada
    const novaFaculdade = {
      id: faculdade.id,
      nome: faculdade.nome || 'Instituição',
      compatibilidade:
        Math.floor(Math.random() * (maxCompatibilidade - 75 + 1)) + 75,
      tipoProcesso: faculdade.processo || 'Análise de Perfil',
      mensalidade:
        faculdade.mensalidade ||
        (faculdade.administracao === 'Pública'
          ? 'Gratuita'
          : 'Consultar instituição'),
      distancia: `${faculdade.cidade}, ${faculdade.sigla}` || 'N/A',
      regiao: faculdade.regiao,
      proximaVaga: 'Consultar instituição',
      diferenciais: [
        faculdade.administracao === 'Pública'
          ? 'Ensino gratuito'
          : 'Instituição privada',
        faculdade.aceita_fies ? 'Aceita FIES' : 'Não aceita FIES',
        faculdade.aceita_estrangeiro
          ? 'Aceita estrangeiros'
          : 'Apenas brasileiros',
      ].filter(Boolean),
    };

    setFaculdadesRecomendadas([...faculdadesRecomendadas, novaFaculdade]);
    setShowAddFaculdadeModal(false);
    setSearchFaculdade('');

    toast({
      title: 'Faculdade adicionada!',
      description: `${faculdade.nome} foi adicionada às recomendações.`,
    });
  };

  // Remover faculdade da recomendação
  const handleRemoverFaculdade = (faculdadeId) => {
    const faculdade = faculdadesRecomendadas.find(
      (f) => f.id === faculdadeId || f.nome === faculdadeId
    );
    setFaculdadesRecomendadas(
      faculdadesRecomendadas.filter(
        (f) => f.id !== faculdadeId && f.nome !== faculdadeId
      )
    );

    toast({
      title: 'Faculdade removida',
      description: `${
        faculdade?.nome || 'A instituição'
      } foi removida das recomendações.`,
    });
  };

  // Abrir modal de adicionar
  const abrirModalAdicionar = () => {
    setShowAddFaculdadeModal(true);
    if (todasFaculdades.length === 0) {
      fetchTodasFaculdades();
    }
  };

  // Função para download de PDF
  const handleDownloadPDF = async () => {
    if (!contentRef.current || downloadingPDF) return;

    setDownloadingPDF(true);
    toast({
      title: 'Gerando PDF...',
      description: 'Aguarde enquanto preparamos o relatório.',
    });

    try {
      const element = contentRef.current;

      // Scroll para o topo antes de capturar
      window.scrollTo(0, 0);

      // Aguardar um pouco para garantir que tudo renderizou
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#0f172a',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        'JPEG',
        0,
        position,
        imgWidth,
        imgHeight,
        '',
        'FAST'
      );
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          position,
          imgWidth,
          imgHeight,
          '',
          'FAST'
        );
        heightLeft -= pdfHeight;
      }
      const studentName = viewDetailAnalysis.student_name || 'Aluno';
      const fileName = `Raio-X-${studentName.replace(/\s+/g, '-')}-${new Date()
        .toLocaleDateString('pt-BR')
        .replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O relatório foi baixado.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório.',
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    const matchesSearch =
      (analysis.user_name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (analysis.profile_data_json?.fullName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (analysis.student_name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const hasAIResult = analysis.ai_analysis_result_json != null;

    if (statusFilter === 'completed' && !hasAIResult) return false;
    if (statusFilter === 'pending' && hasAIResult) return false;

    return matchesSearch;
  });

  console.log('=== FILTRO APLICADO ===');
  console.log('Total de análises:', analyses.length);
  console.log('Após filtro:', filteredAnalyses.length);
  console.log('Termo de busca:', searchTerm);
  console.log('Filtro de status:', statusFilter);

  const getStatusBadge = (analysis) => {
    const hasAIResult = analysis.ai_analysis_result_json != null;

    if (hasAIResult) {
      return (
        <Badge className='bg-green-500'>
          <CheckCircle className='mr-1 h-3 w-3' />
          Concluído
        </Badge>
      );
    }

    return (
      <Badge className='bg-yellow-500'>
        <Clock className='mr-1 h-3 w-3' />
        Pendente
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando análises...</p>
        </div>
      </div>
    );
  }

  // Visualização Detalhada do Raio-X
  if (viewDetailAnalysis) {
    const profileData = viewDetailAnalysis.profile_data_json || {};
    const aiResult = viewDetailAnalysis.ai_analysis_result_json || {};
    const studentName =
      viewDetailAnalysis.student_name || profileData.fullName || 'Aluno';

    // Processar pontos fortes e áreas de melhoria de forma inteligente
    const processarPontosFortes = (points) => {
      if (!points || !Array.isArray(points)) return [];

      const palavrasPositivas = [
        'forte',
        'fortes',
        'excelente',
        'excelentes',
        'boa',
        'boas',
        'ótima',
        'ótimas',
        'adequad',
        'destaca',
        'destaque',
        'positivo',
        'alta',
        'alto',
        'superior',
        'competente',
        'qualificad',
        'consistente',
        'sólid',
        'bem desenvolvid',
      ];

      return points.filter((point) => {
        const lower = point.toLowerCase();
        return palavrasPositivas.some((palavra) => lower.includes(palavra));
      });
    };

    const processarAreasMelhoria = (points) => {
      if (!points || !Array.isArray(points)) return [];

      const palavrasNegativas = [
        'melhor',
        'desenvolv',
        'necessit',
        'precis',
        'deve',
        'consider',
        'atenç',
        'frágil',
        'fragilidad',
        'baixo',
        'baixa',
        'insuficient',
        'limitad',
        'deficient',
        'trabalh',
        'aprimor',
        'reforç',
        'complement',
      ];

      const palavrasPositivas = [
        'forte',
        'fortes',
        'excelente',
        'excelentes',
        'boa',
        'boas',
        'ótima',
        'ótimas',
        'adequad',
        'destaca',
        'destaque',
        'positivo',
        'alta',
        'alto',
        'superior',
      ];

      return points.filter((point) => {
        const lower = point.toLowerCase();
        const temNegativa = palavrasNegativas.some((palavra) =>
          lower.includes(palavra)
        );
        const temPositiva = palavrasPositivas.some((palavra) =>
          lower.includes(palavra)
        );
        return temNegativa || (!temPositiva && point.length > 10);
      });
    };

    const pontosFortes = processarPontosFortes(aiResult.improvementPoints);
    const areasMelhoria = processarAreasMelhoria(aiResult.improvementPoints);

    // Processar próximos passos
    const proximosPassos = aiResult.nextSteps || [];

    return (
      <>
        <Helmet>
          <title>Detalhes do Raio-X - {studentName} - Admin</title>
        </Helmet>

        <div className='min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900 p-6'>
          <div ref={contentRef} className='max-w-7xl mx-auto'>
            <div className='flex items-center justify-between mb-6'>
              <Button
                variant='ghost'
                onClick={() => setViewDetailAnalysis(null)}
                className='text-white hover:bg-white/10'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Voltar para Lista
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              >
                {downloadingPDF ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className='mr-2 h-4 w-4' />
                    Baixar PDF
                  </>
                )}
              </Button>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-center mb-12'
            >
              <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full mb-4'>
                <BrainCircuit className='h-10 w-10 text-white' />
              </div>
              <h1 className='text-4xl md:text-5xl font-bold text-white mb-2'>
                Raio-X Acadêmico
              </h1>
              <p className='text-xl text-blue-200'>{studentName}</p>
              <Badge className='mt-2 bg-cyan-500'>
                {viewDetailAnalysis.compatibility_percentage}% Compatibilidade
              </Badge>
            </motion.div>

            {/* Dados Completos do Formulário */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='mb-8'
            >
              <Card className='bg-white/10 backdrop-blur-lg border-white/20'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-white text-2xl'>
                    <FileText className='h-7 w-7 text-cyan-400' />
                    Dados do Formulário Completo
                  </CardTitle>
                  <CardDescription className='text-blue-200'>
                    Todas as informações preenchidas pelo aluno
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    {/* Informações Pessoais */}
                    <div>
                      <h3 className='text-lg font-bold text-cyan-300 mb-3 flex items-center gap-2'>
                        <User className='h-5 w-5' />
                        Informações Pessoais
                      </h3>
                      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white/5 p-4 rounded-lg'>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Nome Completo
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.fullName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Localização
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.studentLocation || 'N/A'}
                          </p>
                        </div>
                        {profileData.originCountry && (
                          <div>
                            <p className='text-blue-300 text-sm mb-1'>
                              País de Origem
                            </p>
                            <p className='text-white font-semibold'>
                              {profileData.originCountry}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informações Acadêmicas */}
                    <div>
                      <h3 className='text-lg font-bold text-green-300 mb-3 flex items-center gap-2'>
                        <GraduationCap className='h-5 w-5' />
                        Informações Acadêmicas
                      </h3>
                      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white/5 p-4 rounded-lg'>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Instituição Atual
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.currentInstitution || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>Semestre</p>
                          <p className='text-white font-semibold'>
                            {profileData.semester}º Semestre
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Documentos Disponíveis
                          </p>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {profileData.availableDocuments?.map((doc, i) => (
                              <Badge
                                key={i}
                                variant='outline'
                                className='text-xs bg-green-500/20 text-green-200 border-green-400/30'
                              >
                                {doc}
                              </Badge>
                            )) || <span className='text-white'>Nenhum</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferências de Transferência */}
                    <div>
                      <h3 className='text-lg font-bold text-purple-300 mb-3 flex items-center gap-2'>
                        <Target className='h-5 w-5' />
                        Preferências de Transferência
                      </h3>
                      <div className='grid md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg'>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Estados de Interesse
                          </p>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {profileData.statesOfInterest?.map((state, i) => (
                              <Badge
                                key={i}
                                className='bg-blue-500/20 text-blue-200 border-blue-400/30'
                              >
                                {state}
                              </Badge>
                            )) || <span className='text-white'>Nenhum</span>}
                          </div>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Tipo de Instituição
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.institutionType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Método de Seleção
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.selectionMethod || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Objetivo da Transferência
                          </p>
                          <p className='text-white text-sm'>
                            {profileData.transferObjective || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Perfil de Estudos */}
                    <div>
                      <h3 className='text-lg font-bold text-yellow-300 mb-3 flex items-center gap-2'>
                        <Clock className='h-5 w-5' />
                        Perfil de Estudos e Financeiro
                      </h3>
                      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-4 rounded-lg'>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Horas de Estudo/Semana
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.weeklyStudyHours || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Situação Profissional
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.professionalSituation || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Capacidade Mensal
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.monthlyCapacity || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-blue-300 text-sm mb-1'>
                            Principal Dificuldade
                          </p>
                          <p className='text-white font-semibold'>
                            {profileData.mainDifficulty || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filtros Especiais */}
                    <div>
                      <h3 className='text-lg font-bold text-pink-300 mb-3 flex items-center gap-2'>
                        <Filter className='h-5 w-5' />
                        Filtros Especiais
                      </h3>
                      <div className='grid md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          {profileData.aceita_fies ? (
                            <CheckCircle className='h-5 w-5 text-green-400' />
                          ) : (
                            <X className='h-5 w-5 text-red-400' />
                          )}
                          <p className='text-white'>Precisa de FIES</p>
                        </div>
                        <div className='flex items-center gap-2'>
                          {profileData.aceita_estrangeiro ? (
                            <CheckCircle className='h-5 w-5 text-green-400' />
                          ) : (
                            <X className='h-5 w-5 text-red-400' />
                          )}
                          <p className='text-white'>Aluno do Exterior</p>
                        </div>
                        <div className='flex items-center gap-2'>
                          {profileData.obtem_novo_titulo ? (
                            <CheckCircle className='h-5 w-5 text-green-400' />
                          ) : (
                            <X className='h-5 w-5 text-red-400' />
                          )}
                          <p className='text-white'>Novo Título</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pontos Fortes e Áreas de Melhoria */}
            <div className='grid md:grid-cols-2 gap-6 mb-8'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className='bg-white/10 backdrop-blur-lg border-white/20'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-white'>
                      <TrendingUp className='h-6 w-6 text-green-400' />
                      Pontos Fortes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {pontosFortes && pontosFortes.length > 0 ? (
                        pontosFortes.map((ponto, index) => (
                          <div
                            key={index}
                            className='flex items-start gap-2 text-blue-100'
                          >
                            <CheckCircle className='h-5 w-5 text-green-400 flex-shrink-0 mt-0.5' />
                            <span>{ponto}</span>
                          </div>
                        ))
                      ) : (
                        <p className='text-blue-300'>
                          Nenhum ponto forte identificado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className='bg-white/10 backdrop-blur-lg border-white/20'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-white'>
                      <AlertTriangle className='h-6 w-6 text-yellow-400' />
                      Áreas de Melhoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {aiResult.areasMelhoria &&
                      aiResult.areasMelhoria.length > 0 ? (
                        aiResult.areasMelhoria.map((area, index) => (
                          <div
                            key={index}
                            className='flex items-start gap-2 text-blue-100'
                          >
                            <AlertTriangle className='h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5' />
                            <span>{area}</span>
                          </div>
                        ))
                      ) : (
                        <p className='text-blue-300'>
                          Nenhuma área identificada
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Faculdades Recomendadas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='mb-8'
            >
              <Card className='bg-white/10 backdrop-blur-lg border-white/20'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='flex items-center gap-2 text-white text-2xl'>
                        <GraduationCap className='h-7 w-7 text-cyan-400' />
                        Faculdades Recomendadas
                      </CardTitle>
                      <CardDescription className='text-blue-200'>
                        Instituições mais compatíveis com o perfil do aluno
                      </CardDescription>
                    </div>
                    <Button
                      onClick={abrirModalAdicionar}
                      className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Adicionar Faculdade
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {loadingFaculdades ? (
                    <div className='text-center py-8'>
                      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4'></div>
                      <p className='text-blue-200'>
                        Carregando universidades recomendadas...
                      </p>
                    </div>
                  ) : faculdadesRecomendadas &&
                    faculdadesRecomendadas.length > 0 ? (
                    faculdadesRecomendadas.map((faculdade, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className='bg-white/5 p-6 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all'
                      >
                        <div className='flex items-start justify-between mb-4'>
                          <div className='flex-1'>
                            <h3 className='text-xl font-bold text-white mb-2'>
                              {faculdade.nome}
                            </h3>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <Badge className='bg-cyan-500'>
                                {faculdade.compatibilidade}% compatível
                              </Badge>
                              {faculdade.tipoProcesso && (
                                <Badge
                                  variant='outline'
                                  className='text-blue-200 border-blue-400'
                                >
                                  {faculdade.tipoProcesso}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() =>
                              handleRemoverFaculdade(
                                faculdade.id || faculdade.nome
                              )
                            }
                            className='ml-4'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>

                        <div className='grid md:grid-cols-3 gap-4 mb-4'>
                          {faculdade.mensalidade && (
                            <div className='flex items-center gap-2 text-blue-200'>
                              <DollarSign className='h-4 w-4' />
                              <span className='text-sm'>
                                {faculdade.mensalidade}
                              </span>
                            </div>
                          )}
                          {faculdade.distancia && (
                            <div className='flex items-center gap-2 text-blue-200'>
                              <MapPin className='h-4 w-4' />
                              <span className='text-sm'>
                                {faculdade.distancia}
                              </span>
                            </div>
                          )}
                          <div className='flex items-center gap-2 text-blue-200'>
                            <Building2 className='h-4 w-4' />
                            <span className='text-sm'>Campus Central</span>
                          </div>
                        </div>

                        {faculdade.diferenciais &&
                          faculdade.diferenciais.length > 0 && (
                            <div>
                              <p className='text-blue-300 text-sm mb-2'>
                                Diferenciais:
                              </p>
                              <div className='flex flex-wrap gap-2'>
                                {faculdade.diferenciais.map((dif, i) => (
                                  <Badge
                                    key={i}
                                    variant='outline'
                                    className='bg-white/5 text-white border-white/20'
                                  >
                                    {dif}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </motion.div>
                    ))
                  ) : (
                    <div className='text-center py-8'>
                      <GraduationCap className='h-16 w-16 text-white/20 mx-auto mb-4' />
                      <p className='text-blue-200'>
                        Nenhuma faculdade recomendada ainda
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Plano de Ação */}
            {proximosPassos && proximosPassos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className='bg-white/10 backdrop-blur-lg border-white/20'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-white text-2xl'>
                      <Target className='h-7 w-7 text-purple-400' />
                      Plano de Ação
                    </CardTitle>
                    <CardDescription className='text-blue-200'>
                      Próximos passos recomendados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-6'>
                      {proximosPassos.map((passo, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className='bg-white/5 p-5 rounded-xl border border-white/10'
                        >
                          <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-bold text-white'>
                              {passo.titulo}
                            </h3>
                            {passo.prazo && (
                              <Badge className='bg-purple-500'>
                                <Clock className='h-3 w-3 mr-1' />
                                {passo.prazo}
                              </Badge>
                            )}
                          </div>
                          {passo.tarefas && passo.tarefas.length > 0 && (
                            <ul className='space-y-2'>
                              {passo.tarefas.map((tarefa, i) => (
                                <li
                                  key={i}
                                  className='flex items-start gap-2 text-blue-200 text-sm'
                                >
                                  <ChevronRight className='h-4 w-4 flex-shrink-0 mt-0.5 text-cyan-400' />
                                  <span>{tarefa}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modal de Adicionar Faculdade */}
        <Dialog
          open={showAddFaculdadeModal}
          onOpenChange={setShowAddFaculdadeModal}
        >
          <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Plus className='h-5 w-5' />
                Adicionar Faculdade às Recomendações
              </DialogTitle>
              <DialogDescription>
                Selecione uma instituição para adicionar à lista de
                recomendações do aluno
              </DialogDescription>
            </DialogHeader>

            <div className='mt-4'>
              <div className='mb-4'>
                <Input
                  placeholder='Buscar faculdade...'
                  value={searchFaculdade}
                  onChange={(e) => setSearchFaculdade(e.target.value)}
                  className='w-full'
                />
              </div>

              <div className='space-y-2 max-h-96 overflow-y-auto'>
                {todasFaculdades
                  .filter(
                    (f) =>
                      f.nome
                        .toLowerCase()
                        .includes(searchFaculdade.toLowerCase()) ||
                      f.cidade
                        ?.toLowerCase()
                        .includes(searchFaculdade.toLowerCase()) ||
                      f.sigla
                        ?.toLowerCase()
                        .includes(searchFaculdade.toLowerCase())
                  )
                  .map((faculdade) => (
                    <div
                      key={faculdade.id}
                      className='p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
                      onClick={() => handleAdicionarFaculdade(faculdade)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-900'>
                            {faculdade.nome}
                          </h4>
                          <div className='flex items-center gap-2 mt-1 flex-wrap'>
                            <span className='text-sm text-gray-600'>
                              {faculdade.cidade}, {faculdade.sigla}
                            </span>
                            <Badge
                              variant={
                                faculdade.administracao === 'Pública'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {faculdade.administracao}
                            </Badge>
                            {faculdade.aceita_fies && (
                              <Badge variant='outline' className='text-xs'>
                                FIES
                              </Badge>
                            )}
                            {faculdade.aceita_estrangeiro && (
                              <Badge
                                variant='outline'
                                className='text-xs bg-blue-50'
                              >
                                Estrangeiros
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdicionarFaculdade(faculdade);
                          }}
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowAddFaculdadeModal(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Carregando análises...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Raio-X - Admin</title>
      </Helmet>

      <div className='p-6 max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-3 mb-2'>
            <BrainCircuit className='h-8 w-8 text-cyan-600' />
            <h1 className='text-3xl font-bold text-gray-900'>
              Gerenciar Raio-X Acadêmico
            </h1>
          </div>
          <p className='text-gray-600'>
            Visualize e gerencie todas as análises de perfil dos alunos
          </p>
        </div>

        {/* Filtros */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Buscar por nome do aluno...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  Todos ({analyses.length})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  <Clock className='mr-2 h-4 w-4' />
                  Pendentes
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                >
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Concluídos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Análises */}
        <div className='grid gap-4'>
          {filteredAnalyses.length === 0 ? (
            <Card>
              <CardContent className='py-12 text-center'>
                <FileText className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-500'>Nenhuma análise encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredAnalyses.map((analysis) => {
              const profileData = analysis.profile_data_json || {};
              const studentName =
                analysis.user_name ||
                profileData.fullName ||
                analysis.student_name ||
                'Usuário não identificado';
              const compatibility = analysis.compatibility_percentage || 0;

              console.log('Renderizando análise:', {
                id: analysis.id,
                user_name: analysis.user_name,
                student_name: analysis.student_name,
                profileData_fullName: profileData.fullName,
                final_studentName: studentName,
              });

              // Verifica se pode liberar antes do prazo
              const liberada = analysis.status === 'liberada';
              const createdDate = new Date(analysis.created_at);
              const now = new Date();
              const diffDays = Math.floor(
                (now - createdDate) / (1000 * 60 * 60 * 24)
              );
              const podeLiberar = !liberada && diffDays < 8;
              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className='hover:shadow-lg transition-shadow'>
                    <CardContent className='p-6'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-3'>
                            <User className='h-5 w-5 text-gray-400' />
                            <h3 className='text-xl font-semibold text-gray-900'>
                              {studentName}
                            </h3>
                            {getStatusBadge(analysis)}
                          </div>

                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                            <div>
                              <p className='text-sm text-gray-500'>
                                Data da Análise
                              </p>
                              <p className='font-medium flex items-center gap-1'>
                                <Calendar className='h-4 w-4' />
                                {new Date(
                                  analysis.created_at
                                ).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <p className='text-sm text-gray-500'>
                                Compatibilidade
                              </p>
                              <p className='font-medium text-cyan-600'>
                                {compatibility}%
                              </p>
                            </div>
                            <div>
                              <p className='text-sm text-gray-500'>
                                Instituição Atual
                              </p>
                              <p className='font-medium'>
                                {profileData.currentInstitution || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className='text-sm text-gray-500'>Semestre</p>
                              <p className='font-medium'>
                                {profileData.semester || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => setViewDetailAnalysis(analysis)}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              Ver Detalhes
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='text-red-600 hover:bg-red-50'
                              onClick={() => handleDelete(analysis.id)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Excluir
                            </Button>
                            {podeLiberar && (
                              <Button
                                size='sm'
                                className='bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                                onClick={() => handleLiberarRaioX(analysis.id)}
                              >
                                <CheckCircle className='mr-2 h-4 w-4' />
                                Liberar Raio-X
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default AdminRaioXPage;
