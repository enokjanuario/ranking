/**
 * Script de SEED para popular banco de dados com histórico completo de partidas
 *
 * ATENÇÃO: Este script faz MUITAS chamadas à API da Riot!
 * Deve ser executado APENAS UMA VEZ para popular o banco inicial.
 *
 * Uso:
 *   npm run seed-matches
 *
 * O que faz:
 * 1. Limpa banco de dados (opcional - comentar se não quiser)
 * 2. Para cada jogador, busca TODAS as partidas ranqueadas dos últimos 90 dias
 * 3. Salva no banco de dados Supabase
 * 4. Após seed, sistema usa apenas últimas 10 partidas incrementalmente
 */

import { TRACKED_PLAYERS } from '../lib/constants'
import { getAccountByRiotId, getMatchHistory, getMatchDetails } from '../lib/riotApi'
import {
  dropAllMatches,
  countMatches,
  saveProcessedMatchesBatch
} from '../lib/supabase-matches'

// Delay entre requisições (75ms = ~13 req/s)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function seedMatches() {
  console.log('🌱 Iniciando SEED de partidas...\n')

  // ETAPA 1: Limpar banco (comentar se não quiser)
  console.log('📊 Verificando banco de dados...')
  const currentCount = await countMatches()
  console.log(`   Partidas atuais no banco: ${currentCount}`)

  if (currentCount > 0) {
    console.log('\n⚠️  ATENÇÃO: Banco contém partidas existentes!')
    console.log('   Para limpar o banco, descomente a linha "await dropAllMatches()" no código')
    // await dropAllMatches() // DESCOMENTAR PARA LIMPAR BANCO
  }

  // ETAPA 2: Buscar partidas de cada jogador
  console.log('\n🔍 Buscando partidas dos jogadores...\n')

  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000) // 90 dias
  let totalMatches = 0
  let totalNewMatches = 0

  for (let i = 0; i < TRACKED_PLAYERS.length; i++) {
    const riotId = TRACKED_PLAYERS[i]
    console.log(`\n[${ i + 1}/${TRACKED_PLAYERS.length}] Processando: ${riotId}`)
    console.log('━'.repeat(60))

    try {
      // 1. Buscar account
      console.log('   🔎 Buscando account...')
      const account = await getAccountByRiotId(riotId)

      if (!account) {
        console.log('   ❌ Account não encontrado')
        continue
      }

      const puuid = account.puuid
      console.log(`   ✅ PUUID: ${puuid.substring(0, 20)}...`)

      // 2. Buscar match history (últimos 90 dias, max 200 partidas)
      console.log('   📋 Buscando histórico de partidas (últimos 90 dias)...')
      await delay(75)
      const matchIds = await getMatchHistory(puuid, ninetyDaysAgo, undefined, 200)

      console.log(`   📊 ${matchIds.length} partidas encontradas`)
      totalMatches += matchIds.length

      if (matchIds.length === 0) {
        console.log('   ⚠️  Nenhuma partida encontrada')
        continue
      }

      // 3. Buscar detalhes das partidas em batches
      console.log('   🔄 Buscando detalhes das partidas...')
      const matchesToSave: Array<{
        matchId: string
        puuid: string
        matchDetails: any
      }> = []

      let processed = 0
      const batchSize = 6 // 6 partidas por batch

      for (let j = 0; j < matchIds.length; j += batchSize) {
        const batch = matchIds.slice(j, j + batchSize)

        // Buscar detalhes em paralelo (batch)
        const detailsPromises = batch.map(async (matchId) => {
          await delay(75)
          return {
            matchId,
            details: await getMatchDetails(matchId)
          }
        })

        const batchResults = await Promise.all(detailsPromises)

        // Filtrar e adicionar à lista
        for (const { matchId, details } of batchResults) {
          if (details) {
            // Filtrar apenas ranqueadas
            const queueId = details.info.queueId
            if (queueId === 420 || queueId === 440) {
              matchesToSave.push({
                matchId,
                puuid,
                matchDetails: details
              })
            }
          }
          processed++
        }

        // Progress
        const progress = Math.round((processed / matchIds.length) * 100)
        process.stdout.write(`\r   📦 Progresso: ${processed}/${matchIds.length} (${progress}%)`)

        // Delay entre batches
        if (j + batchSize < matchIds.length) {
          await delay(250)
        }
      }

      console.log() // Nova linha após progress

      // 4. Salvar no banco em batch
      if (matchesToSave.length > 0) {
        console.log(`   💾 Salvando ${matchesToSave.length} partidas ranqueadas no banco...`)
        const saved = await saveProcessedMatchesBatch(matchesToSave)
        totalNewMatches += saved
        console.log(`   ✅ ${saved} partidas salvas com sucesso`)
      } else {
        console.log('   ⚠️  Nenhuma partida ranqueada para salvar')
      }

    } catch (error: any) {
      console.error(`   ❌ Erro ao processar ${riotId}:`, error.message)
      continue
    }

    // Delay entre jogadores
    if (i < TRACKED_PLAYERS.length - 1) {
      console.log('\n   ⏳ Aguardando antes do próximo jogador...')
      await delay(2000) // 2 segundos entre jogadores
    }
  }

  // ETAPA 3: Resumo final
  console.log('\n\n' + '═'.repeat(60))
  console.log('✅ SEED CONCLUÍDO!')
  console.log('═'.repeat(60))
  console.log(`📊 Total de partidas encontradas: ${totalMatches}`)
  console.log(`💾 Total de partidas salvas: ${totalNewMatches}`)

  const finalCount = await countMatches()
  console.log(`🗄️  Partidas no banco: ${finalCount}`)
  console.log('\n💡 Agora o sistema usará apenas as últimas 10 partidas incrementalmente!')
  console.log('   Configure o cron job para rodar a cada 15 minutos.')
}

// Executar seed
seedMatches()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })
