/**
 * Sistema de tracking de requisições e tempo para logging detalhado
 */

export interface RequestStats {
  total: number
  byType: Record<string, number>
  cacheHits: number
  cacheMisses: number
  errors: number
  retries: number
}

export interface TimeStats {
  total: number
  byStep: Record<string, number>
  startTime: number
}

export interface ProcessTracker {
  requestStats: RequestStats
  timeStats: TimeStats
  currentStep: string
  stepStartTime: number
  errors: Array<{ step: string; error: string; timestamp: number }>
}

// Tracker global para o processo atual
let currentTracker: ProcessTracker | null = null

/**
 * Inicia um novo processo de tracking
 */
export function startProcess(processName: string): ProcessTracker {
  const now = Date.now()
  currentTracker = {
    requestStats: {
      total: 0,
      byType: {},
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      retries: 0,
    },
    timeStats: {
      total: 0,
      byStep: {},
      startTime: now,
    },
    currentStep: processName,
    stepStartTime: now,
    errors: [],
  }
  
  logStep(`🚀 Iniciando processo: ${processName}`)
  return currentTracker
}

/**
 * Finaliza o processo atual e retorna estatísticas
 */
export function endProcess(): ProcessTracker | null {
  if (!currentTracker) return null
  
  const elapsed = Date.now() - currentTracker.timeStats.startTime
  currentTracker.timeStats.total = elapsed
  
  logSummary(currentTracker)
  
  const tracker = currentTracker
  currentTracker = null
  return tracker
}

/**
 * Inicia uma nova etapa do processo
 */
export function startStep(stepName: string): void {
  if (!currentTracker) return
  
  // Finalizar etapa anterior
  if (currentTracker.currentStep) {
    const stepElapsed = Date.now() - currentTracker.stepStartTime
    currentTracker.timeStats.byStep[currentTracker.currentStep] = 
      (currentTracker.timeStats.byStep[currentTracker.currentStep] || 0) + stepElapsed
  }
  
  // Iniciar nova etapa
  currentTracker.currentStep = stepName
  currentTracker.stepStartTime = Date.now()
  
  logStep(`📋 Etapa: ${stepName}`)
}

/**
 * Registra uma requisição feita
 */
export function trackRequest(
  type: string,
  isCacheHit: boolean = false,
  isRetry: boolean = false
): void {
  if (!currentTracker) return
  
  currentTracker.requestStats.total++
  currentTracker.requestStats.byType[type] = 
    (currentTracker.requestStats.byType[type] || 0) + 1
  
  if (isCacheHit) {
    currentTracker.requestStats.cacheHits++
  } else {
    currentTracker.requestStats.cacheMisses++
  }
  
  if (isRetry) {
    currentTracker.requestStats.retries++
  }
}

/**
 * Registra um erro
 */
export function trackError(step: string, error: string | Error): void {
  if (!currentTracker) return
  
  currentTracker.requestStats.errors++
  currentTracker.errors.push({
    step,
    error: error instanceof Error ? error.message : error,
    timestamp: Date.now(),
  })
  
  const elapsed = getElapsedTime()
  logError(`❌ [${step}] Erro após ${elapsed}: ${error instanceof Error ? error.message : error}`)
}

/**
 * Obtém o tracker atual
 */
export function getTracker(): ProcessTracker | null {
  return currentTracker
}

/**
 * Obtém tempo decorrido desde o início do processo
 */
export function getElapsedTime(): string {
  if (!currentTracker) return '0.00s'
  const elapsed = Date.now() - currentTracker.timeStats.startTime
  return `${(elapsed / 1000).toFixed(2)}s`
}

/**
 * Obtém tempo decorrido da etapa atual
 */
export function getStepElapsedTime(): string {
  if (!currentTracker) return '0.00s'
  const elapsed = Date.now() - currentTracker.stepStartTime
  return `${(elapsed / 1000).toFixed(2)}s`
}

/**
 * Formata tempo em formato legível
 */
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Log de etapa com timestamp relativo
 */
function logStep(message: string): void {
  const elapsed = currentTracker ? getElapsedTime() : '0.00s'
  console.log(`[+${elapsed}] ${message}`)
}

/**
 * Log de erro
 */
function logError(message: string): void {
  const elapsed = currentTracker ? getElapsedTime() : '0.00s'
  console.error(`[+${elapsed}] ${message}`)
}

/**
 * Log de resumo final
 */
function logSummary(tracker: ProcessTracker): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 RESUMO DO PROCESSO')
  console.log('='.repeat(80))
  
  // Tempo total
  console.log(`\n⏱️  TEMPO TOTAL: ${formatTime(tracker.timeStats.total)}`)
  
  // Tempo por etapa
  if (Object.keys(tracker.timeStats.byStep).length > 0) {
    console.log('\n📋 Tempo por Etapa:')
    const sortedSteps = Object.entries(tracker.timeStats.byStep)
      .sort(([, a], [, b]) => b - a)
    
    for (const [step, time] of sortedSteps) {
      const percentage = ((time / tracker.timeStats.total) * 100).toFixed(1)
      console.log(`   • ${step}: ${formatTime(time)} (${percentage}%)`)
    }
  }
  
  // Requisições
  console.log(`\n🌐 REQUISIÇÕES TOTAL: ${tracker.requestStats.total}`)
  
  if (tracker.requestStats.cacheHits > 0 || tracker.requestStats.cacheMisses > 0) {
    const cacheHitRate = tracker.requestStats.cacheHits + tracker.requestStats.cacheMisses > 0
      ? ((tracker.requestStats.cacheHits / (tracker.requestStats.cacheHits + tracker.requestStats.cacheMisses)) * 100).toFixed(1)
      : '0.0'
    console.log(`   • Cache Hits: ${tracker.requestStats.cacheHits} (${cacheHitRate}%)`)
    console.log(`   • Cache Misses: ${tracker.requestStats.cacheMisses}`)
  }
  
  if (tracker.requestStats.retries > 0) {
    console.log(`   • Retries: ${tracker.requestStats.retries}`)
  }
  
  // Requisições por tipo
  if (Object.keys(tracker.requestStats.byType).length > 0) {
    console.log('\n📦 Requisições por Tipo:')
    const sortedTypes = Object.entries(tracker.requestStats.byType)
      .sort(([, a], [, b]) => b - a)
    
    for (const [type, count] of sortedTypes) {
      console.log(`   • ${type}: ${count}`)
    }
  }
  
  // Erros
  if (tracker.errors.length > 0) {
    console.log(`\n❌ ERROS: ${tracker.errors.length}`)
    for (const error of tracker.errors) {
      const errorElapsed = formatTime(error.timestamp - tracker.timeStats.startTime)
      console.log(`   • [${error.step}] (+${errorElapsed}): ${error.error}`)
    }
  } else {
    console.log(`\n✅ NENHUM ERRO`)
  }
  
  console.log('='.repeat(80) + '\n')
}

/**
 * Log formatado com timestamp relativo
 */
export function log(message: string, emoji: string = 'ℹ️'): void {
  const elapsed = getElapsedTime()
  console.log(`[+${elapsed}] ${emoji} ${message}`)
}

/**
 * Log de progresso
 */
export function logProgress(current: number, total: number, item: string = 'item'): void {
  const percentage = ((current / total) * 100).toFixed(1)
  const elapsed = getElapsedTime()
  console.log(`[+${elapsed}] 📊 Progresso: ${current}/${total} ${item} (${percentage}%)`)
}

