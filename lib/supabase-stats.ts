/**
 * Funções para gerenciar stats mensais no Supabase
 */

import { supabase, isSupabaseConfigured, MonthlyStats } from './supabase'
import { PlayerStats } from '@/types'

/**
 * Salva ou atualiza stats mensais de um jogador
 */
export async function saveMonthlyStats(
  puuid: string,
  month: string, // YYYY-MM
  stats: Omit<PlayerStats, 'position' | 'previousPosition'>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log(`⚠️ Supabase não configurado, não salvando stats para ${puuid} em ${month}`)
    return false
  }

  try {
    console.log(`💾 Tentando salvar stats no Supabase: ${stats.riotId} em ${month} (${stats.totalGames} games)`)
    
    const monthlyStats: MonthlyStats = {
      puuid,
      month,
      riot_id: stats.riotId,
      summoner_name: stats.summonerName,
      wins: stats.wins,
      losses: stats.losses,
      total_games: stats.totalGames,
      win_rate: stats.winRate,
      kda: stats.kda,
      avg_cs: stats.avgCS,
      avg_vision_score: stats.avgVisionScore,
      avg_game_duration: stats.avgGameDuration,
      lp_change: stats.lpChange,
      current_rank: stats.currentRank,
      top_champions: stats.topChampions,
    }

    const { data, error } = await supabase
      .from('monthly_stats')
      .upsert(monthlyStats, {
        onConflict: 'puuid,month',
      })

    if (error) {
      console.error(`❌ Erro ao salvar stats mensais para ${puuid} em ${month}:`, error)
      console.error(`   Detalhes do erro:`, JSON.stringify(error, null, 2))
      return false
    }

    console.log(`✅ Stats salvas com sucesso no Supabase para ${stats.riotId} em ${month}`)
    return true
  } catch (error: any) {
    console.error(`❌ Erro ao processar stats:`, error)
    console.error(`   Stack:`, error.stack)
    return false
  }
}

/**
 * Busca stats mensais de um jogador
 */
export async function getMonthlyStats(
  puuid: string,
  month: string
): Promise<MonthlyStats | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.log(`⚠️ Supabase não configurado, não buscando stats para ${puuid} em ${month}`)
    return null
  }

  try {
    const { data, error } = await supabase
      .from('monthly_stats')
      .select('*')
      .eq('puuid', puuid)
      .eq('month', month)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrado - retorna null (normal)
        console.log(`ℹ️  Nenhuma stat encontrada no Supabase para ${puuid} em ${month}`)
        return null
      }
      console.error(`❌ Erro ao buscar stats para ${puuid} em ${month}:`, error)
      console.error(`   Código do erro: ${error.code}`)
      console.error(`   Mensagem: ${error.message}`)
      return null
    }

    if (data) {
      console.log(`✅ Stats encontradas no Supabase para ${puuid} em ${month}: ${data.total_games} games`)
    }

    return data
  } catch (error: any) {
    console.error(`❌ Erro ao buscar stats:`, error)
    console.error(`   Stack:`, error.stack)
    return null
  }
}

/**
 * Busca todas as stats de um mês (para ranking)
 */
export async function getMonthlyStatsForMonth(
  month: string
): Promise<MonthlyStats[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('monthly_stats')
      .select('*')
      .eq('month', month)
      .order('win_rate', { ascending: false })
      .order('wins', { ascending: false })

    if (error) {
      console.error(`❌ Erro ao buscar stats do mês ${month}:`, error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(`❌ Erro ao buscar stats:`, error)
    return []
  }
}

/**
 * Busca histórico de stats de um jogador
 */
export async function getPlayerStatsHistory(
  puuid: string,
  limit: number = 12
): Promise<MonthlyStats[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('monthly_stats')
      .select('*')
      .eq('puuid', puuid)
      .order('month', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`❌ Erro ao buscar histórico para ${puuid}:`, error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(`❌ Erro ao buscar histórico:`, error)
    return []
  }
}

