// Handler global de erros — captura erros não tratados nas rotas
export function errorHandler(err, req, res, next) {
  // Evita log de erros esperados (ex: validação)
  const statusCode = err.status || err.statusCode || 500

  if (statusCode >= 500) {
    console.error('[Flowz] Erro interno:', err.message, err.stack)
  }

  res.status(statusCode).json({
    erro: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

// Helper para criar erros com status HTTP personalizado
export function createError(message, status = 400) {
  const err = new Error(message)
  err.status = status
  return err
}
