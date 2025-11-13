/**
 * Script de teste para verificar conexão com Supabase
 * Execute com: npx tsx scripts/test-supabase.ts
 */

import { isSupabaseConfigured, supabase } from '../lib/supabase'

async function testSupabase() {
  console.log('🧪 Testando conexão com Supabase...\n')
  
  // 1. Verificar configuração
  console.log('1. Verificando configuração...')
  const configured = isSupabaseConfigured()
  console.log(`   Supabase configurado: ${configured ? '✅' : '❌'}\n`)
  
  if (!configured) {
    console.log('❌ Supabase não está configurado!')
    console.log('   Verifique as variáveis de ambiente:')
    console.log('   - NEXT_PUBLIC_SUPABASE_URL')
    console.log('   - SUPABASE_SERVICE_ROLE_KEY')
    return
  }
  
  // 2. Testar conexão
  console.log('2. Testando conexão...')
  try {
    const { data, error } = await supabase!.from('monthly_stats').select('count').limit(1)
    
    if (error) {
      console.log(`   ❌ Erro: ${error.message}`)
      console.log(`   Código: ${error.code}`)
      console.log(`   Detalhes: ${JSON.stringify(error, null, 2)}`)
    } else {
      console.log('   ✅ Conexão OK!')
    }
  } catch (error: any) {
    console.log(`   ❌ Erro ao conectar: ${error.message}`)
  }
  
  console.log('\n3. Verificando tabelas...')
  
  // 3. Verificar tabelas
  const tables = ['monthly_stats', 'processed_matches', 'match_history_cache']
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase!
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`   ❌ ${table}: Erro - ${error.message}`)
      } else {
        console.log(`   ✅ ${table}: ${count || 0} registros`)
      }
    } catch (error: any) {
      console.log(`   ❌ ${table}: ${error.message}`)
    }
  }
  
  console.log('\n✅ Teste concluído!')
}

testSupabase().catch(console.error)

