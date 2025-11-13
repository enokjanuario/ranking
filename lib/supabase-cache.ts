/**
 * Funções para cache de match history no Supabase
 */

import { supabase, isSupabaseConfigured, MatchHistoryCache } from './supabase'

/**
 * Salva cache de match history
 */
export async function saveMatchHistoryCache(
  puuid: string,
  startTime: number,
  endTime: number,
  matchIds: string[]
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false
  }

  try {
    const cache: MatchHistoryCache = {
      puuid,
      start_time: startTime,
      end_time: endTime,
      match_ids: matchIds,
    }

    const { error } = await supabase
      .from('match_history_cache')
      .upsert(cache, {
        onConflict: 'puuid,start_time,end_time',
      })

    if (error) {
      console.error(`❌ Erro ao salvar cache de match history:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`❌ Erro ao processar cache:`, error)
    return false
  }
}

/**
 * Busca cache de match history
 */
export async function getMatchHistoryCache(
  puuid: string,
  startTime: number,
  endTime: number
): Promise<string[] | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('match_history_cache')
      .select('match_ids')
      .eq('puuid', puuid)
      .eq('start_time', startTime)
      .eq('end_time', endTime)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado
        return null
      }
      console.error(`❌ Erro ao buscar cache:`, error)
      return null
    }

    return data?.match_ids || null
  } catch (error) {
    console.error(`❌ Erro ao buscar cache:`, error)
    return null
  }
}

/**
 * Limpa cache antigo (mais de 30 dias)
 */
export async function cleanupOldMatchHistoryCache(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0
  }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error } = await supabase
      .from('match_history_cache')
      .delete()
      .lt('cached_at', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('❌ Erro ao limpar cache antigo:', error)
      return 0
    }

    return 1 // Sucesso
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error)
    return 0
  }
}

