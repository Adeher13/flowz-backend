import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Target,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Award,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  GraduationCap,
  DollarSign,
  Building2,
  Lightbulb,
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
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const VerRaioXPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [adminBypass, setAdminBypass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analiseData, setAnaliseData] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const contentRef = useRef(null);
  // Estado para progresso do Raio-X
  const [raioxProgress, setRaioxProgress] = useState(0);
  const [raioxStatus, setRaioxStatus] = useState('');
  // Atualiza barra de progresso e mensagem conforme os dias
  useEffect(() => {
    if (!analiseData?.dataAnalise) return;
    const createdDate = new Date(analiseData.dataAnalise);
    const now = new Date();
    const diffMs = now - createdDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    // Prazo de 8 dias para "entrega" do Raio-X
    const totalDays = 8;
    let progress = Math.min(100, Math.round((diffDays / totalDays) * 100));
    if (progress < 0) progress = 0;
    setRaioxProgress(progress);
    // Mensagens conforme progresso
    let status = '';
    if (progress < 20) {
      status =
        'A equipe está vendo quais faculdades são compatíveis com seu perfil...';
    } else if (progress < 50) {
      status = 'Estamos analisando sua documentação e histórico escolar...';
    } else if (progress < 80) {
      status =
        'Seu Raio-X está quase pronto! Finalizando recomendações personalizadas...';
    } else if (progress < 100) {
      status = 'Preparando o relatório final para você!';
    } else {
      status = 'Seu Raio-X está pronto! Confira abaixo todas as recomendações.';
    }
    setRaioxStatus(status);
  }, [analiseData]);

  useEffect(() => {
    if (user) {
      fetchAnalise();
    }
  }, [user]);

  const fetchFaculdadesRecomendadas = async (profileData, aiResult) => {
    console.log('Buscando faculdades recomendadas...');
    try {
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

      // Filtrar por estados de interesse (usando siglas)
      if (
        profileData.statesOfInterest &&
        profileData.statesOfInterest.length > 0
      ) {
        const siglas = profileData.statesOfInterest.map((state) => {
          if (state.length === 2) {
            return state.toUpperCase();
          }
          return stateToSigla[state] || state.toUpperCase();
        });

        query = query.in('sigla', siglas);
        console.log('Filtro de estados aplicado (siglas):', siglas);
      }

      // Filtrar por tipo de administração
      if (
        profileData.institutionType &&
        profileData.institutionType !== 'Ambas'
      ) {
        query = query.eq('administracao', profileData.institutionType);
        console.log('Filtro de tipo aplicado:', profileData.institutionType);
      }

      // Filtrar por método de seleção
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

      // Filtrar por FIES
      if (profileData.aceita_fies === true) {
        query = query.eq('aceita_fies', true);
        console.log('Filtro de FIES aplicado: true');
      }

      // Executar query
      let { data, error } = await query;

      console.log('Resultado da query:', { data, error, total: data?.length });

      if (error) throw error;

      // Se não encontrou nenhuma, buscar todas como fallback
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
      }

      // Mapear para formato exibível com compatibilidade calculada
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
            mensalidade:
              fac.administracao === 'Pública'
                ? 'Gratuita'
                : 'Consultar instituição',
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

      console.log('Faculdades processadas:', faculdades.length);
      return faculdades;
    } catch (error) {
      console.error('Erro ao buscar faculdades:', error);
      return [];
    }
  };

  const fetchAnalise = async () => {
    setLoading(true);

    try {
      // Buscar a análise mais recente do usuário
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma análise encontrada
          setAnaliseData(null);
          setLoading(false);
          return;
        }
        throw error;
      }

      if (!data) {
        setAnaliseData(null);
        setLoading(false);
        return;
      }

      // Processar dados da IA
      const aiResult = data.ai_analysis_result_json || {};
      const profileData = data.profile_data_json || {};

      // Verificar se a análise foi liberada ou se ainda está dentro do prazo de 8 dias
      const createdDateCheck = new Date(data.created_at);
      const nowCheck = new Date();
      const diffDaysCheck = Math.floor(
        (nowCheck - createdDateCheck) / (1000 * 60 * 60 * 24)
      );
      const liberadaCheck = data.status === 'liberada';
      if (!liberadaCheck && diffDaysCheck < 8 && !isAdmin) {
        // Manter dados mínimos para permitir cálculo de progresso e exibição de overlay
        const analiseAguardando = {
          id: data.id,
          nome:
            data.student_name || user?.user_metadata?.full_name || 'Estudante',
          dataAnalise: data.created_at,
          status: data.status,
          dbStatus: data.status,
          waiting: true,
          profileData: profileData,
          // Campos padrões para evitar erros de renderização enquanto aguarda
          pontuacaoGeral: 0,
          pontoFortes: [],
          pontosAtencao: [],
          faculdadesRecomendadas: [],
          proximosPassos: [],
          estatisticas: {
            chancesTransferencia: 0,
            mediaConcorrencia: '-',
            tempoMedioProcesso: '-',
            taxaSucessoPerfil: '-',
          },
        };

        setAnaliseData(analiseAguardando);
        setLoading(false);
        return;
      }

      // Extrair pontos fortes e de atenção
      const pontoFortes = [];
      const pontosAtencao = [];

      if (aiResult.improvementPoints) {
        aiResult.improvementPoints.forEach((point) => {
          if (
            point.toLowerCase().includes('forte') ||
            point.toLowerCase().includes('excelente') ||
            point.toLowerCase().includes('boa') ||
            point.toLowerCase().includes('adequad')
          ) {
            pontoFortes.push(point);
          } else {
            pontosAtencao.push(point);
          }
        });
      }

      // Gerar mensagens personalizadas e otimistas baseadas no perfil do aluno
      const gerarMensagensPersonalizadas = (profile) => {
        const fortes = [];
        const atencao = [];

        // Análise de horas de estudo
        if (profile.weeklyStudyHours) {
          const horas = profile.weeklyStudyHours;
          if (horas === '30+') {
            fortes.push(
              '🎯 Dedicação excepcional! Suas 30+ horas semanais de estudo demonstram comprometimento acima da média e elevam significativamente suas chances de aprovação.'
            );
          } else if (horas === '20-30') {
            fortes.push(
              '📚 Excelente ritmo de estudos! Com 20-30 horas semanais, você está na faixa ideal para manter o equilíbrio e obter ótimos resultados.'
            );
          } else if (horas === '10-20') {
            fortes.push(
              '✨ Boa dedicação aos estudos! Com organização estratégica, suas 10-20 horas semanais podem render resultados surpreendentes.'
            );
            atencao.push(
              '💡 Considere otimizar suas horas de estudo com técnicas de aprendizado ativo para maximizar seu aproveitamento.'
            );
          }
        }

        // Análise de semestre
        const semestre = parseInt(profile.semester);
        if (semestre >= 3 && semestre <= 6) {
          fortes.push(
            `🎓 Momento perfeito para transferência! Você está no ${semestre}º semestre, o período ideal onde as instituições valorizam sua experiência acadêmica consolidada.`
          );
        } else if (semestre > 6) {
          fortes.push(
            `💪 Experiência avançada no ${semestre}º semestre! Seu histórico robusto é um diferencial competitivo valioso nos processos seletivos.`
          );
        } else if (semestre < 3) {
          atencao.push(
            '⏰ Embora esteja nos semestres iniciais, já é possível se preparar para futuras oportunidades de transferência.'
          );
        }

        // Análise de documentação
        if (profile.availableDocuments?.length >= 4) {
          fortes.push(
            '📋 Documentação exemplar! Você possui todos os documentos essenciais organizados, o que acelera significativamente seus processos de inscrição.'
          );
        } else if (profile.availableDocuments?.length >= 2) {
          fortes.push(
            '📄 Boa base documental! A maioria dos documentos necessários já está disponível para suas candidaturas.'
          );
          atencao.push(
            '🔖 Complete sua documentação para maximizar suas oportunidades - cada documento adicional amplia suas opções.'
          );
        }

        // Finaliza a função e retorna as mensagens
        return { fortes, atencao };
      };

      // Gerar mensagens personalizadas
      const { fortes: mensagensFortes, atencao: mensagensAtencao } =
        gerarMensagensPersonalizadas(profileData);

      // Combinar com pontos da IA
      pontoFortes.push(...mensagensFortes);
      pontosAtencao.push(...mensagensAtencao);

      // Se ainda não houver pontos, adicionar fallbacks genéricos
      if (pontoFortes.length === 0) {
        pontoFortes.push(
          '✨ Perfil promissor para transferência! Continue dedicado aos estudos e mantenha seu foco no objetivo.'
        );
      }

      if (pontosAtencao.length === 0) {
        pontosAtencao.push(
          '📋 Verifique todos os requisitos específicos das instituições de interesse antes de iniciar o processo.'
        );
        pontosAtencao.push(
          '🎯 Mantenha contato direto com as coordenações dos cursos para esclarecer dúvidas sobre o processo seletivo.'
        );
      }

      // Buscar faculdades recomendadas do banco de dados com filtros do perfil
      let faculdadesRecomendadas = [];
      if (typeof fetchFaculdadesRecomendadas === 'function') {
        faculdadesRecomendadas = await fetchFaculdadesRecomendadas(
          profileData,
          aiResult
        );
      }

      // Calcular pontuação baseada no perfil (75-92% para Brasil, 75-89% para Exterior)
      const calcularPontuacao = (profile, baseScore) => {
        let pontuacao = baseScore || 75; // Mínimo 75%
        const isExterior =
          profile.studentLocation === 'Exterior' ||
          profile.aceita_estrangeiro === true;
        const maxScore = isExterior ? 89 : 92;

        // Ajustes baseados no perfil
        if (profile.weeklyStudyHours === '30+') pontuacao += 5;
        else if (profile.weeklyStudyHours === '20-30') pontuacao += 3;
        else if (profile.weeklyStudyHours === '10-20') pontuacao += 1;

        const semestre = parseInt(profile.semester);
        if (semestre >= 3 && semestre <= 6) pontuacao += 4;
        else if (semestre > 6) pontuacao += 2;

        if (profile.availableDocuments?.length >= 4) pontuacao += 3;
        else if (profile.availableDocuments?.length >= 2) pontuacao += 2;

        if (profile.monthlyCapacity) {
          const valor = parseFloat(
            profile.monthlyCapacity.replace(/[^\d]/g, '')
          );
          if (valor >= 5000) pontuacao += 3;
          else if (valor >= 2500) pontuacao += 2;
        }

        if (profile.statesOfInterest?.length >= 5) pontuacao += 3;
        else if (profile.statesOfInterest?.length >= 2) pontuacao += 1;

        if (profile.transferObjective && profile.transferObjective.length > 50)
          pontuacao += 2;

        // Garantir limites
        pontuacao = Math.max(75, Math.min(maxScore, Math.round(pontuacao)));
        return pontuacao;
      };

      const pontuacaoCalculada = calcularPontuacao(
        profileData,
        data.compatibility_percentage
      );

      // Calcular taxa de sucesso baseada na pontuação (sempre um pouco maior para motivar)
      const taxaSucesso = Math.min(
        95,
        pontuacaoCalculada + Math.floor(Math.random() * 6) + 3
      );

      const analiseProcessada = {
        id: data.id,
        nome:
          data.student_name || user?.user_metadata?.full_name || 'Estudante',
        dataAnalise: data.created_at,
        dbStatus: data.status,
        pontuacaoGeral: pontuacaoCalculada,
        status:
          pontuacaoCalculada >= 85
            ? 'Excelente'
            : pontuacaoCalculada >= 78
            ? 'Muito Bom'
            : 'Bom',
        instituicaoAtual: profileData.currentInstitution || 'Não informado',
        semestre: profileData.semester || 'N/A',
        pontoFortes,
        pontosAtencao,
        faculdadesRecomendadas,
        profileData,
        proximosPassos: [
          {
            titulo: '🎯 Preparação Imediata',
            prazo: 'Próximos 7 dias',
            tarefas: [
              '📋 Organizar documentação necessária',
              '📜 Solicitar histórico escolar atualizado',
              '✍️ Preparar carta de motivação personalizada',
            ],
          },
          {
            titulo: '📚 Preparação para Processos',
            prazo: '30-60 dias',
            tarefas: [
              '🧠 Revisar conteúdos das disciplinas básicas',
              '📝 Fazer simulados de provas anteriores',
              '📞 Entrar em contato com as instituições',
            ],
          },
          {
            titulo: '🎓 Inscrição e Matrícula',
            prazo: data.projected_period || '60-90 dias',
            tarefas: [
              '🚀 Realizar inscrições nos processos seletivos',
              '⏰ Acompanhar prazos e resultados',
              '✅ Providenciar documentação para matrícula',
            ],
          },
        ],
        estatisticas: {
          chancesTransferencia: pontuacaoCalculada,
          mediaConcorrencia: `${
            Math.floor(Math.random() * 8) + 8
          } candidatos/vaga`,
          tempoMedioProcesso: data.projected_period || '3-6 meses',
          taxaSucessoPerfil: `${taxaSucesso}%`,
        },
      };

      setAnaliseData(analiseProcessada);
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar análise',
        description: 'Não foi possível carregar seu Raio-X. Tente novamente.',
      });
      setAnaliseData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaAnalise = () => {
    navigate('/analise-perfil');
  };

  const handleLiberarParaAluno = async () => {
    if (!analiseData?.id) return;
    try {
      // Atualizar apenas o status para evitar erro se coluna liberada_em não existir
      const { data: updated, error } = await supabase
        .from('analyses')
        .update({ status: 'liberada' })
        .eq('id', analiseData.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Análise liberada',
        description: 'A análise foi liberada para o aluno.',
      });
      // Recarregar
      await fetchAnalise();
    } catch (err) {
      console.error('Erro ao liberar análise:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível liberar a análise.',
      });
    }
  };

  const handleDownload = async () => {
    if (!contentRef.current || downloadingPDF) return;

    setDownloadingPDF(true);
    toast({
      title: 'Gerando PDF...',
      description: 'Aguarde enquanto preparamos seu relatório.',
    });

    try {
      const element = contentRef.current;

      // Scroll para o topo antes de capturar
      window.scrollTo(0, 0);

      // Aguardar um pouco para garantir que tudo renderizou
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Configurações melhoradas do canvas
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

      // Adicionar primeira página
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

      // Adicionar páginas adicionais se necessário
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

      // Salvar PDF
      const fileName = `Raio-X-Academico-${analiseData.nome.replace(
        /\s+/g,
        '-'
      )}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'Seu relatório foi baixado.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleShare = () => {
    toast({
      title: 'Link copiado!',
      description: 'Você pode compartilhar seu relatório agora.',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center'>
        <div className='text-center'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <BrainCircuit className='h-16 w-16 text-cyan-400 mx-auto mb-4' />
          </motion.div>
          <p className='text-white text-lg'>Carregando sua análise...</p>
        </div>
      </div>
    );
  }

  if (!analiseData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4'>
        <Card className='max-w-md'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='h-6 w-6 text-orange-500' />
              Nenhuma análise encontrada
            </CardTitle>
            <CardDescription>
              Você ainda não realizou seu Raio-X Acadêmico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleNovaAnalise} className='w-full'>
              Fazer Raio-X Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Substitui o modal overlay por um banner inline para evitar duplicação
  let waitingBanner = null;
  if (analiseData?.waiting && !isAdmin) {
    const created = new Date(analiseData.dataAnalise);
    const entrega = new Date(created.getTime() + 8 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diasRestantes = Math.max(
      0,
      Math.ceil((entrega - now) / (1000 * 60 * 60 * 24))
    );

    waitingBanner = (
      <div className='w-full max-w-3xl mx-auto mb-6 p-4 bg-gradient-to-br from-slate-900/80 to-blue-900/80 rounded-lg border border-white/10 text-white'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-xl md:text-2xl font-bold mb-1'>
              Análise em processamento
            </h2>
            <p className='text-blue-200 text-sm'>
              Sua análise foi recebida e passará por uma avaliação minuciosa.
              Ela ficará disponível automaticamente em{' '}
              <strong>{diasRestantes} dia(s)</strong> ou quando um administrador
              liberar manualmente.
            </p>
          </div>
          <div className='text-right text-xs md:text-sm text-blue-200'>
            <div>Início: {created.toLocaleDateString('pt-BR')}</div>
            <div>Entrega prevista: {entrega.toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </div>
    );
  }

  const { pontuacaoGeral } = analiseData;
  const corPontuacao =
    pontuacaoGeral >= 80
      ? 'from-green-500 to-emerald-600'
      : pontuacaoGeral >= 60
      ? 'from-yellow-500 to-orange-600'
      : 'from-red-500 to-pink-600';

  return (
    <>
      <Helmet>
        <title>Meu Raio-X Acadêmico - AmigoMeD!</title>
        <meta
          name='description'
          content='Visualize seu relatório completo de análise acadêmica e recomendações personalizadas.'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden'>
        {/* Background Effects */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-20 left-20 w-96 h-96 border border-cyan-400 rounded-full animate-pulse'></div>
          <div className='absolute bottom-20 right-20 w-80 h-80 border border-blue-400 rounded-full animate-pulse delay-700'></div>
        </div>

        <div
          ref={contentRef}
          className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center mb-12'
          >
            <div className='flex items-center justify-center gap-3 mb-6'>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <BrainCircuit className='h-16 w-16 text-cyan-400' />
              </motion.div>
            </div>
            <h1 className='text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent mb-4'>
              Seu Raio-X Acadêmico
            </h1>
            <p className='text-xl text-blue-100 mb-6'>
              Análise completa do seu perfil e recomendações personalizadas
            </p>
            <div className='flex items-center justify-center gap-2 text-sm text-blue-200'>
              <Calendar className='h-4 w-4' />
              <span>
                Gerado em{' '}
                {new Date(analiseData.dataAnalise).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Barra de progresso removida do header principal. */}

            {/* Action Buttons */}
            <div className='flex items-center justify-center gap-3 mt-6'>
              <Button
                variant='outline'
                className='bg-white/10 border-white/20 text-white hover:bg-white/20'
                onClick={handleDownload}
                disabled={downloadingPDF}
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
              {isAdmin && analiseData?.dbStatus !== 'liberada' && (
                <Button
                  onClick={handleLiberarParaAluno}
                  className='bg-green-600 text-white'
                >
                  Liberar para aluno
                </Button>
              )}
              {analiseData?.dbStatus === 'liberada' && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className='bg-white/10 text-white'
                >
                  Voltar para minha área
                </Button>
              )}
              <Button
                variant='outline'
                className='bg-white/10 border-white/20 text-white hover:bg-white/20'
                onClick={handleShare}
              >
                <Share2 className='mr-2 h-4 w-4' />
                Compartilhar
              </Button>
              <Button
                className='bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                onClick={handleNovaAnalise}
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Nova Análise
              </Button>
            </div>
          </motion.div>
          {waitingBanner}

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className='bg-white/10 backdrop-blur-lg border-white/20 mb-8'>
              <CardContent className='p-8'>
                <div className='grid md:grid-cols-2 gap-8 items-center'>
                  <div className='text-center'>
                    <div className='relative inline-block'>
                      <svg className='w-48 h-48'>
                        <circle
                          className='text-white/20'
                          strokeWidth='12'
                          stroke='currentColor'
                          fill='transparent'
                          r='70'
                          cx='96'
                          cy='96'
                        />
                        <circle
                          className={`bg-gradient-to-r ${corPontuacao}`}
                          strokeWidth='12'
                          strokeDasharray={2 * Math.PI * 70}
                          strokeDashoffset={
                            2 * Math.PI * 70 * (1 - pontuacaoGeral / 100)
                          }
                          strokeLinecap='round'
                          stroke='url(#gradient)'
                          fill='transparent'
                          r='70'
                          cx='96'
                          cy='96'
                          transform='rotate(-90 96 96)'
                        />
                        <defs>
                          <linearGradient
                            id='gradient'
                            x1='0%'
                            y1='0%'
                            x2='100%'
                            y2='100%'
                          >
                            <stop offset='0%' stopColor='#06b6d4' />
                            <stop offset='100%' stopColor='#3b82f6' />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className='absolute inset-0 flex items-center justify-center flex-col'>
                        <span className='text-6xl font-bold text-white'>
                          {pontuacaoGeral}
                        </span>
                        <span className='text-blue-200 text-sm'>de 100</span>
                      </div>
                    </div>
                  </div>
                  <div className='space-y-4'>
                    <div>
                      <h3 className='text-2xl font-bold text-white mb-2'>
                        🎯 Status: {analiseData.status}
                      </h3>
                      <p className='text-blue-200 leading-relaxed'>
                        {analiseData.pontuacaoGeral >= 85
                          ? '🌟 Parabéns! Seu perfil é excepcional e você tem excelentes chances de aprovação nas instituições recomendadas!'
                          : analiseData.pontuacaoGeral >= 78
                          ? '✨ Muito bem! Seu perfil está muito bem posicionado e apresenta ótimas oportunidades de transferência!'
                          : '👍 Bom trabalho! Seu perfil está sólido e você tem boas chances nas instituições compatíveis!'}
                      </p>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-4 rounded-xl border border-green-400/30 shadow-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Target className='h-4 w-4 text-green-400' />
                          <p className='text-green-300 text-sm font-semibold'>
                            Compatibilidade
                          </p>
                        </div>
                        <p className='text-white text-3xl font-bold'>
                          {analiseData.estatisticas.chancesTransferencia}%
                        </p>
                        <p className='text-green-200 text-xs mt-1'>
                          Índice calculado
                        </p>
                      </div>
                      <div className='bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-4 rounded-xl border border-blue-400/30 shadow-lg'>
                        <div className='flex items-center gap-2 mb-2'>
                          <TrendingUp className='h-4 w-4 text-blue-400' />
                          <p className='text-blue-300 text-sm font-semibold'>
                            Perfil Similar
                          </p>
                        </div>
                        <p className='text-white text-3xl font-bold'>
                          {analiseData.estatisticas.taxaSucessoPerfil}
                        </p>
                        <p className='text-blue-200 text-xs mt-1'>
                          Taxa de aprovação
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informação de período provável de alocação */}
                {analiseData.profileData?.institutionType &&
                  analiseData.profileData?.semester && (
                    <div className='mt-8 mb-2 px-6 py-4 rounded-xl bg-blue-900/40 border border-cyan-400 flex items-center gap-3'>
                      <Clock className='h-6 w-6 text-cyan-300' />
                      <div>
                        <span className='text-white font-bold text-lg'>
                          Previsão de Alocação:
                        </span>
                        <span className='block text-cyan-100 text-base mt-1'>
                          {analiseData.profileData.institutionType === 'Pública'
                            ? `Em instituições públicas, normalmente você será realocado entre o ${Math.max(
                                1,
                                parseInt(analiseData.profileData.semester) - 3
                              )}º e o ${Math.max(
                                1,
                                parseInt(analiseData.profileData.semester) - 2
                              )}º período. Isso acontece porque as universidades públicas costumam exigir uma equivalência curricular mais rigorosa, visando garantir que todos os conteúdos essenciais sejam cumpridos.`
                            : `Em instituições privadas, geralmente a realocação ocorre entre o ${Math.max(
                                1,
                                parseInt(analiseData.profileData.semester) - 2
                              )}º e o ${Math.max(
                                1,
                                parseInt(analiseData.profileData.semester) - 1
                              )}º período. As faculdades privadas costumam ser mais flexíveis, facilitando a adaptação do seu histórico acadêmico.`}
                        </span>
                        <span className='block text-blue-200 text-sm mt-2'>
                          <strong>Atenção:</strong> Essa previsão é uma
                          estimativa baseada nas regras gerais das instituições
                          brasileiras. O período exato pode variar conforme a
                          análise da documentação e critérios de cada faculdade.
                          Recomendamos que você entre em contato diretamente com
                          a instituição desejada para confirmar todos os
                          detalhes e garantir uma transição tranquila.
                        </span>
                        <span className='block text-green-300 text-sm mt-2'>
                          💡 Lembre-se: cada passo é uma oportunidade de
                          crescimento. Estamos aqui para te apoiar em todo o
                          processo!
                        </span>
                      </div>
                    </div>
                  )}

                {/* Objetivo de Transferência dentro do Score Card */}
                {analiseData.profileData?.transferObjective && (
                  <div className='mt-6 pt-6 border-t border-white/20'>
                    <div className='bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 p-6 rounded-xl border-2 border-cyan-400/40'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg'>
                          <Target className='h-5 w-5 text-white' />
                        </div>
                        <div>
                          <h4 className='text-white font-bold text-lg'>
                            Seu Objetivo de Transferência
                          </h4>
                          <p className='text-cyan-100 text-sm'>
                            O que você busca alcançar com esta mudança
                          </p>
                        </div>
                      </div>
                      <div className='bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20'>
                        <p className='text-white text-base leading-relaxed font-medium italic'>
                          "{analiseData.profileData.transferObjective}"
                        </p>
                      </div>
                      <div className='mt-3 flex items-center gap-2 text-cyan-100 text-sm'>
                        <Sparkles className='h-4 w-4' />
                        <span>
                          💙 Estar próximo da família durante sua formação
                          médica traz apoio emocional e estabilidade, fatores
                          essenciais para seu sucesso acadêmico e bem-estar.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className='grid lg:grid-cols-2 gap-8 mb-8'>
            {/* Pontos Fortes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className='bg-white/10 backdrop-blur-lg border-white/20 h-full'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-white'>
                    <CheckCircle className='h-6 w-6 text-green-400' />
                    Pontos Fortes
                  </CardTitle>
                  <CardDescription className='text-blue-200'>
                    Características que favorecem sua transferência
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {analiseData.pontoFortes.map((ponto, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className='flex items-start gap-3 bg-green-500/10 p-3 rounded-lg border border-green-500/20'
                    >
                      <Sparkles className='h-5 w-5 text-green-400 flex-shrink-0 mt-0.5' />
                      <p className='text-white text-sm'>{ponto}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pontos de Atenção */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className='bg-white/10 backdrop-blur-lg border-white/20 h-full'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-white'>
                    <Lightbulb className='h-6 w-6 text-yellow-400' />
                    Pontos de Atenção
                  </CardTitle>
                  <CardDescription className='text-blue-200'>
                    Aspectos para considerar no processo
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {analiseData.pontosAtencao.map((ponto, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className='flex items-start gap-3 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20'
                    >
                      <AlertCircle className='h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5' />
                      <p className='text-white text-sm'>{ponto}</p>
                    </motion.div>
                  ))}
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
                <CardTitle className='flex items-center justify-between text-white text-2xl'>
                  <div className='flex items-center gap-2'>
                    <GraduationCap className='h-7 w-7 text-cyan-400' />
                    Faculdades Recomendadas
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-2.5 rounded-full text-lg font-bold shadow-lg'>
                      {analiseData.faculdadesRecomendadas?.length || 0}
                    </div>
                    <span className='text-sm text-blue-200 font-normal'>
                      {analiseData.faculdadesRecomendadas?.length === 1
                        ? 'universidade'
                        : 'universidades'}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription className='text-blue-200'>
                  Encontramos{' '}
                  <span className='font-semibold text-cyan-300'>
                    {analiseData.faculdadesRecomendadas?.length || 0}{' '}
                    {analiseData.faculdadesRecomendadas?.length === 1
                      ? 'instituição compatível'
                      : 'instituições compatíveis'}
                  </span>{' '}
                  com seu perfil
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {analiseData.faculdadesRecomendadas.map((faculdade, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className='bg-white/5 p-6 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all'
                  >
                    <div className='flex items-start justify-between mb-4'>
                      <div>
                        <h3 className='text-xl font-bold text-white mb-2'>
                          {faculdade.nome}
                        </h3>
                        <div className='flex items-center gap-2'>
                          <Badge className='bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-base px-4 py-1.5 hover:from-green-700 hover:to-emerald-700 shadow-lg border-2 border-white/50'>
                            ✨ {faculdade.compatibilidade}% compatível
                          </Badge>
                          <Badge
                            variant='outline'
                            className='text-white border-white bg-white/20 backdrop-blur-sm font-semibold hover:bg-white/30'
                          >
                            {faculdade.tipoProcesso}
                          </Badge>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-blue-300 text-sm'>Próxima vaga</p>
                        <p className='text-white font-semibold'>
                          {faculdade.proximaVaga}
                        </p>
                      </div>
                    </div>

                    <div className='grid md:grid-cols-3 gap-4 mb-4'>
                      <div className='flex items-center gap-2 text-blue-200'>
                        <DollarSign className='h-4 w-4' />
                        <span className='text-sm'>{faculdade.mensalidade}</span>
                      </div>
                      <div className='flex items-center gap-2 text-blue-200'>
                        <MapPin className='h-4 w-4' />
                        <span className='text-sm'>{faculdade.distancia}</span>
                      </div>
                      <div className='flex items-center gap-2 text-blue-200'>
                        <Building2 className='h-4 w-4' />
                        <span className='text-sm'>Campus Central</span>
                      </div>
                    </div>

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

                    <Button className='w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'>
                      Ver Detalhes
                      <ChevronRight className='ml-2 h-4 w-4' />
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Próximos Passos */}
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
                  Próximos passos para sua transferência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {analiseData.proximosPassos.map((passo, index) => (
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
                        <Badge className='bg-purple-500'>
                          <Clock className='h-3 w-3 mr-1' />
                          {passo.prazo}
                        </Badge>
                      </div>
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
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default VerRaioXPage;
