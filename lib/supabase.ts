/**
 * Cliente Supabase para acesso ao banco de dados
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase não configurado. Variáveis de ambiente faltando.')
  console.warn(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`)
  console.warn(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}`)
} else {
  console.log('✅ Supabase configurado corretamente')
}

// Cliente com service_role key (acesso completo, apenas server-side)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Verificar se Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return supabase !== null
}

// Tipos para o banco de dados
export interface ProcessedMatch {
  match_id: string
  puuid: string
  queue_id?: number
  game_duration?: number
  game_creation?: number
  participant_data: {
    champion_name: string
    kills: number
    deaths: number
    assists: number
    win: boolean
    total_minions_killed: number
    neutral_minions_killed: number
    vision_score?: number
  }
  processed_at?: string
  created_at?: string
}

export interface MonthlyStats {
  puuid: string
  month: string // YYYY-MM
  riot_id?: string
  summoner_name?: string
  wins: number
  losses: number
  total_games: number
  win_rate?: number
  kda?: number
  avg_cs?: number
  avg_vision_score?: number
  avg_game_duration?: number
  lp_change: number
  current_rank?: {
    tier: string
    rank: string
    lp: number
  }
  top_champions?: Array<{
    name: string
    icon: string
    games: number
  }>
  updated_at?: string
  created_at?: string
}

export interface MatchHistoryCache {
  puuid: string
  start_time: number
  end_time: number
  match_ids: string[]
  cached_at?: string
}

