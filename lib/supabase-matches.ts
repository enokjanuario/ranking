/**
 * Funções para gerenciar matches processados no Supabase
 */

import { supabase, isSupabaseConfigured, ProcessedMatch } from './supabase'
import { RiotMatchDetails, RiotParticipant } from '@/types'

/**
 * Salva um match processado no banco de dados
 */
export async function saveProcessedMatch(
  matchId: string,
  puuid: string,
  matchDetails: RiotMatchDetails
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false
  }

  try {
    // Encontrar participante específico
    const participant = matchDetails.info.participants.find(p => p.puuid === puuid)
    if (!participant) {
      return false
    }

    // Extrair apenas dados necessários
    const participantData = {
      champion_name: participant.championName,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      win: participant.win,
      total_minions_killed: participant.totalMinionsKilled || 0,
      neutral_minions_killed: participant.neutralMinionsKilled || 0,
      vision_score: participant.visionScore,
    }

    const processedMatch: ProcessedMatch = {
      match_id: matchId,
      puuid,
      queue_id: matchDetails.info.queueId,
      game_duration: matchDetails.info.gameDuration,
      game_creation: matchDetails.info.gameCreation,
      participant_data: participantData,
    }

    // Usar upsert para evitar duplicatas
    const { error } = await supabase
      .from('processed_matches')
      .upsert(processedMatch, {
        onConflict: 'match_id',
      })

    if (error) {
      console.error(`❌ Erro ao salvar match ${matchId}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`❌ Erro ao processar match ${matchId}:`, error)
    return false
  }
}

/**
 * Busca matches processados de um jogador em um período
 */
export async function getProcessedMatches(
  puuid: string,
  startTime?: number,
  endTime?: number
): Promise<ProcessedMatch[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    let query = supabase
      .from('processed_matches')
      .select('*')
      .eq('puuid', puuid)

    if (startTime) {
      query = query.gte('game_creation', startTime)
    }

    if (endTime) {
      query = query.lte('game_creation', endTime)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order('game_creation', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error(`❌ Erro ao buscar matches para ${puuid}:`, error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(`❌ Erro ao buscar matches:`, error)
    return []
  }
}

/**
 * Verifica se um match já foi processado
 */
export async function isMatchProcessed(matchId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('processed_matches')
      .select('match_id')
      .eq('match_id', matchId)
      .limit(1)

    if (error) {
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    return false
  }
}

/**
 * Salva múltiplos matches em batch (mais eficiente)
 */
export async function saveProcessedMatchesBatch(
  matches: Array<{
    matchId: string
    puuid: string
    matchDetails: RiotMatchDetails
  }>
): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0
  }

  const processedMatches: ProcessedMatch[] = []

  for (const { matchId, puuid, matchDetails } of matches) {
    const participant = matchDetails.info.participants.find(p => p.puuid === puuid)
    if (!participant) continue

    const participantData = {
      champion_name: participant.championName,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      win: participant.win,
      total_minions_killed: participant.totalMinionsKilled || 0,
      neutral_minions_killed: participant.neutralMinionsKilled || 0,
      vision_score: participant.visionScore,
    }

    processedMatches.push({
      match_id: matchId,
      puuid,
      queue_id: matchDetails.info.queueId,
      game_duration: matchDetails.info.gameDuration,
      game_creation: matchDetails.info.gameCreation,
      participant_data: participantData,
    })
  }

  if (processedMatches.length === 0) {
    return 0
  }

  try {
    const { error } = await supabase
      .from('processed_matches')
      .upsert(processedMatches, {
        onConflict: 'match_id',
      })

    if (error) {
      console.error(`❌ Erro ao salvar batch de matches:`, error)
      return 0
    }

    return processedMatches.length
  } catch (error) {
    console.error(`❌ Erro ao processar batch:`, error)
    return 0
  }
}

/**
 * Limpa matches antigos (mais de 1 ano)
 */
export async function cleanupOldMatches(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0
  }

  try {
    const { error } = await supabase.rpc('cleanup_old_matches')

    if (error) {
      console.error('❌ Erro ao limpar matches antigos:', error)
      return 0
    }

    // Buscar quantidade removida (aproximada)
    const { count } = await supabase
      .from('processed_matches')
      .select('*', { count: 'exact', head: true })

    return count || 0
  } catch (error) {
    console.error('❌ Erro ao limpar matches:', error)
    return 0
  }
}

/**
 * Remove TODAS as partidas do banco de dados
 * CUIDADO: Esta operação é irreversível!
 */
export async function dropAllMatches(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ Supabase não configurado')
    return false
  }

  try {
    console.log('🗑️ Removendo TODAS as partidas do banco...')

    // Deletar todas as partidas
    const { error } = await supabase
      .from('processed_matches')
      .delete()
      .neq('match_id', '') // Condição que sempre é verdadeira (deleta tudo)

    if (error) {
      console.error('❌ Erro ao dropar matches:', error)
      return false
    }

    console.log('✅ Todas as partidas foram removidas do banco')
    return true
  } catch (error) {
    console.error('❌ Erro ao dropar matches:', error)
    return false
  }
}

/**
 * Conta quantas partidas existem no banco
 */
export async function countMatches(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0
  }

  try {
    const { count, error } = await supabase
      .from('processed_matches')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Erro ao contar matches:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('❌ Erro ao contar matches:', error)
    return 0
  }
}

