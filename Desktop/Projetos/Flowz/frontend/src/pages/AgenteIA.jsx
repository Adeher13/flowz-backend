// Página de configuração do Agente IA
import { useState, useEffect } from 'react'
import { AppLayout } from '../components/layout/AppLayout.jsx'
import { agentesApi } from '../services/api.js'
import { useStore } from '../store/useStore.js'
import { supabase } from '../services/supabaseClient.js'
import './AgenteIA.css'

const DIAS = [
  { key: 0, label: 'Dom' },
  { key: 1, label: 'Seg' },
  { key: 2, label: 'Ter' },
  { key: 3, label: 'Qua' },
  { key: 4, label: 'Qui' },
  { key: 5, label: 'Sex' },
  { key: 6, label: 'Sáb' },
]

const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

const TOM_OPCOES = [
  { value: 'formal',  label: 'Formal' },
  { value: 'neutro',  label: 'Neutro' },
  { value: 'casual',  label: 'Casual' },
]

function DisponibilidadeGrid({ disponibilidade, onChange }) {
  function toggleDia(dia) {
    const existe = disponibilidade.find(d => d.dia_semana === dia.key)
    if (existe) {
      onChange(disponibilidade.filter(d => d.dia_semana !== dia.key))
    } else {
      onChange([...disponibilidade, { dia_semana: dia.key, hora_inicio: '08:00', hora_fim: '18:00', ativo: true }])
    }
  }

  function atualizarHora(diaSemana, campo, valor) {
    onChange(disponibilidade.map(d =>
      d.dia_semana === diaSemana ? { ...d, [campo]: valor } : d
    ))
  }

  return (
    <div className="agente-disp">
      {DIAS.map(dia => {
        const config = disponibilidade.find(d => d.dia_semana === dia.key)
        const ativo = !!config

        return (
          <div key={dia.key} className={`agente-disp__row ${ativo ? 'agente-disp__row--ativo' : ''}`}>
            <button
              type="button"
              className={`agente-disp__toggle ${ativo ? 'agente-disp__toggle--ativo' : ''}`}
              onClick={() => toggleDia(dia)}
            >
              <span className="agente-disp__toggle-dot" />
              <span className="agente-disp__toggle-label">{dia.label}</span>
            </button>

            {ativo ? (
              <div className="agente-disp__horas">
                <select
                  className="agente-disp__select"
                  value={config.hora_inicio}
                  onChange={e => atualizarHora(dia.key, 'hora_inicio', e.target.value)}
                >
                  {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="agente-disp__sep">até</span>
                <select
                  className="agente-disp__select"
                  value={config.hora_fim}
                  onChange={e => atualizarHora(dia.key, 'hora_fim', e.target.value)}
                >
                  {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ) : (
              <span className="agente-disp__fechado">Fechado</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function AgenteIA() {
  const { addToast } = useStore()
  const [aba, setAba] = useState('config')
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  // Pipelines e etapas
  const [pipelines, setPipelines] = useState([])
  const [etapas, setEtapas] = useState([])

  // Formulário de configuração
  const [form, setForm] = useState({
    ativo: false,
    nome: 'Assistente',
    nome_empresa: '',
    segmento: '',
    tom_voz: 'neutro',
    sobre_empresa: '',
    servicos: '',
    pipeline_id: '',
    etapa_inicial_id: '',
    openai_api_key: '',
    criar_lead_auto: true,
    transferir_humano: 'atendente',
    n8n_webhook_path: 'flowz-ai-agent',
    modelo_ia: 'gpt-4o-mini',
    horario_inicio: '08:00',
    horario_fim: '18:00',
    mensagem_fora_hora: 'Olá! Nosso atendimento é de segunda a sexta, das 8h às 18h. Em breve retornaremos!',
  })

  // Disponibilidade
  const [disponibilidade, setDisponibilidade] = useState([
    { dia_semana: 1, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
    { dia_semana: 2, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
    { dia_semana: 3, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
    { dia_semana: 4, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
    { dia_semana: 5, hora_inicio: '08:00', hora_fim: '18:00', ativo: true },
  ])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setCarregando(true)
    try {
      // Carrega pipelines e etapas
      const [{ data: pips }, { data: etps }] = await Promise.all([
        supabase.from('pipelines').select('id, nome').order('criado_em'),
        supabase.from('etapas').select('id, nome, pipeline_id').order('posicao'),
      ])
      setPipelines(pips || [])
      setEtapas(etps || [])

      // Carrega configuração do agente
      const agente = await agentesApi.get()
      if (agente && agente.id) {
        setForm(f => ({
          ...f,
          ativo:              agente.ativo ?? false,
          nome:               agente.nome || 'Assistente',
          nome_empresa:       agente.nome_empresa || '',
          segmento:           agente.segmento || '',
          tom_voz:            agente.tom_voz || 'neutro',
          sobre_empresa:      agente.sobre_empresa || '',
          servicos:           agente.servicos || '',
          pipeline_id:        agente.pipeline_id || '',
          etapa_inicial_id:   agente.etapa_inicial_id || '',
          openai_api_key:     agente.openai_api_key || '',
          criar_lead_auto:    agente.criar_lead_auto ?? true,
          transferir_humano:  agente.transferir_humano || 'atendente',
          n8n_webhook_path:   agente.n8n_webhook_path || 'flowz-ai-agent',
          modelo_ia:          agente.modelo_ia || 'gpt-4o-mini',
          horario_inicio:     agente.horario_inicio || '08:00',
          horario_fim:        agente.horario_fim || '18:00',
          mensagem_fora_hora: agente.mensagem_fora_hora || '',
        }))
      }

      // Carrega disponibilidade
      const disp = await agentesApi.getDisponibilidade()
      if (disp && disp.length > 0) setDisponibilidade(disp)
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao carregar configurações.' })
    } finally {
      setCarregando(false)
    }
  }

  function setField(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function salvarConfig(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await agentesApi.salvar(form)
      addToast({ type: 'success', message: 'Agente salvo com sucesso!' })
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao salvar agente.' })
    } finally {
      setSalvando(false)
    }
  }

  async function salvarDisponibilidade() {
    setSalvando(true)
    try {
      await agentesApi.salvarDisponibilidade(disponibilidade)
      addToast({ type: 'success', message: 'Disponibilidade salva!' })
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao salvar disponibilidade.' })
    } finally {
      setSalvando(false)
    }
  }

  const etapasDoPipeline = etapas.filter(e => e.pipeline_id === form.pipeline_id)

  if (carregando) {
    return (
      <AppLayout>
        <div className="agente-loading">Carregando configurações...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="agente-page">

        {/* Cabeçalho */}
        <div className="agente-header">
          <div className="agente-header__left">
            <h1 className="agente-header__title">Agente IA</h1>
            <p className="agente-header__sub">Configure e treine o assistente que atende seus clientes no WhatsApp</p>
          </div>

          {/* Toggle ativo */}
          <button
            type="button"
            className={`agente-toggle ${form.ativo ? 'agente-toggle--ativo' : ''}`}
            onClick={() => setField('ativo', !form.ativo)}
          >
            <span className="agente-toggle__dot" />
            <span className="agente-toggle__label">{form.ativo ? 'Ativo' : 'Inativo'}</span>
          </button>
        </div>

        {/* Abas */}
        <div className="agente-abas">
          <button
            className={`agente-aba ${aba === 'config' ? 'agente-aba--ativo' : ''}`}
            onClick={() => setAba('config')}
          >
            Configuração
          </button>
          <button
            className={`agente-aba ${aba === 'treinamento' ? 'agente-aba--ativo' : ''}`}
            onClick={() => setAba('treinamento')}
          >
            Treinamento
          </button>
          <button
            className={`agente-aba ${aba === 'disponibilidade' ? 'agente-aba--ativo' : ''}`}
            onClick={() => setAba('disponibilidade')}
          >
            Disponibilidade
          </button>
          <button
            className={`agente-aba ${aba === 'avancado' ? 'agente-aba--ativo' : ''}`}
            onClick={() => setAba('avancado')}
          >
            Avançado
          </button>
        </div>

        {/* ── ABA: CONFIGURAÇÃO ── */}
        {aba === 'config' && (
          <form className="agente-form" onSubmit={salvarConfig}>
            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Identidade do Agente</h2>

              <div className="agente-form__grid">
                <div className="agente-campo">
                  <label className="agente-campo__label">Nome do Agente</label>
                  <input
                    className="agente-campo__input"
                    value={form.nome}
                    onChange={e => setField('nome', e.target.value)}
                    placeholder="Ex: Ana, Carlos, Assistente..."
                  />
                </div>

                <div className="agente-campo">
                  <label className="agente-campo__label">Tom de Voz</label>
                  <div className="agente-tom">
                    {TOM_OPCOES.map(op => (
                      <button
                        key={op.value}
                        type="button"
                        className={`agente-tom__btn ${form.tom_voz === op.value ? 'agente-tom__btn--ativo' : ''}`}
                        onClick={() => setField('tom_voz', op.value)}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Dados da Empresa</h2>

              <div className="agente-form__grid">
                <div className="agente-campo">
                  <label className="agente-campo__label">Nome da Empresa</label>
                  <input
                    className="agente-campo__input"
                    value={form.nome_empresa}
                    onChange={e => setField('nome_empresa', e.target.value)}
                    placeholder="Ex: Clínica Estética Bella"
                  />
                </div>

                <div className="agente-campo">
                  <label className="agente-campo__label">Segmento / Área de atuação</label>
                  <input
                    className="agente-campo__input"
                    value={form.segmento}
                    onChange={e => setField('segmento', e.target.value)}
                    placeholder="Ex: Clínica estética, Imóveis, Consultório..."
                  />
                </div>
              </div>
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Pipeline de Leads</h2>
              <p className="agente-secao__sub">Quando o agente identificar um lead, em qual etapa ele será criado?</p>

              <div className="agente-form__grid">
                <div className="agente-campo">
                  <label className="agente-campo__label">Pipeline</label>
                  <select
                    className="agente-campo__select"
                    value={form.pipeline_id}
                    onChange={e => { setField('pipeline_id', e.target.value); setField('etapa_inicial_id', '') }}
                  >
                    <option value="">Selecione um pipeline</option>
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="agente-campo">
                  <label className="agente-campo__label">Etapa inicial</label>
                  <select
                    className="agente-campo__select"
                    value={form.etapa_inicial_id}
                    onChange={e => setField('etapa_inicial_id', e.target.value)}
                    disabled={!form.pipeline_id}
                  >
                    <option value="">Selecione uma etapa</option>
                    {etapasDoPipeline.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="agente-campo agente-campo--inline">
                <label className="agente-campo__label">Criar lead automaticamente ao identificar interesse</label>
                <button
                  type="button"
                  className={`agente-switch ${form.criar_lead_auto ? 'agente-switch--ativo' : ''}`}
                  onClick={() => setField('criar_lead_auto', !form.criar_lead_auto)}
                  aria-label="Toggle criar lead auto"
                >
                  <span className="agente-switch__dot" />
                </button>
              </div>
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Transferência para Humano</h2>
              <div className="agente-campo">
                <label className="agente-campo__label">Palavra-gatilho para pausar o agente</label>
                <input
                  className="agente-campo__input"
                  value={form.transferir_humano}
                  onChange={e => setField('transferir_humano', e.target.value)}
                  placeholder="Ex: atendente, humano, ajuda..."
                />
                <span className="agente-campo__hint">Quando o cliente digitar essa palavra, o agente para de responder.</span>
              </div>
            </div>

            <div className="agente-form__actions">
              <button type="submit" className="agente-btn-salvar" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </div>
          </form>
        )}

        {/* ── ABA: TREINAMENTO ── */}
        {aba === 'treinamento' && (
          <form className="agente-form" onSubmit={salvarConfig}>
            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Sobre a Empresa</h2>
              <p className="agente-secao__sub">Descreva sua empresa, diferenciais, localização, forma de atendimento. Quanto mais detalhes, melhor o agente vai responder.</p>
              <textarea
                className="agente-campo__textarea"
                value={form.sobre_empresa}
                onChange={e => setField('sobre_empresa', e.target.value)}
                rows={6}
                placeholder="Ex: Somos uma clínica de estética localizada no centro de São Paulo. Atendemos de segunda a sábado. Nossos diferenciais são o atendimento humanizado e equipamentos de última geração..."
              />
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Serviços e Produtos</h2>
              <p className="agente-secao__sub">Liste seus serviços, preços e informações relevantes. O agente usará isso para responder perguntas dos clientes.</p>
              <textarea
                className="agente-campo__textarea"
                value={form.servicos}
                onChange={e => setField('servicos', e.target.value)}
                rows={6}
                placeholder="Ex:&#10;- Limpeza de pele: R$150 (60 min)&#10;- Botox: a partir de R$800&#10;- Laser: R$300 por sessão&#10;- Pacotes com desconto disponíveis"
              />
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Instruções Adicionais</h2>
              <p className="agente-secao__sub">Regras específicas para o agente seguir. Comportamentos, o que deve ou não falar, como lidar com objeções.</p>
              <textarea
                className="agente-campo__textarea"
                value={form.prompt_sistema || ''}
                onChange={e => setField('prompt_sistema', e.target.value)}
                rows={5}
                placeholder="Ex: Nunca dê preços por mensagem, sempre convide para uma avaliação gratuita. Não fale de concorrentes. Foque em agendar uma consulta."
              />
            </div>

            <div className="agente-form__actions">
              <button type="submit" className="agente-btn-salvar" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar Treinamento'}
              </button>
            </div>
          </form>
        )}

        {/* ── ABA: DISPONIBILIDADE ── */}
        {aba === 'disponibilidade' && (
          <div className="agente-form">
            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Horários para Agendamento</h2>
              <p className="agente-secao__sub">Configure os dias e horários em que o agente pode oferecer agendamentos aos clientes.</p>

              <DisponibilidadeGrid
                disponibilidade={disponibilidade}
                onChange={setDisponibilidade}
              />
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Mensagem fora do horário</h2>
              <textarea
                className="agente-campo__textarea"
                value={form.mensagem_fora_hora}
                onChange={e => setField('mensagem_fora_hora', e.target.value)}
                rows={3}
                placeholder="Mensagem enviada quando o cliente entrar em contato fora do horário configurado."
              />
            </div>

            <div className="agente-form__actions">
              <button
                type="button"
                className="agente-btn-salvar"
                disabled={salvando}
                onClick={async () => {
                  await salvarDisponibilidade()
                  await agentesApi.salvar({ mensagem_fora_hora: form.mensagem_fora_hora })
                }}
              >
                {salvando ? 'Salvando...' : 'Salvar Disponibilidade'}
              </button>
            </div>
          </div>
        )}

        {/* ── ABA: AVANÇADO ── */}
        {aba === 'avancado' && (
          <form className="agente-form" onSubmit={salvarConfig}>
            <div className="agente-secao">
              <h2 className="agente-secao__titulo">Inteligência Artificial</h2>

              <div className="agente-form__grid">
                <div className="agente-campo">
                  <label className="agente-campo__label">Modelo de IA</label>
                  <select
                    className="agente-campo__select"
                    value={form.modelo_ia}
                    onChange={e => setField('modelo_ia', e.target.value)}
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (econômico)</option>
                    <option value="gpt-4o">GPT-4o (mais capaz)</option>
                  </select>
                </div>

                <div className="agente-campo">
                  <label className="agente-campo__label">Chave de API OpenAI</label>
                  <input
                    className="agente-campo__input"
                    type="password"
                    value={form.openai_api_key}
                    onChange={e => setField('openai_api_key', e.target.value)}
                    placeholder="sk-..."
                  />
                  <span className="agente-campo__hint">Sua chave é criptografada e nunca exposta ao cliente.</span>
                </div>
              </div>
            </div>

            <div className="agente-secao">
              <h2 className="agente-secao__titulo">N8N Webhook</h2>
              <div className="agente-campo">
                <label className="agente-campo__label">Path do Webhook</label>
                <div className="agente-webhook">
                  <span className="agente-webhook__base">https://lovingbeaver-n8n.cloudfy.live/webhook/</span>
                  <input
                    className="agente-campo__input agente-webhook__path"
                    value={form.n8n_webhook_path}
                    onChange={e => setField('n8n_webhook_path', e.target.value)}
                    placeholder="flowz-ai-agent"
                  />
                </div>
                <span className="agente-campo__hint">URL completa que receberá as mensagens do WhatsApp para processamento.</span>
              </div>
            </div>

            <div className="agente-form__actions">
              <button type="submit" className="agente-btn-salvar" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar Configurações Avançadas'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  )
}
