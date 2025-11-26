import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Send, Zap, ShieldAlert, BrainCircuit, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { callOpenAIAnalysis } from '@/lib/openai';
import { buildFaculdadesQuery } from '@/lib/faculdadesQuery';
import {
  loadLocalFaculdades,
  relaxedFilterDiagnostics,
} from '@/lib/localFaculdades';
import {
  normalizeState,
  normalizeInstitutionType,
} from '@/lib/faculdadesMapping';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const ProfileAnalysisPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    studentLocation: '',
    currentInstitution: '',
    semester: '',
    availableDocuments: [],
    transferObjective: '',
    statesOfInterest: [],
    institutionType: '',
    selectionMethod: '',
    mainDifficulty: '',
    weeklyStudyHours: '',
    professionalSituation: '',
    monthlyCapacity: '',
    fiesNeed: '',
    originCountry: '',
    aceita_fies: false,
    aceita_estrangeiro: false,
    obtem_novo_titulo: false,
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMeta, setModalMeta] = useState(null);
  const [remainingMs, setRemainingMs] = useState(null);

  // Calcula a data prevista de entrega (8 dias após criação)
  const entregaDate = modalMeta?.createdAt
    ? new Date(
        new Date(modalMeta.createdAt).getTime() + 8 * 24 * 60 * 60 * 1000
      )
    : null;

  // Calcula o percentual de progresso
  const totalMs = 8 * 24 * 60 * 60 * 1000;
  const progressPercent =
    remainingMs != null ? Math.round(100 - (remainingMs / totalMs) * 100) : 0;

  // Mensagens das etapas do Raio-X Acadêmico
  const stepMessages = [
    '1 - Recebendo dados do perfil',
    '2 - Análise inicial',
    '3 - Diagnóstico detalhado',
    '4 - Preparando relatório',
    '5 - Revisão final',
    '6 - Envio para o usuário',
    '7 - Recomendações personalizadas',
    '8 - Conclusão do Raio-X',
  ];

  // Índice da etapa atual baseado no progresso
  const stepIndex = Math.min(
    stepMessages.length - 1,
    Math.max(0, Math.floor((progressPercent / 100) * stepMessages.length))
  );

  // Mensagem atual exibida no modal
  const currentMessage = stepMessages[stepIndex] || stepMessages[0];

  // Calcula dias/horas/minutos restantes a partir de remainingMs
  let remainingDays = 0;
  let remainingHours = 0;
  let remainingMinutes = 0;
  if (remainingMs != null) {
    remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const remAfterDays = remainingMs % (24 * 60 * 60 * 1000);
    remainingHours = Math.floor(remAfterDays / (60 * 60 * 1000));
    const remAfterHours = remAfterDays % (60 * 60 * 1000);
    remainingMinutes = Math.floor(remAfterHours / (60 * 1000));
  }

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.user_metadata?.full_name || prev.fullName,
      }));
    }
    if (location.state) {
      setFormData((prev) => ({
        ...prev,
        semester: location.state.semester || '',
        weeklyStudyHours: location.state.weeklyStudyHours || '',
        institutionType: location.state.institutionType || '',
      }));
    }
  }, [location.state, user]);

  // Timer para o modal interativo de 'Análise em Processamento'
  useEffect(() => {
    if (!modalMeta || !modalMeta.createdAt) return;
    console.log('Modal meta set:', modalMeta);
    const dayMs = 24 * 60 * 60 * 1000;
    const durationMs = 8 * dayMs; // 8 dias

    const update = () => {
      const now = new Date();
      const created = new Date(modalMeta.createdAt);
      const elapsed = now - created;
      const remaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(remaining);
    };

    update();
    const t = setInterval(update, 1000 * 60); // atualizar a cada minuto
    return () => clearInterval(t);
  }, [modalMeta]);

  const brazilianStates = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];
  const southAmericanCountries = [
    'Argentina',
    'Bolívia',
    'Brasil',
    'Chile',
    'Colômbia',
    'Equador',
    'Guiana',
    'Paraguai',
    'Peru',
    'Suriname',
    'Uruguai',
    'Venezuela',
  ];
  const documents = [
    'Não tenho documento',
    'Histórico Escolar',
    'Certificado de Conclusão',
    'Comprovante de Matrícula',
    'Declaração de Vínculo',
    'Conteúdo Programático',
  ];

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBoolChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => {
      const currentValues = prev[name] || [];
      // Special logic for availableDocuments: "Não tenho documento" is exclusive
      if (name === 'availableDocuments') {
        if (value === 'Não tenho documento') {
          // Select only this option
          return { ...prev, [name]: ['Não tenho documento'] };
        }
        // If user selects any other document, ensure 'Não tenho documento' is removed
        const withoutNone = currentValues.filter(
          (v) => v !== 'Não tenho documento'
        );
        const already = withoutNone.includes(value);
        const newValues = already
          ? withoutNone.filter((v) => v !== value)
          : [...withoutNone, value];
        return { ...prev, [name]: newValues };
      }
      // Default toggle behavior for other checkbox groups
      // Special logic for statesOfInterest: support 'Todos' option which selects all states
      if (name === 'statesOfInterest') {
        if (value === 'Todos') {
          // If already all selected, unselect all; otherwise select all
          const allSelected =
            Array.isArray(currentValues) &&
            currentValues.length === brazilianStates.length;
          return { ...prev, [name]: allSelected ? [] : [...brazilianStates] };
        }
        // If selecting a specific state, remove 'Todos' (i.e., full selection) if present
        const withoutAll = (currentValues || []).filter((v) => v !== 'Todos');
        const already = withoutAll.includes(value);
        const newValues = already
          ? withoutAll.filter((v) => v !== value)
          : [...withoutAll, value];
        return { ...prev, [name]: newValues };
      }

      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  };

  // Handle statesOfInterest special behavior (Todos option)
  // Note: `brazilianStates` is the array of siglas defined above.

  const validateFormData = (data) => {
    const errors = [];
    const trim = (s) => (typeof s === 'string' ? s.trim() : s);

    if (!data.fullName || trim(data.fullName).length < 3)
      errors.push({ field: 'fullName', message: 'Nome completo inválido.' });
    if (!data.studentLocation)
      errors.push({
        field: 'studentLocation',
        message: 'Selecione sua localização (Brasil ou Exterior).',
      });
    if (data.studentLocation === 'Exterior' && !data.originCountry)
      errors.push({
        field: 'originCountry',
        message: 'Selecione o país de origem da sua instituição.',
      });
    if (!data.currentInstitution || trim(data.currentInstitution).length < 3)
      errors.push({
        field: 'currentInstitution',
        message: 'Informe a instituição atual.',
      });
    if (!data.semester)
      errors.push({
        field: 'semester',
        message: 'Selecione o semestre atual.',
      });
    if (!data.availableDocuments || data.availableDocuments.length === 0)
      errors.push({
        field: 'availableDocuments',
        message: 'Selecione ao menos um documento disponível.',
      });
    if (!data.transferObjective || trim(data.transferObjective).length < 10)
      errors.push({
        field: 'transferObjective',
        message: 'Descreva seu objetivo com pelo menos 10 caracteres.',
      });
    if (!data.weeklyStudyHours)
      errors.push({
        field: 'weeklyStudyHours',
        message: 'Selecione suas horas de estudo semanais.',
      });
    if (!data.professionalSituation)
      errors.push({
        field: 'professionalSituation',
        message: 'Selecione sua situação profissional.',
      });
    if (!data.monthlyCapacity)
      errors.push({
        field: 'monthlyCapacity',
        message: 'Informe sua capacidade financeira mensal.',
      });

    // Validate statesOfInterest: now mandatory — require at least one selection
    if (!data.statesOfInterest || data.statesOfInterest.length === 0) {
      errors.push({
        field: 'statesOfInterest',
        message: "Selecione ao menos um estado (ou escolha 'Todos').",
      });
    } else {
      const invalid = data.statesOfInterest.filter(
        (s) => !brazilianStates.includes(s)
      );
      if (invalid.length > 0)
        errors.push({
          field: 'statesOfInterest',
          message: 'Um ou mais estados selecionados são inválidos.',
        });
    }

    return errors;
  };

  const sanitizeForDatabase = (data) => {
    const allowedInstitutionTypes = ['Pública', 'Privada', 'Ambas', ''];
    const allowedSelectionMethods = ['Prova', 'Análise Curricular', 'ENEM', ''];
    const sanitized = { ...data };
    if (!allowedInstitutionTypes.includes(sanitized.institutionType))
      sanitized.institutionType = '';
    if (!allowedSelectionMethods.includes(sanitized.selectionMethod))
      sanitized.selectionMethod = '';
    sanitized.aceita_fies = !!sanitized.aceita_fies;
    sanitized.aceita_estrangeiro = !!sanitized.aceita_estrangeiro;
    sanitized.obtem_novo_titulo = !!sanitized.obtem_novo_titulo;
    sanitized.availableDocuments = (sanitized.availableDocuments || []).slice(
      0,
      20
    );
    sanitized.statesOfInterest = (sanitized.statesOfInterest || []).slice(
      0,
      27
    );
    // ensure simple serializable types
    try {
      JSON.stringify(sanitized);
    } catch (e) {
      // fallback: keep only basic fields
      return {
        fullName: sanitized.fullName,
        studentLocation: sanitized.studentLocation,
        currentInstitution: sanitized.currentInstitution,
      };
    }
    return sanitized;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description:
          'Você precisa estar logado para enviar um raio-x acadêmico.',
      });
      return;
    }
    // Validações cliente
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      const first = validationErrors[0];
      toast({
        variant: 'destructive',
        title: 'Verifique os campos',
        description: first.message,
      });
      return;
    }

    // Normaliza dados antes de salvar/enviar à IA
    const normalizedData = {
      ...formData,
      fullName: (formData.fullName || '').trim(),
      currentInstitution: (formData.currentInstitution || '').trim(),
      transferObjective: (formData.transferObjective || '').trim(),
      originCountry: formData.originCountry || null,
      availableDocuments: Array.from(
        new Set(formData.availableDocuments || [])
      ),
      statesOfInterest: Array.from(new Set(formData.statesOfInterest || [])),
    };

    setLoading(true);
    console.log(
      'Form data being submitted for analysis (normalized):',
      normalizedData
    );

    try {
      // 1. Salvar perfil do raio-x acadêmico (se necessário)
      const dbPayload = sanitizeForDatabase(normalizedData);
      const { data: analysisRecord, error: analysisInsertError } =
        await supabase
          .from('analyses')
          .insert({
            user_id: user.id,
            student_name: dbPayload.fullName || normalizedData.fullName,
            profile_data_json: dbPayload,
          })
          .select()
          .single();
      if (analysisInsertError) throw analysisInsertError;
      toast({
        title: 'Perfil Salvo!',
        description:
          'Sua análise está sendo processada e estará disponível em instantes.',
      });
      // armazenar meta do modal para contagem regressiva (usar created_at retornado pelo insert, se disponível)
      setModalMeta({
        analysisId: analysisRecord?.id,
        createdAt: analysisRecord?.created_at || new Date().toISOString(),
      });
      setShowModal(true);

      // 2. Obter faculdades — preferir carga local (arquivo JSON) com diagnóstico relaxado,
      // caso não exista, usar Supabase como fallback.
      let recommendedUniversities = [];
      try {
        const local = await loadLocalFaculdades();
        if (Array.isArray(local) && local.length > 0) {
          const { result, attempts } = relaxedFilterDiagnostics(
            local,
            normalizedData,
            { limit: 200, debug: true }
          );
          console.log('Local faculdades diagnostic attempts:', attempts);
          // Se o usuário informou estados de interesse e o resultado local veio vazio,
          // interrompemos o fluxo e avisamos — o usuário pediu que o filtro de
          // estados seja sempre respeitado (podendo selecionar múltiplos estados).
          if (
            Array.isArray(normalizedData.statesOfInterest) &&
            normalizedData.statesOfInterest.length > 0 &&
            (!result || result.length === 0)
          ) {
            const selected = normalizedData.statesOfInterest.join(', ');
            toast({
              variant: 'warning',
              title: 'Nenhuma faculdade encontrada',
              description: `Não foram encontradas faculdades nos estados selecionados: ${selected}. Remova ou altere os filtros para ampliar a busca.`,
            });
            setLoading(false);
            return;
          }
          // Normalize records to the shape expected by the UI and AI
          recommendedUniversities = (result || []).map((r) => {
            const name = r.nome || r.name || '';
            const cidade = r.cidade || r.city || '';
            const regiao = r.regiao || r.region || '';
            const sigla = r.sigla || '';
            const estadoRaw = r.estado || r.state || sigla || '';
            const state = normalizeState(estadoRaw) || (sigla ? sigla : '');
            const typeRaw = r.administracao || r.type || '';
            const adminLower = String(typeRaw || '').toLowerCase();
            let type = normalizeInstitutionType(typeRaw) || typeRaw || '';
            if (
              adminLower.includes('estadual') ||
              adminLower.includes('federal') ||
              adminLower.includes('municipal')
            ) {
              type = 'Pública';
            }
            const entrance_method = r.processo || r.entrance_method || '';
            const aceita_fies = r.aceita_fies ?? r.aceitaFies ?? false;
            const aceita_estrangeiro =
              r.aceita_estrangeiro ?? r.aceitaEstrangeiro ?? false;
            const obtem_novo_titulo =
              r.obtem_novo_titulo ?? r.obtemNovoTitulo ?? false;
            const id =
              r.id ||
              r.__customId ||
              `${name}-${sigla}-${Math.random().toString(36).slice(2, 8)}`;
            return {
              ...r,
              id,
              name,
              cidade,
              state,
              regiao,
              type,
              entrance_method,
              aceita_fies,
              aceita_estrangeiro,
              obtem_novo_titulo,
            };
          });
        } else {
          // fallback para Supabase
          const query = buildFaculdadesQuery(supabase, normalizedData, {
            limit: 200,
          });
          console.log('Constructed Supabase Query:', query);
          const { data: recommendedUniversitiesRaw, error: faculdadesError } =
            await query;
          if (faculdadesError) throw faculdadesError;
          recommendedUniversities = Array.isArray(recommendedUniversitiesRaw)
            ? recommendedUniversitiesRaw.map((r) => ({
                ...r,
                // normalize DB shape to UI shape
                id: r.id,
                name: r.nome || r.name || r.title || '',
                cidade: r.cidade || r.city || '',
                state:
                  normalizeState(r.estado || r.state || r.sigla || '') ||
                  (r.sigla ? r.sigla : ''),
                regiao: r.regiao || r.region || r.regionName || '',
                type: (function () {
                  const raw = r.type || r.administracao || '';
                  const low = String(raw || '').toLowerCase();
                  if (
                    low.includes('estadual') ||
                    low.includes('federal') ||
                    low.includes('municipal')
                  )
                    return 'Pública';
                  return normalizeInstitutionType(raw) || raw || '';
                })(),
                entrance_method: r.entrance_method || r.processo || '',
                aceita_fies: r.aceita_fies ?? r.aceitaFies ?? false,
                aceita_estrangeiro:
                  r.aceita_estrangeiro ?? r.aceitaEstrangeiro ?? false,
                obtem_novo_titulo:
                  r.obtem_novo_titulo ?? r.obtemNovoTitulo ?? false,
              }))
            : [];
          console.log(
            'Universities returned from Supabase:',
            recommendedUniversities
          );
        }
      } catch (e) {
        console.warn(
          'Error loading local faculdades, falling back to Supabase',
          e
        );
        const query = buildFaculdadesQuery(supabase, normalizedData, {
          limit: 200,
        });
        const { data: recommendedUniversitiesRaw, error: faculdadesError } =
          await query;
        if (faculdadesError) throw faculdadesError;
        recommendedUniversities = Array.isArray(recommendedUniversitiesRaw)
          ? recommendedUniversitiesRaw
          : [];
      }

      // 3. Chamar IA
      let aiResult = await callOpenAIAnalysis(
        normalizedData,
        recommendedUniversities.slice(0, 5)
      );

      // Ajuste solicitado: ajustar projectedPeriod baseado no semestre,
      // localização do estudante e tipo de instituição.
      // Regras aplicadas:
      // - Exterior + Privada => volta 1 ou 2 períodos (aleatório)
      // - Exterior + Pública => volta 2 ou 3 períodos (aleatório)
      // - Brasil + Privada => volta 1 período
      // - Brasil + Pública => volta 2 períodos
      // - Para semestres <= 3 aplicamos o decremento conservador de 1 (como antes)
      // Valor mínimo final: 1º.
      try {
        const semRaw = normalizedData.semester;
        const semNum = parseInt(semRaw, 10);
        let decrement = 1; // padrão conservador
        if (!Number.isNaN(semNum) && semNum > 0) {
          const studentLoc = (normalizedData.studentLocation || '').trim();
          const rawType = normalizedData.institutionType || '';
          const normType = normalizeInstitutionType(rawType) || rawType || '';

          if (semNum > 3) {
            if (studentLoc === 'Exterior') {
              if (normType === 'Privada') {
                // Para Exterior + Privada: escolha determinística entre -1 e -2
                // baseada no `analysisRecord.id` para que o comportamento seja
                // interno e reproduzível (não exposto ao aluno).
                try {
                  const seedSource =
                    analysisRecord && analysisRecord.id
                      ? String(analysisRecord.id)
                      : (user && user.id ? String(user.id) : '') +
                        String(normalizedData.fullName || '');
                  let hash = 0;
                  for (let i = 0; i < seedSource.length; i++) {
                    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
                  }
                  decrement = hash % 2 === 0 ? 1 : 2;
                } catch (e) {
                  // fallback conservador
                  decrement = 1;
                }
              } else if (normType === 'Pública') {
                // Para Exterior + Pública: escolha determinística entre -2 e -3
                try {
                  const seedSource =
                    analysisRecord && analysisRecord.id
                      ? String(analysisRecord.id)
                      : (user && user.id ? String(user.id) : '') +
                        String(normalizedData.fullName || '');
                  let hash = 0;
                  for (let i = 0; i < seedSource.length; i++) {
                    hash = (hash * 31 + seedSource.charCodeAt(i)) >>> 0;
                  }
                  decrement = hash % 2 === 0 ? 2 : 3;
                } catch (e) {
                  // fallback conservador
                  decrement = 2;
                }
              } else decrement = 2; // Ambas ou desconhecido
            } else {
              // Brasil
              if (normType === 'Privada') decrement = 1;
              else if (normType === 'Pública') decrement = 2;
              else decrement = 1; // Ambas ou desconhecido
            }
          } else {
            // semestres <= 3: comportamento conservador (decremento 1)
            decrement = 1;
          }

          const adjusted = Math.max(1, semNum - decrement);
          const adjustedLabel = `${adjusted}º`;
          // Sobrescreve o campo projectedPeriod retornado pela IA
          aiResult.projectedPeriod = adjustedLabel;
          // Marcar que foi ajustado (para depuração/registro)
          try {
            if (!aiResult.__meta) aiResult.__meta = {};
            aiResult.__meta.projectedPeriodOverridden = true;
            aiResult.__meta.projectedPeriodAdjustment = {
              originalSemester: semNum,
              decrement,
              finalSemester: adjusted,
            };
            aiResult.__meta.originalProjectedPeriod =
              aiResult.__raw?.projected_period || null;
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.warn('Erro ao ajustar projectedPeriod baseado no semestre:', e);
      }

      // Checar validação da resposta da IA e notificar o usuário se necessário
      const aiValid = aiResult?._validation?.isValid ?? true;
      const aiIssues = aiResult?._validation?.issues || [];
      if (!aiValid) {
        toast({
          variant: 'warning',
          title: 'Análise em Processamento',
          description: `Sua solicitação foi recebida e será analisada por nossa equipe. Aguarde até 8 dias corridos para receber o resultado completo.`,
        });
        console.warn('IA retornou inconsistências:', aiIssues, aiResult.__raw);
      }

      // 4. Atualizar registro de análise com resultado da IA
      const updatePayload = {
        ai_analysis_result_json: aiResult,
        compatibility_percentage: aiResult.overallCompatibility,
        projected_period: aiResult.projectedPeriod,
        improvement_points_json: { points: aiResult.improvementPoints },
        ai_valid: aiValid,
        ai_validation_issues_json: aiIssues,
      };
      // Attempt update; if DB schema doesn't have our new columns, retry without them
      let { error: updateError } = await supabase
        .from('analyses')
        .update(updatePayload)
        .eq('id', analysisRecord.id);
      if (updateError) {
        const msg = (updateError.message || '').toLowerCase();
        const columnMissing =
          /could not find the|column .* does not exist|undefined column|column .* unknown/i.test(
            msg
          ) || msg.includes('could not find');
        if (columnMissing) {
          console.warn(
            'DB schema missing columns detected, retrying update without ai_* fields:',
            updateError.message
          );
          const reduced = { ...updatePayload };
          delete reduced.ai_valid;
          delete reduced.ai_validation_issues_json;
          const { error: retryError } = await supabase
            .from('analyses')
            .update(reduced)
            .eq('id', analysisRecord.id);
          if (retryError) throw retryError;
        } else {
          throw updateError;
        }
      }

      toast({
        title: 'Raio-X Gerado com Sucesso!',
        description:
          'Seu relatório completo está pronto. Redirecionando para visualização...',
      });

      // 5. Redirecionar para a página Ver Raio-X
      setTimeout(() => {
        navigate('/ver-raio-x', {
          state: {
            analysisResult: aiResult,
            recommendedUniversities: recommendedUniversities || [],
            profileData: normalizedData,
            analysisId: analysisRecord.id,
          },
        });
      }, 1500);

      // Limpar formulário após envio bem-sucedido
      setFormData({
        fullName: '',
        studentLocation: '',
        currentInstitution: '',
        semester: '',
        availableDocuments: [],
        transferObjective: '',
        statesOfInterest: [],
        institutionType: '',
        selectionMethod: '',
        mainDifficulty: '',
        weeklyStudyHours: '',
        professionalSituation: '',
        monthlyCapacity: '',
        fiesNeed: '',
        originCountry: '',
        aceita_fies: false,
        aceita_estrangeiro: false,
        obtem_novo_titulo: false,
      });
    } catch (error) {
      console.error('Error during analysis submission:', error);
      toast({
        variant: 'destructive',
        title: 'Ocorreu um Erro no Raio-X Acadêmico',
        description:
          error.message ||
          'Não foi possível enviar sua solicitação. Devido à alta demanda, tente novamente em alguns minutos.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Raio-X Acadêmico - AmigoMeD!</title>
        <meta
          name='description'
          content='Faça um raio-x acadêmico completo do seu perfil e receba um relatório premium com nossa equipe especializada.'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden'>
        {/* Efeitos de Raio-X no fundo */}
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute top-10 left-10 w-96 h-96 border border-cyan-400 rounded-full animate-pulse'></div>
          <div className='absolute top-32 right-20 w-72 h-72 border border-blue-400 rounded-full animate-ping delay-300'></div>
          <div className='absolute bottom-20 left-1/4 w-80 h-80 border border-indigo-400 rounded-full animate-pulse delay-700'></div>
          <div className='absolute bottom-32 right-1/3 w-64 h-64 border border-cyan-300 rounded-full animate-ping delay-1000'></div>

          {/* Linhas de grade */}
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent'></div>
          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent'></div>

          {/* Ondas de raio-x */}
          <div className='absolute top-0 left-0 w-full h-full'>
            <div className='absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse'></div>
            <div className='absolute top-2/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse delay-500'></div>
            <div className='absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse delay-1000'></div>
          </div>
        </div>

        {/* Overlay para melhor legibilidade */}
        <div className='absolute inset-0 bg-black/40 backdrop-blur-sm'></div>

        <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className='text-center mb-12'>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className='relative inline-block mb-6'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse'></div>
                <BrainCircuit className='relative h-20 w-20 text-cyan-400 mx-auto' />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className='text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent mb-6'
              >
                Raio-X Acadêmico
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className='text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed'
              >
                Preencha o formulário abaixo com suas informações acadêmicas.
                Nossa IA analisará seu perfil e indicará as melhores
                oportunidades de transferência para Medicina de acordo com seu
                perfil e objetivos.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className='mt-4 flex items-center justify-center gap-2 text-cyan-300'
              >
                <Zap className='h-5 w-5' />
                <span className='text-sm'>
                  Análise instantânea • Recomendações personalizadas • 100%
                  gratuito
                </span>
              </motion.div>

              {/* Linha decorativa */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100px' }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className='h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mt-6 rounded-full'
              ></motion.div>
            </div>

            {!user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className='bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-400/30 text-amber-200 p-6 rounded-xl mb-8 flex items-center shadow-lg'
              >
                <ShieldAlert className='h-6 w-6 mr-3 text-amber-300' />
                <p className='text-amber-100'>
                  <strong className='text-amber-200'>Atenção:</strong> Você
                  precisa estar logado para salvar e analisar seu perfil.
                </p>
              </motion.div>
            )}

            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              onSubmit={handleSubmit}
              className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8'
            >
              <section className='border-b border-white/10 pb-8'>
                <h2 className='text-2xl font-bold text-white mb-2 flex items-center'>
                  <div className='w-2 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full mr-3'></div>
                  Informações Pessoais
                </h2>
                <p className='text-blue-200 text-sm mb-6 ml-5'>
                  Conte-nos um pouco sobre você e sua situação atual
                </p>
                <div className='space-y-5'>
                  <div>
                    <Label
                      htmlFor='fullName'
                      className='text-blue-100 font-semibold text-base flex items-center gap-2'
                    >
                      Nome Completo *
                      <span className='text-xs text-blue-300 font-normal'>
                        (Como está no documento)
                      </span>
                    </Label>
                    <input
                      type='text'
                      id='fullName'
                      name='fullName'
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                      placeholder='Ex: João da Silva Santos'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor='studentLocation'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Onde você está estudando atualmente? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Informe se você cursa Medicina no Brasil ou em outro país
                    </p>
                    <select
                      id='studentLocation'
                      name='studentLocation'
                      value={formData.studentLocation}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                    >
                      <option value='' className='bg-slate-800 text-white'>
                        Selecione...
                      </option>
                      <option
                        value='Brasil'
                        className='bg-slate-800 text-white'
                      >
                        Brasil
                      </option>
                      <option
                        value='Exterior'
                        className='bg-slate-800 text-white'
                      >
                        Exterior
                      </option>
                    </select>
                  </div>
                  {formData.studentLocation === 'Exterior' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label
                        htmlFor='originCountry'
                        className='text-blue-200 font-medium'
                      >
                        País de origem da sua instituição *
                      </Label>
                      <select
                        id='originCountry'
                        name='originCountry'
                        value={formData.originCountry}
                        onChange={handleInputChange}
                        required
                        className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                      >
                        <option value='' className='bg-slate-800 text-white'>
                          Selecione...
                        </option>
                        {southAmericanCountries.map((c) => (
                          <option
                            key={c}
                            value={c}
                            className='bg-slate-800 text-white'
                          >
                            {c}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>
              </section>

              <section className='border-b border-white/10 pb-8'>
                <h2 className='text-2xl font-bold text-white mb-2 flex items-center'>
                  <div className='w-2 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full mr-3'></div>
                  Informações Acadêmicas
                </h2>
                <p className='text-blue-200 text-sm mb-6 ml-5'>
                  Dados sobre sua formação e documentação atual
                </p>
                <div>
                  <Label
                    htmlFor='is_foreign_student'
                    className='text-white font-semibold text-base'
                  >
                    Você é aluno do exterior? *
                  </Label>
                  <select
                    id='is_foreign_student'
                    name='aceita_estrangeiro'
                    value={formData.aceita_estrangeiro ? 'Sim' : 'Não'}
                    onChange={(e) =>
                      handleBoolChange(
                        'aceita_estrangeiro',
                        e.target.value === 'Sim'
                      )
                    }
                    required
                    style={{ color: 'white' }}
                    className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                  >
                    <option value='Não' style={{ color: 'black' }}>
                      Não
                    </option>
                    <option value='Sim' style={{ color: 'black' }}>
                      Sim
                    </option>
                  </select>
                </div>
                <br></br>
                <div className='space-y-5'>
                  <div>
                    <Label
                      htmlFor='currentInstitution'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Qual instituição você está cursando? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Nome completo da faculdade ou universidade onde você
                      estuda
                    </p>
                    <input
                      type='text'
                      id='currentInstitution'
                      name='currentInstitution'
                      value={formData.currentInstitution}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                      placeholder='Ex: Universidade Federal de Minas Gerais'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor='semester'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Em qual semestre você está? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Semestre atual que você está cursando no curso de Medicina
                    </p>
                    <select
                      id='semester'
                      name='semester'
                      value={formData.semester}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                    >
                      <option value='' className='bg-slate-800 text-white'>
                        Selecione o semestre...
                      </option>
                      {[...Array(12)].map((_, i) => (
                        <option
                          key={i + 1}
                          value={i + 1}
                          className='bg-slate-800 text-white'
                        >
                          {i + 1}º Semestre
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className='text-blue-100 font-semibold text-base'>
                      Quais documentos você possui? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-3'>
                      Marque todos os documentos que você tem disponíveis para o
                      processo de transferência
                    </p>
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                      {documents.map((doc) => (
                        <label
                          key={doc}
                          className='flex items-center space-x-2'
                        >
                          <input
                            type='checkbox'
                            checked={formData.availableDocuments.includes(doc)}
                            onChange={() =>
                              handleCheckboxChange('availableDocuments', doc)
                            }
                            className='w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500'
                          />
                          <span className='text-sm text-white'>{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
                  <div className='w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full mr-3'></div>
                  Preferências de Transferência
                </h2>
                <div className='space-y-6'>
                  <div>
                    <Label className='text-white font-semibold text-base'>
                      Estados de Interesse (opcional)
                    </Label>
                    <p className='text-sm text-blue-200 mb-2'>
                      Selecione ao menos um estado para filtrar. Use{' '}
                      <strong>Todos</strong> para buscar em todo o Brasil.
                    </p>
                    <div className='grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg'>
                      <label
                        key='Todos'
                        className='flex items-center space-x-2'
                      >
                        <input
                          type='checkbox'
                          checked={
                            Array.isArray(formData.statesOfInterest) &&
                            formData.statesOfInterest.length ===
                              brazilianStates.length
                          }
                          onChange={() =>
                            handleCheckboxChange('statesOfInterest', 'Todos')
                          }
                          className='w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500'
                        />
                        <span className='text-sm text-white'>Todos</span>
                      </label>
                      {brazilianStates.map((s) => (
                        <label key={s} className='flex items-center space-x-2'>
                          <input
                            type='checkbox'
                            checked={formData.statesOfInterest.includes(s)}
                            onChange={() =>
                              handleCheckboxChange('statesOfInterest', s)
                            }
                            className='w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500'
                          />
                          <span className='text-sm text-white'>{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                      <Label
                        htmlFor='institutionType'
                        className='text-white font-semibold text-base'
                      >
                        Tipo de Instituição
                      </Label>
                      <select
                        id='institutionType'
                        name='institutionType'
                        value={formData.institutionType}
                        onChange={handleInputChange}
                        className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                        style={{ color: 'white' }}
                      >
                        <option value='' style={{ color: 'black' }}>
                          Qualquer
                        </option>
                        <option value='Pública' style={{ color: 'black' }}>
                          Pública
                        </option>
                        <option value='Privada' style={{ color: 'black' }}>
                          Privada
                        </option>
                        <option value='Ambas' style={{ color: 'black' }}>
                          Ambas
                        </option>
                      </select>
                    </div>
                    <div>
                      <Label
                        htmlFor='selectionMethod'
                        className='text-white font-semibold text-base'
                      >
                        Método de Seleção
                      </Label>
                      <select
                        id='selectionMethod'
                        name='selectionMethod'
                        value={formData.selectionMethod}
                        onChange={handleInputChange}
                        className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                        style={{ color: 'white' }}
                      >
                        <option value='' style={{ color: 'black' }}>
                          Qualquer
                        </option>
                        <option value='Prova' style={{ color: 'black' }}>
                          Prova
                        </option>
                        <option
                          value='Análise Curricular'
                          style={{ color: 'black' }}
                        >
                          Análise Curricular
                        </option>
                        <option value='ENEM' style={{ color: 'black' }}>
                          ENEM
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-x-6 gap-y-4 pt-2'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='aceita_fies'
                        checked={formData.aceita_fies}
                        onCheckedChange={(c) =>
                          handleBoolChange('aceita_fies', c)
                        }
                      />
                      <Label
                        htmlFor='aceita_fies'
                        className='cursor-pointer text-blue-200 font-medium flex items-center'
                      >
                        Apenas com FIES
                      </Label>
                    </div>

                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='obtem_novo_titulo'
                        checked={formData.obtem_novo_titulo}
                        onCheckedChange={(c) =>
                          handleBoolChange('obtem_novo_titulo', c)
                        }
                      />
                      <Label
                        htmlFor='obtem_novo_titulo'
                        className='cursor-pointer text-white'
                      >
                        Apenas para novo título
                      </Label>
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor='transferObjective'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Por que você deseja fazer transferência? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Conte seus objetivos e motivações para mudar de
                      instituição (proximidade de casa, melhor infraestrutura,
                      etc.)
                    </p>
                    <textarea
                      id='transferObjective'
                      name='transferObjective'
                      value={formData.transferObjective}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                      placeholder='Ex: Busco uma instituição mais próxima da minha casa para otimizar meu tempo de estudo...'
                    ></textarea>
                  </div>
                </div>
              </section>

              <section>
                <h2 className='text-2xl font-bold text-white mb-2 flex items-center'>
                  <div className='w-2 h-8 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full mr-3'></div>
                  Perfil de Estudos e Situação Financeira
                </h2>
                <p className='text-blue-200 text-sm mb-6 ml-5'>
                  Informações sobre sua rotina de estudos e capacidade
                  financeira
                </p>
                <div className='grid md:grid-cols-2 gap-5'>
                  <div>
                    <Label
                      htmlFor='mainDifficulty'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Qual sua maior dificuldade nos estudos? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Identifique o principal desafio que você enfrenta
                    </p>
                    <input
                      type='text'
                      id='mainDifficulty'
                      name='mainDifficulty'
                      value={formData.mainDifficulty}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                      placeholder='Ex: Gestão de tempo, Concentração, Motivação'
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor='weeklyStudyHours'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Quantas horas você estuda por semana? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Considere apenas horas de estudo fora das aulas
                    </p>
                    <select
                      id='weeklyStudyHours'
                      name='weeklyStudyHours'
                      value={formData.weeklyStudyHours}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                    >
                      <option value='' className='bg-slate-800 text-white'>
                        Selecione...
                      </option>
                      <option value='0-10' className='bg-slate-800 text-white'>
                        0-10 horas
                      </option>
                      <option value='10-20' className='bg-slate-800 text-white'>
                        10-20 horas
                      </option>
                      <option value='20-30' className='bg-slate-800 text-white'>
                        20-30 horas
                      </option>
                      <option value='30+' className='bg-slate-800 text-white'>
                        Mais de 30 horas
                      </option>
                    </select>
                  </div>
                  <div>
                    <Label
                      htmlFor='professionalSituation'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Qual sua situação profissional atual? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Informe se você trabalha além de estudar
                    </p>
                    <select
                      id='professionalSituation'
                      name='professionalSituation'
                      value={formData.professionalSituation}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                    >
                      <option value='' className='bg-slate-800 text-white'>
                        Selecione...
                      </option>
                      <option
                        value='Apenas Estudante'
                        className='bg-slate-800 text-white'
                      >
                        Apenas Estudante
                      </option>
                      <option
                        value='Trabalho Meio Período'
                        className='bg-slate-800 text-white'
                      >
                        Trabalho Meio Período
                      </option>
                      <option
                        value='Trabalho Integral'
                        className='bg-slate-800 text-white'
                      >
                        Trabalho Integral
                      </option>
                    </select>
                  </div>
                  <div>
                    <Label
                      htmlFor='monthlyCapacity'
                      className='text-blue-100 font-semibold text-base'
                    >
                      Quanto você pode investir por mês? *
                    </Label>
                    <p className='text-xs text-blue-300 mt-1 mb-2'>
                      Valor mensal disponível para mensalidade da faculdade
                    </p>
                    <select
                      id='monthlyCapacity'
                      name='monthlyCapacity'
                      value={formData.monthlyCapacity}
                      onChange={handleInputChange}
                      required
                      className='mt-2 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm transition-all duration-300'
                    >
                      <option value='' className='bg-slate-800 text-white'>
                        Selecione a faixa...
                      </option>
                      <option
                        value='< R$2.5k'
                        className='bg-slate-800 text-white'
                      >
                        Até R$ 2.500
                      </option>
                      <option
                        value='R$2.5k-5k'
                        className='bg-slate-800 text-white'
                      >
                        R$2.5k-5k
                      </option>
                      <option
                        value='R$5k-10k'
                        className='bg-slate-800 text-white'
                      >
                        R$5k-10k
                      </option>
                      <option
                        value='> R$10k'
                        className='bg-slate-800 text-white'
                      >
                        &gt; R$10k
                      </option>
                    </select>
                  </div>
                </div>
              </section>

              <div className='pt-8'>
                <Button
                  type='submit'
                  size='lg'
                  className='w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-lg py-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl'
                  disabled={loading || !user}
                >
                  {loading ? (
                    <>
                      <Loader2 className='animate-spin mr-3 h-5 w-5' />
                      Enviando solicitação...
                    </>
                  ) : (
                    <>
                      <Send className='mr-2 h-5 w-5' /> Iniciar Raio-X Acadêmico
                    </>
                  )}
                </Button>

                {/* Informações sobre o prazo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className='mt-6 p-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl shadow-lg'
                >
                  <div className='flex items-start space-x-3'>
                    <BrainCircuit className='h-6 w-6 text-cyan-400 mt-0.5 flex-shrink-0' />
                    <div className='text-sm text-blue-100'>
                      <p className='font-semibold mb-3 text-cyan-300 text-base'>
                        Como funciona o Raio-X:
                      </p>
                      <ul className='space-y-2 text-blue-200'>
                        <li className='flex items-start'>
                          <div className='w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 mr-2 flex-shrink-0'></div>
                          Nossa equipe especializada analisará seu perfil
                          detalhadamente
                        </li>
                        <li className='flex items-start'>
                          <div className='w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0'></div>
                          Você receberá um relatório completo{' '}
                          <strong className='text-cyan-300'>
                            instantaneamente
                          </strong>
                        </li>
                        <li className='flex items-start'>
                          <div className='w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 mr-2 flex-shrink-0'></div>
                          Devido à alta demanda, pedimos paciência para entregar
                          a melhor análise
                        </li>
                        <li className='flex items-start'>
                          <div className='w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0'></div>
                          O resultado será enviado por email com universidades
                          recomendadas
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.form>
          </motion.div>
        </div>
      </div>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          // Não permitir fechamento por clique no overlay/ESC — apenas permitir abrir.
          if (open) setShowModal(true);
        }}
      >
        <DialogContent className='max-w-lg p-8 rounded-2xl bg-white shadow-2xl border border-cyan-200'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-cyan-700 mb-2'>
              Análise em processamento
            </DialogTitle>
            <div className='text-sm text-slate-600 mt-1'>
              Sua análise foi recebida e passará por uma avaliação minuciosa
              pela nossa equipe pedagógica. Normalmente a entrega leva entre{' '}
              <strong>5 a 8 dias úteis</strong>, dependendo da demanda, ou será
              disponibilizada quando um administrador liberar manualmente.
            </div>
          </DialogHeader>
          <div className='space-y-4 text-gray-700 text-lg'>
            <div className='flex justify-between text-sm text-slate-600'>
              <div>
                Início:{' '}
                {modalMeta?.createdAt
                  ? new Date(modalMeta.createdAt).toLocaleDateString('pt-BR')
                  : new Date().toLocaleDateString('pt-BR')}
              </div>
              <div>
                Entrega prevista:{' '}
                {modalMeta?.createdAt
                  ? (() => {
                      const created = new Date(modalMeta.createdAt);
                      const min = new Date(
                        created.getTime() + 5 * 24 * 60 * 60 * 1000
                      );
                      const max = new Date(
                        created.getTime() + 8 * 24 * 60 * 60 * 1000
                      );
                      return `${min.toLocaleDateString(
                        'pt-BR'
                      )} — ${max.toLocaleDateString('pt-BR')}`;
                    })()
                  : '-'}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-slate-800 mb-1'>
                Sua solicitação está em processamento
              </div>
              <div className='text-sm text-slate-600 mb-3'>
                Entrega prevista:{' '}
                <span className='font-bold text-cyan-600'>
                  {modalMeta?.createdAt
                    ? (() => {
                        const created = new Date(modalMeta.createdAt);
                        const min = new Date(
                          created.getTime() + 5 * 24 * 60 * 60 * 1000
                        );
                        const max = new Date(
                          created.getTime() + 8 * 24 * 60 * 60 * 1000
                        );
                        return `${min.toLocaleDateString(
                          'pt-BR'
                        )} — ${max.toLocaleDateString('pt-BR')}`;
                      })()
                    : 'em breve'}
                </span>
              </div>
              <Progress
                value={progressPercent}
                className='h-3 rounded-full bg-slate-100'
              />
              <div className='mt-2 text-sm text-slate-700'>
                {progressPercent}% concluído
              </div>
            </div>

            <div className='mt-4 grid grid-cols-4 gap-2 text-sm'>
              {stepMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-center transition-colors duration-300 ${
                    i <= stepIndex
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/30 text-slate-700'
                  }`}
                >
                  <div className='font-semibold'>{i + 1}</div>
                  <div className='mt-1 text-xs leading-tight'>
                    {m.replace(/^[0-9] - /, '')}
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-4 text-center text-sm text-slate-700'>
              <div className='font-medium mb-1'>{currentMessage}</div>
              <div>
                Entrega em:{' '}
                <span className='font-bold'>
                  {remainingDays}d {remainingHours}h {remainingMinutes}m
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className='mt-6 flex justify-end gap-3'>
            <Button
              variant='outline'
              onClick={() => setShowModal(false)}
              disabled={false}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                try {
                  navigate('/simulados');
                } catch (e) {
                  console.warn('Erro ao navegar para simulados', e);
                  setShowModal(false);
                }
              }}
              className='bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
            >
              Ir para Simulados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileAnalysisPage;
