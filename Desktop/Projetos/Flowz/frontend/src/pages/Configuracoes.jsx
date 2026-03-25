// Página de configurações — abas: Perfil, Empresa, Pipeline, Integrações
import { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/layout/Layout.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { useStore } from '../store/useStore.js'
import { authApi, evolutionApi, fetchWithAuth } from '../services/api.js'
import { supabase } from '../services/supabase.js'
import './Configuracoes.css'

const TABS = ['Perfil', 'Empresa', 'Pipeline', 'Integrações']

// Cores sugeridas para etapas
const CORES_ETAPA = [
  '#00E5FF', '#7B61FF', '#00FFA3', '#FFB800',
  '#FF4D6D', '#3B82F6', '#EC4899', '#8B5CF6',
  '#F59E0B', '#10B981', '#EF4444', '#6366F1',
]

export function Configuracoes() {
  const { usuario, etapas, setEtapas, pipelines, setPipelines, addToast, setEmpresaDados } = useStore()
  const [activeTab, setActiveTab] = useState('Perfil')
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [savingEmpresa, setSavingEmpresa] = useState(false)

  // Formulário de perfil
  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    cargo: '',
  })

  // Formulário de empresa
  const [empresaForm, setEmpresaForm] = useState({
    nome: '',
    segmento: '',
  })

  // Upload de logo da empresa
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef(null)

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_MB = 2
    if (file.size > MAX_MB * 1024 * 1024) {
      addToast({ type: 'error', message: `A logo deve ter no máximo ${MAX_MB}MB.` })
      return
    }
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Envie apenas imagens (PNG, JPG, SVG, WebP).' })
      return
    }

    setUploadingLogo(true)
    try {
      const empresaId = usuario?.empresa_id
      const ext = file.name.split('.').pop()
      const path = `${empresaId}/logo.${ext}`

      // Faz upload no bucket logos (upsert para sobrescrever a anterior)
      const { error: errUpload } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (errUpload) throw new Error(errUpload.message)

      // Busca a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path)

      // Adiciona cache-buster para forçar reload no browser
      const urlFinal = `${publicUrl}?t=${Date.now()}`

      // Salva no banco
      await authApi.atualizarEmpresa({ ...empresaForm, logo_url: urlFinal })

      // Atualiza o store imediatamente (white-label ao vivo)
      setEmpresaDados({ logo_url: urlFinal })

      addToast({ type: 'success', message: 'Logo atualizada!' })
    } catch (err) {
      addToast({ type: 'error', message: `Erro ao fazer upload: ${err.message}` })
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  async function handleRemoverLogo() {
    setUploadingLogo(true)
    try {
      await authApi.atualizarEmpresa({ ...empresaForm, logo_url: null })
      setEmpresaDados({ logo_url: null })
      addToast({ type: 'success', message: 'Logo removida.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setUploadingLogo(false)
    }
  }

  // Drag & drop para reordenar etapas
  const [dragEtapa, setDragEtapa] = useState(null)

  // Estado da aba Pipeline
  const [pipelineAtivo, setPipelineAtivo] = useState(null) // pipeline selecionado
  const [novaEtapa, setNovaEtapa] = useState({ nome: '', cor: '#00E5FF' })
  const [adicionandoEtapa, setAdicionandoEtapa] = useState(false)
  const [salvandoEtapa, setSalvandoEtapa] = useState(false)
  const [editandoEtapa, setEditandoEtapa] = useState(null) // { id, nome, cor }
  const [deletandoEtapa, setDeletandoEtapa] = useState(null) // id
  const [novoPipeline, setNovoPipeline] = useState('')
  const [criandoPipeline, setCriandoPipeline] = useState(false)
  const [salvandoPipeline, setSalvandoPipeline] = useState(false)

  const wsRef = useRef(null)

  // Google Calendar
  const [googleConectado, setGoogleConectado] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Integrações — Evolution API + N8N (configuração de URLs)
  const [evoForm, setEvoForm] = useState({ url: '', apiKey: '' })
  const [n8nForm, setN8nForm] = useState({ url: '', secret: '', path: 'flowz-ai-agent' })
  const [savingIntegracoes, setSavingIntegracoes] = useState(false)
  const [testandoEvo, setTestandoEvo] = useState(false)
  const [testandoN8n, setTestandoN8n] = useState(false)
  const [evoTestResult, setEvoTestResult] = useState(null)  // null | 'ok' | 'erro'
  const [n8nTestResult, setN8nTestResult] = useState(null)  // null | 'ok' | 'erro'

  // WhatsApp via Evolution API — instância + QR
  const [evoInstancia, setEvoInstancia] = useState(null)       // dados do banco
  const [evoStatus, setEvoStatus] = useState('unknown')        // open|close|qr|connecting|unknown|nao_configurada
  const [evoQR, setEvoQR] = useState(null)                     // base64 do QR
  const [evoLoading, setEvoLoading] = useState(false)
  const [evoNomeInstancia, setEvoNomeInstancia] = useState('') // nome da instância já criada no Cloudify
  const wsEvoRef = useRef(null)

  // WebSocket removido — Baileys não é mais usado

  // Verifica se voltou do OAuth do Google (roda ao montar, independente de aba)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('google') === 'conectado') {
      setGoogleConectado(true)
      setActiveTab('Integrações')
      addToast({ type: 'success', message: 'Google Calendar conectado!' })
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('erro')?.startsWith('google')) {
      setActiveTab('Integrações')
      addToast({ type: 'error', message: 'Erro ao conectar Google Calendar.' })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Carrega status Google Calendar
  useEffect(() => {
    if (activeTab !== 'Integrações') return
    fetchWithAuth('/google-calendar/status').then(d => {
      setGoogleConectado(d?.conectado || false)
    }).catch(() => {})
  }, [activeTab])

  async function conectarGoogle() {
    setGoogleLoading(true)
    try {
      const data = await fetchWithAuth('/google-calendar/auth')
      if (data?.url) window.location.href = data.url
    } catch {
      addToast({ type: 'error', message: 'Erro ao iniciar conexão com Google.' })
    } finally {
      setGoogleLoading(false)
    }
  }

  async function desconectarGoogle() {
    setGoogleLoading(true)
    try {
      await fetchWithAuth('/google-calendar/desconectar', { method: 'DELETE' })
      setGoogleConectado(false)
      addToast({ type: 'success', message: 'Google Calendar desconectado.' })
    } catch {
      addToast({ type: 'error', message: 'Erro ao desconectar.' })
    } finally {
      setGoogleLoading(false)
    }
  }

  // Carrega configurações de integrações ao entrar na aba
  useEffect(() => {
    if (activeTab !== 'Integrações') return
    authApi.getIntegracoes().then((data) => {
      if (!data) return
      setEvoForm({ url: data.evolution_api_url || '', apiKey: data.evolution_api_key || '' })
      setN8nForm({
        url: data.n8n_url || '',
        secret: data.n8n_webhook_secret || '',
        path: data.n8n_ai_webhook_path || 'flowz-ai-agent',
      })
    }).catch(() => {})
  }, [activeTab])

  async function handleSalvarIntegracoes() {
    setSavingIntegracoes(true)
    try {
      await authApi.salvarIntegracoes({
        evolution_api_url: evoForm.url,
        evolution_api_key: evoForm.apiKey,
        n8n_url: n8nForm.url,
        n8n_webhook_secret: n8nForm.secret,
        n8n_ai_webhook_path: n8nForm.path,
      })
      addToast({ type: 'success', message: 'Integrações salvas!' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSavingIntegracoes(false)
    }
  }

  async function handleTestarEvolution() {
    if (!evoForm.url || !evoForm.apiKey) {
      addToast({ type: 'error', message: 'Preencha a URL e a API Key da Evolution.' })
      return
    }
    setTestandoEvo(true)
    setEvoTestResult(null)
    try {
      const resp = await fetch(`${evoForm.url}/instance/fetchInstances`, {
        headers: { apikey: evoForm.apiKey },
      })
      setEvoTestResult(resp.ok ? 'ok' : 'erro')
    } catch {
      setEvoTestResult('erro')
    } finally {
      setTestandoEvo(false)
    }
  }

  async function handleTestarN8n() {
    if (!n8nForm.url) {
      addToast({ type: 'error', message: 'Preencha a URL do N8N.' })
      return
    }
    setTestandoN8n(true)
    setN8nTestResult(null)
    try {
      const resp = await fetch(`${n8nForm.url}/healthz`)
      setN8nTestResult(resp.ok ? 'ok' : 'erro')
    } catch {
      setN8nTestResult('erro')
    } finally {
      setTestandoN8n(false)
    }
  }

  // WebSocket Evolution API — recebe QR e status em tempo real
  useEffect(() => {
    if (activeTab !== 'Integrações') return

    let ws
    let reconnectTimer

    function conectarWsEvo() {
      ws = new WebSocket('ws://localhost:3001/ws/whatsapp-evo')
      wsEvoRef.current = ws

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'evo_status') {
            setEvoStatus(data.status)
            if (data.status === 'open') setEvoQR(null)
          }
          if (data.type === 'evo_qr') {
            setEvoQR(data.qr)
            setEvoStatus('qr')
          }
        } catch {}
      }

      ws.onclose = () => {
        reconnectTimer = setTimeout(conectarWsEvo, 3000)
      }
    }

    conectarWsEvo()
    return () => {
      clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [activeTab])

  // Carrega instância Evolution ao entrar na aba
  useEffect(() => {
    if (activeTab !== 'Integrações') return
    evolutionApi.getInstancia().then((data) => {
      setEvoInstancia(data?.instancia || null)
      setEvoStatus(data?.status || 'unknown')
    }).catch(() => {})
  }, [activeTab])

  async function handleCriarInstanciaEvo() {
    setEvoLoading(true)
    try {
      await evolutionApi.criarInstancia()
      const data = await evolutionApi.getInstancia()
      setEvoInstancia(data?.instancia || null)
      setEvoStatus(data?.status || 'unknown')
      addToast({ type: 'success', message: 'Instância criada! Agora clique em Conectar.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setEvoLoading(false)
    }
  }

  async function handleConectarEvo() {
    setEvoLoading(true)
    try {
      const data = await evolutionApi.conectar()
      if (data?.base64) setEvoQR(data.base64)
      setEvoStatus('qr')
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setEvoLoading(false)
    }
  }

  async function handleDesconectarEvo() {
    setEvoLoading(true)
    try {
      await evolutionApi.desconectar()
      setEvoStatus('close')
      setEvoQR(null)
      addToast({ type: 'success', message: 'WhatsApp desconectado.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setEvoLoading(false)
    }
  }

  async function handleDeletarInstanciaEvo() {
    if (!confirm('Tem certeza? Isso vai remover a instância permanentemente.')) return
    setEvoLoading(true)
    try {
      await evolutionApi.deletar()
      setEvoInstancia(null)
      setEvoStatus('nao_configurada')
      setEvoQR(null)
      addToast({ type: 'success', message: 'Instância removida.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setEvoLoading(false)
    }
  }


  useEffect(() => {
    if (usuario) {
      setPerfilForm({ nome: usuario.nome || '', cargo: usuario.cargo || '' })
      setEmpresaForm({
        nome: usuario.empresa?.nome || '',
        segmento: usuario.empresa?.segmento || '',
      })
    }
  }, [usuario])

  // Carrega pipelines e etapas ao entrar na aba Pipeline (caso não estejam no store)
  useEffect(() => {
    if (activeTab !== 'Pipeline') return
    if (pipelines.length > 0) return // já carregados
    // Não filtra por empresa_id aqui — a RLS já garante isolamento
    Promise.all([
      supabase.from('pipelines').select('*').order('criado_em', { ascending: true }),
      supabase.from('etapas').select('*').order('ordem', { ascending: true }),
    ]).then(([{ data: pipelinesData }, { data: etapasData }]) => {
      if (pipelinesData) setPipelines(pipelinesData)
      if (etapasData) setEtapas(etapasData)
    })
  }, [activeTab])

  // Seleciona automaticamente o primeiro pipeline ao carregar
  useEffect(() => {
    if (pipelines.length > 0 && !pipelineAtivo) {
      setPipelineAtivo(pipelines[0])
    }
  }, [pipelines])

  async function handleSalvarPerfil(e) {
    e.preventDefault()
    setSavingPerfil(true)
    try {
      await authApi.atualizarPerfil(perfilForm)
      addToast({ type: 'success', message: 'Perfil atualizado.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSavingPerfil(false)
    }
  }

  async function handleSalvarEmpresa(e) {
    e.preventDefault()
    setSavingEmpresa(true)
    try {
      await authApi.atualizarEmpresa(empresaForm)
      addToast({ type: 'success', message: 'Dados da empresa atualizados.' })
    } catch (err) {
      addToast({ type: 'error', message: err.message })
    } finally {
      setSavingEmpresa(false)
    }
  }

  // Drag & drop nativo para reordenar etapas do pipeline
  function handleEtapaDragStart(e, etapa) {
    setDragEtapa(etapa)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleEtapaDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleEtapaDrop(targetEtapa) {
    if (!dragEtapa || dragEtapa.id === targetEtapa.id) {
      setDragEtapa(null)
      return
    }

    const newEtapas = [...etapas]
    const fromIdx = newEtapas.findIndex((e) => e.id === dragEtapa.id)
    const toIdx = newEtapas.findIndex((e) => e.id === targetEtapa.id)
    const [removed] = newEtapas.splice(fromIdx, 1)
    newEtapas.splice(toIdx, 0, removed)

    // Atualiza a ordem em cada etapa
    const reordered = newEtapas.map((e, i) => ({ ...e, ordem: i }))
    setEtapas(reordered)
    setDragEtapa(null)

    // Persiste no banco (fire & forget — sem bloquear a UI)
    Promise.all(
      reordered.map((e) =>
        supabase.from('etapas').update({ ordem: e.ordem }).eq('id', e.id)
      )
    ).then(() => {
      addToast({ type: 'success', message: 'Ordem das etapas salva.' })
    }).catch(() => {
      addToast({ type: 'error', message: 'Erro ao salvar ordem. Tente novamente.' })
    })
  }

  async function salvarNovoPipeline() {
    if (!novoPipeline.trim() || salvandoPipeline) return
    setSalvandoPipeline(true)
    try {
      const empresaId = usuario?.empresa_id
      if (!empresaId) {
        addToast({ type: 'error', message: 'Sessão não carregada. Recarregue a página.' })
        return
      }
      const { data, error } = await supabase
        .from('pipelines')
        .insert({ nome: novoPipeline.trim(), empresa_id: empresaId })
        .select()
        .single()
      if (error) {
        addToast({ type: 'error', message: `Erro: ${error.message}` })
        return
      }
      setPipelines([...pipelines, data])
      setPipelineAtivo(data)
      setNovoPipeline('')
      setCriandoPipeline(false)
      addToast({ type: 'success', message: 'Funil criado!' })
    } catch (err) {
      addToast({ type: 'error', message: `Erro inesperado: ${err.message}` })
    } finally {
      setSalvandoPipeline(false)
    }
  }

  return (
    <Layout title="Configurações">
      <div className="config-page page-enter">
        {/* Abas de navegação */}
        <div className="config-page__tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`config-page__tab ${activeTab === tab ? 'config-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="config-page__content">

          {/* Aba Perfil */}
          {activeTab === 'Perfil' && (
            <div className="config-section">
              <h2 className="config-section__title">Meu Perfil</h2>
              <form className="config-section__form" onSubmit={handleSalvarPerfil}>
                <div className="config-section__email-info">
                  <p className="input-field__label">E-mail</p>
                  <p className="config-section__email">{usuario?.email}</p>
                  <p className="input-field__hint">O e-mail não pode ser alterado aqui</p>
                </div>
                <Input
                  id="config-nome"
                  label="Nome completo"
                  value={perfilForm.nome}
                  onChange={(e) => setPerfilForm((p) => ({ ...p, nome: e.target.value }))}
                />
                <Input
                  id="config-cargo"
                  label="Cargo"
                  value={perfilForm.cargo}
                  onChange={(e) => setPerfilForm((p) => ({ ...p, cargo: e.target.value }))}
                  placeholder="Ex: Gerente de Vendas"
                />
                <Button variant="primary" type="submit" loading={savingPerfil}>
                  Salvar alterações
                </Button>
              </form>
            </div>
          )}

          {/* Aba Empresa */}
          {activeTab === 'Empresa' && (
            <div className="config-section">
              <h2 className="config-section__title">Dados da Empresa</h2>

              {/* Upload de logo */}
              <div className="config-logo">
                <p className="config-logo__label">Logo da empresa</p>
                <p className="config-logo__hint">
                  Aparece no menu lateral no lugar da logo Flowz. PNG, JPG, SVG ou WebP · máx 2MB
                </p>
                <div className="config-logo__preview-row">
                  <div className="config-logo__preview">
                    {usuario?.empresa?.logo_url ? (
                      <img
                        src={usuario.empresa.logo_url}
                        alt="Logo da empresa"
                        className="config-logo__img"
                      />
                    ) : (
                      <span className="config-logo__empty">Sem logo</span>
                    )}
                  </div>
                  <div className="config-logo__actions">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="config-logo__input-hidden"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => logoInputRef.current?.click()}
                      loading={uploadingLogo}
                    >
                      {usuario?.empresa?.logo_url ? 'Trocar logo' : 'Enviar logo'}
                    </Button>
                    {usuario?.empresa?.logo_url && (
                      <Button
                        variant="danger"
                        onClick={handleRemoverLogo}
                        loading={uploadingLogo}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <form className="config-section__form" onSubmit={handleSalvarEmpresa}>
                <Input
                  id="config-empresa-nome"
                  label="Nome da empresa"
                  value={empresaForm.nome}
                  onChange={(e) => setEmpresaForm((p) => ({ ...p, nome: e.target.value }))}
                />
                <Input
                  id="config-segmento"
                  label="Segmento / nicho"
                  value={empresaForm.segmento}
                  onChange={(e) => setEmpresaForm((p) => ({ ...p, segmento: e.target.value }))}
                  placeholder="Ex: Saúde, Educação, Tecnologia..."
                />
                <Button variant="primary" type="submit" loading={savingEmpresa}>
                  Salvar alterações
                </Button>
              </form>
            </div>
          )}

          {/* Aba Pipeline */}
          {activeTab === 'Pipeline' && (
            <div className="config-section">
              <h2 className="config-section__title">Funil de Vendas</h2>

              {/* Seletor de pipeline */}
              <div className="config-pipeline__header">
                <div className="config-pipeline__tabs">
                  {pipelines.map(p => (
                    <button
                      key={p.id}
                      className={`config-pipeline__tab-btn ${pipelineAtivo?.id === p.id ? 'config-pipeline__tab-btn--ativo' : ''}`}
                      onClick={() => setPipelineAtivo(p)}
                    >
                      {p.nome}
                    </button>
                  ))}
                  {/* Botão criar pipeline */}
                  {criandoPipeline ? (
                    <div className="config-pipeline__novo-wrap">
                      <input
                        className="config-pipeline__novo-input"
                        placeholder="Nome do funil"
                        value={novoPipeline}
                        onChange={e => setNovoPipeline(e.target.value)}
                        autoFocus
                        disabled={salvandoPipeline}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') await salvarNovoPipeline()
                          if (e.key === 'Escape') { setCriandoPipeline(false); setNovoPipeline('') }
                        }}
                      />
                      <button
                        className="config-pipeline__novo-ok"
                        disabled={salvandoPipeline || !novoPipeline.trim()}
                        onClick={salvarNovoPipeline}
                      >
                        {salvandoPipeline ? '...' : 'Salvar'}
                      </button>
                      <button className="config-pipeline__novo-cancel" onClick={() => { setCriandoPipeline(false); setNovoPipeline('') }}>✕</button>
                    </div>
                  ) : (
                    <button className="config-pipeline__add-pipeline" onClick={() => setCriandoPipeline(true)}>
                      + Novo funil
                    </button>
                  )}
                </div>
              </div>

              {!pipelineAtivo && pipelines.length > 0 && (
                <p className="config-section__hint">Selecione um funil acima para ver as etapas.</p>
              )}
              {pipelines.length === 0 && (
                <p className="config-section__hint">Nenhum funil criado. Clique em "+ Novo funil" para começar.</p>
              )}

              {pipelineAtivo && (
                <>
                  <p className="config-section__hint">
                    Arraste para reordenar · Clique no nome para editar · Lixeira para excluir
                  </p>
                  <div className="config-pipeline__list">
                    {etapas.filter(e => e.pipeline_id === pipelineAtivo.id).length === 0 && !adicionandoEtapa && (
                      <p className="config-section__hint">Nenhuma etapa neste funil ainda.</p>
                    )}

                    {etapas
                      .filter(e => e.pipeline_id === pipelineAtivo.id)
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((etapa) => (
                        <div
                          key={etapa.id}
                          className={`config-pipeline__item ${dragEtapa?.id === etapa.id ? 'config-pipeline__item--dragging' : ''}`}
                          draggable={!editandoEtapa}
                          onDragStart={(e) => handleEtapaDragStart(e, etapa)}
                          onDragOver={handleEtapaDragOver}
                          onDrop={() => handleEtapaDrop(etapa)}
                        >
                          <span className="config-pipeline__handle" aria-hidden="true">⠿</span>

                          {editandoEtapa?.id === etapa.id ? (
                            // Modo edição inline
                            <>
                              <div className="config-pipeline__edit-cores">
                                {CORES_ETAPA.map(cor => (
                                  <button
                                    key={cor}
                                    className={`config-pipeline__cor ${editandoEtapa.cor === cor ? 'config-pipeline__cor--ativa' : ''}`}
                                    style={{ backgroundColor: cor }}
                                    onClick={() => setEditandoEtapa(p => ({ ...p, cor }))}
                                  />
                                ))}
                              </div>
                              <input
                                className="config-pipeline__edit-input"
                                value={editandoEtapa.nome}
                                onChange={e => setEditandoEtapa(p => ({ ...p, nome: e.target.value }))}
                                autoFocus
                                onKeyDown={async (ev) => {
                                  if (ev.key === 'Enter') {
                                    if (!editandoEtapa.nome.trim()) return
                                    const { error } = await supabase
                                      .from('etapas')
                                      .update({ nome: editandoEtapa.nome.trim(), cor: editandoEtapa.cor })
                                      .eq('id', etapa.id)
                                    if (error) { addToast({ type: 'error', message: 'Erro ao salvar.' }); return }
                                    setEtapas(etapas.map(e => e.id === etapa.id ? { ...e, nome: editandoEtapa.nome.trim(), cor: editandoEtapa.cor } : e))
                                    setEditandoEtapa(null)
                                    addToast({ type: 'success', message: 'Etapa atualizada.' })
                                  }
                                  if (ev.key === 'Escape') setEditandoEtapa(null)
                                }}
                              />
                              <button className="config-pipeline__edit-ok" onClick={async () => {
                                if (!editandoEtapa.nome.trim()) return
                                const { error } = await supabase
                                  .from('etapas')
                                  .update({ nome: editandoEtapa.nome.trim(), cor: editandoEtapa.cor })
                                  .eq('id', etapa.id)
                                if (error) { addToast({ type: 'error', message: 'Erro ao salvar.' }); return }
                                setEtapas(etapas.map(e => e.id === etapa.id ? { ...e, nome: editandoEtapa.nome.trim(), cor: editandoEtapa.cor } : e))
                                setEditandoEtapa(null)
                                addToast({ type: 'success', message: 'Etapa atualizada.' })
                              }}>✓</button>
                              <button className="config-pipeline__edit-cancel" onClick={() => setEditandoEtapa(null)}>✕</button>
                            </>
                          ) : (
                            // Modo visualização
                            <>
                              <span
                                className="config-pipeline__dot"
                                style={{ backgroundColor: etapa.cor }}
                              />
                              <span className="config-pipeline__name">{etapa.nome}</span>
                              <span className="config-pipeline__order">#{etapa.ordem + 1}</span>
                              <div className="config-pipeline__actions">
                                <button
                                  className="config-pipeline__btn-edit"
                                  title="Editar etapa"
                                  onClick={() => setEditandoEtapa({ id: etapa.id, nome: etapa.nome, cor: etapa.cor || '#00E5FF' })}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                <button
                                  className="config-pipeline__btn-delete"
                                  title="Excluir etapa"
                                  disabled={deletandoEtapa === etapa.id}
                                  onClick={async () => {
                                    if (!window.confirm(`Excluir a etapa "${etapa.nome}"? Os leads nesta etapa serão impedidos de mover para cá.`)) return
                                    setDeletandoEtapa(etapa.id)
                                    const { error } = await supabase.from('etapas').delete().eq('id', etapa.id)
                                    setDeletandoEtapa(null)
                                    if (error) {
                                      addToast({ type: 'error', message: error.code === '23503' ? 'Há leads nesta etapa. Mova-os antes de excluir.' : 'Erro ao excluir etapa.' })
                                      return
                                    }
                                    setEtapas(etapas.filter(e => e.id !== etapa.id))
                                    addToast({ type: 'success', message: 'Etapa excluída.' })
                                  }}
                                >
                                  {deletandoEtapa === etapa.id ? '...' : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    }

                    {/* Formulário para nova etapa */}
                    {adicionandoEtapa && (
                      <div className="config-pipeline__nova-etapa">
                        <div className="config-pipeline__nova-cores">
                          {CORES_ETAPA.map(cor => (
                            <button
                              key={cor}
                              className={`config-pipeline__cor ${novaEtapa.cor === cor ? 'config-pipeline__cor--ativa' : ''}`}
                              style={{ backgroundColor: cor }}
                              onClick={() => setNovaEtapa(p => ({ ...p, cor }))}
                            />
                          ))}
                        </div>
                        <input
                          className="config-pipeline__nova-input"
                          placeholder="Nome da etapa (ex: Proposta Enviada)"
                          value={novaEtapa.nome}
                          onChange={e => setNovaEtapa(p => ({ ...p, nome: e.target.value }))}
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (!novaEtapa.nome.trim()) return
                              setSalvandoEtapa(true)
                              const ordemAtual = etapas.filter(x => x.pipeline_id === pipelineAtivo.id).length
                              const { data, error } = await supabase
                                .from('etapas')
                                .insert({ pipeline_id: pipelineAtivo.id, nome: novaEtapa.nome.trim(), cor: novaEtapa.cor, ordem: ordemAtual })
                                .select()
                                .single()
                              setSalvandoEtapa(false)
                              if (error) { addToast({ type: 'error', message: 'Erro ao criar etapa.' }); return }
                              setEtapas([...etapas, data])
                              setNovaEtapa({ nome: '', cor: '#00E5FF' })
                              setAdicionandoEtapa(false)
                              addToast({ type: 'success', message: 'Etapa criada!' })
                            }
                            if (e.key === 'Escape') { setAdicionandoEtapa(false); setNovaEtapa({ nome: '', cor: '#00E5FF' }) }
                          }}
                        />
                        <button
                          className="config-pipeline__nova-ok"
                          disabled={salvandoEtapa || !novaEtapa.nome.trim()}
                          onClick={async () => {
                            if (!novaEtapa.nome.trim()) return
                            setSalvandoEtapa(true)
                            const ordemAtual = etapas.filter(x => x.pipeline_id === pipelineAtivo.id).length
                            const { data, error } = await supabase
                              .from('etapas')
                              .insert({ pipeline_id: pipelineAtivo.id, nome: novaEtapa.nome.trim(), cor: novaEtapa.cor, ordem: ordemAtual })
                              .select()
                              .single()
                            setSalvandoEtapa(false)
                            if (error) { addToast({ type: 'error', message: 'Erro ao criar etapa.' }); return }
                            setEtapas([...etapas, data])
                            setNovaEtapa({ nome: '', cor: '#00E5FF' })
                            setAdicionandoEtapa(false)
                            addToast({ type: 'success', message: 'Etapa criada!' })
                          }}
                        >
                          {salvandoEtapa ? '...' : 'Salvar'}
                        </button>
                        <button className="config-pipeline__nova-cancel" onClick={() => { setAdicionandoEtapa(false); setNovaEtapa({ nome: '', cor: '#00E5FF' }) }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {!adicionandoEtapa && (
                    <button className="config-pipeline__add-etapa" onClick={() => setAdicionandoEtapa(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Adicionar etapa
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Aba Integrações */}
          {activeTab === 'Integrações' && (
            <div className="config-section">
              <h2 className="config-section__title">Integrações</h2>

              {/* Evolution API — configuração + conexão WhatsApp */}
              <div className="config-integration__card">
                <div className="config-integration__header">
                  <div className="config-integration__icon">⚡</div>
                  <div>
                    <h3 className="config-integration__name">WhatsApp via Evolution API</h3>
                    <p className="config-integration__desc">
                      Configure a URL e conecte seu número para enviar e receber mensagens no CRM
                    </p>
                  </div>
                  {evoStatus === 'open' && <Badge variant="mint">Conectado</Badge>}
                  {(evoStatus === 'qr' || evoStatus === 'connecting') && <Badge variant="warning">Aguardando</Badge>}
                  {(evoStatus === 'close' || evoStatus === 'unknown') && evoInstancia && <Badge variant="default">Desconectado</Badge>}
                </div>

                {/* Configuração de URL / Key */}
                <div className="config-integracoes__form">
                  <div className="config-integracoes__field">
                    <label className="config-integracoes__label">URL da Evolution API</label>
                    <Input
                      placeholder="https://evo.seusite.com"
                      value={evoForm.url}
                      onChange={(e) => setEvoForm(f => ({ ...f, url: e.target.value }))}
                    />
                  </div>
                  <div className="config-integracoes__field">
                    <label className="config-integracoes__label">API Key</label>
                    <Input
                      type="password"
                      placeholder="Sua chave de autenticação"
                      value={evoForm.apiKey}
                      onChange={(e) => setEvoForm(f => ({ ...f, apiKey: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="config-integracoes__actions">
                  <Button variant="secondary" onClick={handleTestarEvolution} loading={testandoEvo}>
                    Testar conexão
                  </Button>
                  {evoTestResult === 'ok' && <span className="config-integracoes__test-ok">✓ Servidor OK</span>}
                  {evoTestResult === 'erro' && <span className="config-integracoes__test-err">✗ Falha na conexão</span>}
                </div>

                {/* Separador */}
                <div className="config-integracoes__divider" />

                {/* Fluxo de instância */}
                {!evoInstancia ? (
                  <div className="config-integracoes__instancia-vazia">
                    <p className="config-integracoes__instancia-hint">
                      Já criou uma instância no painel do Cloudify? Informe o nome abaixo para vincular ao Flowz.
                    </p>
                    <div className="config-integracoes__field" style={{ marginBottom: '12px' }}>
                      <label className="config-integracoes__label">Nome da instância no Cloudify</label>
                      <Input
                        placeholder="ex: flowz-lucas"
                        value={evoNomeInstancia}
                        onChange={(e) => setEvoNomeInstancia(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        setEvoLoading(true)
                        try {
                          await evolutionApi.criarInstancia(evoNomeInstancia.trim() || undefined)
                          const data = await evolutionApi.getInstancia()
                          setEvoInstancia(data?.instancia || null)
                          setEvoStatus(data?.status || 'close')
                          addToast({ type: 'success', message: 'Instância vinculada! Agora clique em Conectar WhatsApp.' })
                        } catch (err) {
                          addToast({ type: 'error', message: err.message })
                        } finally {
                          setEvoLoading(false)
                        }
                      }}
                      loading={evoLoading}
                      disabled={!evoNomeInstancia.trim()}
                    >
                      Vincular instância
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* QR Code */}
                    {evoStatus === 'qr' && evoQR && (
                      <div className="config-wa__qr-wrapper">
                        <p className="config-wa__qr-hint">
                          Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                        </p>
                        <img src={evoQR} alt="QR Code WhatsApp" className="config-wa__qr" />
                      </div>
                    )}

                    {/* Aguardando QR sem imagem ainda */}
                    {evoStatus === 'qr' && !evoQR && (
                      <div className="config-wa__connecting">
                        <div className="config-wa__spinner" />
                        <p>Gerando QR Code...</p>
                      </div>
                    )}

                    {/* Conectado */}
                    {evoStatus === 'open' && (
                      <div className="config-wa__connected">
                        <span className="config-wa__connected-dot" />
                        <p>WhatsApp conectado e pronto para usar.</p>
                      </div>
                    )}

                    {/* Info da instância */}
                    <div className="config-integracoes__instancia-info">
                      <span className="config-integracoes__instancia-nome">
                        Instância: <strong>{evoInstancia.instance_name}</strong>
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="config-wa__actions">
                      {(evoStatus === 'close' || evoStatus === 'unknown') && (
                        <Button variant="primary" onClick={handleConectarEvo} loading={evoLoading}>
                          Conectar WhatsApp
                        </Button>
                      )}
                      {evoStatus === 'open' && (
                        <Button variant="danger" onClick={handleDesconectarEvo} loading={evoLoading}>
                          Desconectar
                        </Button>
                      )}
                      {evoStatus === 'qr' && (
                        <Button variant="secondary" onClick={handleConectarEvo} loading={evoLoading}>
                          Gerar novo QR
                        </Button>
                      )}
                      <Button variant="secondary" onClick={handleDeletarInstanciaEvo} disabled={evoLoading}>
                        Remover instância
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* N8N */}
              <div className="config-integration__card">
                <div className="config-integration__header">
                  <div className="config-integration__icon">🤖</div>
                  <div>
                    <h3 className="config-integration__name">N8N — Agente IA</h3>
                    <p className="config-integration__desc">
                      Configure o N8N para processar mensagens com IA e responder automaticamente
                    </p>
                  </div>
                  {n8nTestResult === 'ok' && <Badge variant="mint">Conectado</Badge>}
                  {n8nTestResult === 'erro' && <Badge variant="danger">Falha</Badge>}
                </div>
                <div className="config-integracoes__form">
                  <div className="config-integracoes__field">
                    <label className="config-integracoes__label">URL do N8N</label>
                    <Input
                      placeholder="https://n8n.seusite.com"
                      value={n8nForm.url}
                      onChange={(e) => setN8nForm(f => ({ ...f, url: e.target.value }))}
                    />
                  </div>
                  <div className="config-integracoes__field">
                    <label className="config-integracoes__label">Webhook Secret</label>
                    <Input
                      type="password"
                      placeholder="Chave secreta do webhook"
                      value={n8nForm.secret}
                      onChange={(e) => setN8nForm(f => ({ ...f, secret: e.target.value }))}
                    />
                  </div>
                  <div className="config-integracoes__field">
                    <label className="config-integracoes__label">Caminho do Webhook</label>
                    <Input
                      placeholder="flowz-ai-agent"
                      value={n8nForm.path}
                      onChange={(e) => setN8nForm(f => ({ ...f, path: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="config-integracoes__actions">
                  <Button variant="secondary" onClick={handleTestarN8n} loading={testandoN8n}>
                    Testar conexão
                  </Button>
                </div>
              </div>

              {/* Botão salvar integrações */}
              <div className="config-integracoes__save">
                <Button variant="primary" onClick={handleSalvarIntegracoes} loading={savingIntegracoes}>
                  Salvar integrações
                </Button>
              </div>

              {/* Importar CSV — em breve */}
              <div className="config-integration__card config-integration__card--disabled">
                <div className="config-integration__header">
                  <div className="config-integration__icon">📋</div>
                  <div>
                    <h3 className="config-integration__name">Importar CSV</h3>
                    <p className="config-integration__desc">
                      Importe contatos e leads a partir de planilhas Excel ou CSV
                    </p>
                  </div>
                  <Badge variant="warning">Em breve</Badge>
                </div>
                <Button variant="secondary" disabled>Importar arquivo</Button>
              </div>

              {/* Google Calendar */}
              <div className={`config-integration__card ${googleConectado ? 'config-integration__card--connected' : ''}`}>
                <div className="config-integration__header">
                  <div className="config-integration__icon">📅</div>
                  <div>
                    <h3 className="config-integration__name">Google Calendar</h3>
                    <p className="config-integration__desc">
                      Sincronize agendamentos do Flowz com seu Google Calendar automaticamente. Quando um agendamento for criado, ele aparece no seu calendário em tempo real.
                    </p>
                  </div>
                  {googleConectado
                    ? <Badge variant="success">Conectado</Badge>
                    : <Badge variant="default">Desconectado</Badge>
                  }
                </div>
                {googleConectado
                  ? <Button variant="secondary" onClick={desconectarGoogle} loading={googleLoading}>Desconectar Google Calendar</Button>
                  : <Button variant="primary" onClick={conectarGoogle} loading={googleLoading}>Conectar Google Calendar</Button>
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
