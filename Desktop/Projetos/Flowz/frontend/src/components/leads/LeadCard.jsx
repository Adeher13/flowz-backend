// Card de lead no kanban — draggable com prioridade e badge de parado
import { useState } from 'react'
import { getPriorityColor, getPriorityLabel, calcDaysStale } from '../../utils/helpers.js'
import { formatCurrency } from '../../utils/formatters.js'
import { Avatar } from '../ui/Avatar.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useStore } from '../../store/useStore.js'
import { useLeads } from '../../hooks/useLeads.js'
import './LeadCard.css'

export function LeadCard({ lead, onDragStart }) {
  const { openModal } = useStore()
  const { deletarLead } = useLeads()
  const [confirmando, setConfirmando] = useState(false)
  const diasParado = calcDaysStale(lead.atualizado_em)
  const parado = diasParado > 7
  const priorityColor = getPriorityColor(lead.prioridade)

  function handleDragStart(e) {
    e.dataTransfer.setData('leadId', lead.id)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(lead.id)
  }

  function handleClick() {
    openModal('lead', { lead })
  }

  function handleDeleteClick(e) {
    e.stopPropagation()
    setConfirmando(true)
  }

  async function handleConfirmarDelete(e) {
    e.stopPropagation()
    await deletarLead(lead.id, lead.titulo)
    setConfirmando(false)
  }

  function handleCancelarDelete(e) {
    e.stopPropagation()
    setConfirmando(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      className={`lead-card ${parado ? 'lead-card--stale' : ''}`}
      style={{ borderLeftColor: priorityColor }}
      draggable="true"
      onDragStart={handleDragStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Lead: ${lead.titulo}. Clique para abrir detalhes.`}
    >
      {/* Botão deletar (aparece no hover) */}
      {confirmando ? (
        <div className="lead-card__confirm-delete" onClick={e => e.stopPropagation()}>
          <span className="lead-card__confirm-text">Excluir lead?</span>
          <button className="lead-card__confirm-yes" onClick={handleConfirmarDelete}>Sim</button>
          <button className="lead-card__confirm-no" onClick={handleCancelarDelete}>Não</button>
        </div>
      ) : (
        <button className="lead-card__delete" onClick={handleDeleteClick} title="Excluir lead" aria-label="Excluir lead">
          ×
        </button>
      )}

      {/* Badge de lead parado */}
      {parado && (
        <div className="lead-card__stale-badge">
          <Badge variant="warning" size="sm">⚠ Parado {diasParado}d</Badge>
        </div>
      )}

      {/* Título */}
      <h3 className="lead-card__title">{lead.titulo}</h3>

      {/* Contato vinculado */}
      {lead.contato && (
        <p className="lead-card__contact">{lead.contato.nome}</p>
      )}

      {/* Valor */}
      {lead.valor && (
        <p className="lead-card__value">{formatCurrency(lead.valor)}</p>
      )}

      {/* Rodapé: prioridade + responsável */}
      <div className="lead-card__footer">
        <Badge
          variant={
            lead.prioridade === 'alta'
              ? 'danger'
              : lead.prioridade === 'media'
              ? 'warning'
              : 'mint'
          }
          size="sm"
        >
          {getPriorityLabel(lead.prioridade)}
        </Badge>

        {lead.responsavel && (
          <Avatar
            name={lead.responsavel.nome}
            src={lead.responsavel.avatar_url}
            size="xs"
          />
        )}
      </div>
    </div>
  )
}
