# 📝 Exemplos de Configuração de Jogadores

## Como Adicionar Jogadores

Edite o arquivo `lib/constants.ts` e substitua a lista `TRACKED_PLAYERS`.

## Formato Correto

```typescript
export const TRACKED_PLAYERS = [
  'NomeDoJogador#TAG',
]
```

## Exemplos de Jogadores Profissionais BR

```typescript
export const TRACKED_PLAYERS = [
  'Brtt#BR1',
  'Kami#BR1',
  'Robo#BR1',
  'Aegis#BR1',
  'Grevthar#BR1',
  'TitaN#BR1',
  'Damage#BR1',
  'Wizer#BR1',
  'Guigo#BR1',
  'Cariok#BR1',
  'Ranger#BR1',
  'RedBert#BR1',
  'Guri#BR1',
  'Envy#BR1',
  'Minerva#BR1',
]
```

## Exemplos de Jogadores Internacionais

### NA (North America)
```typescript
export const TRACKED_PLAYERS = [
  'Doublelift#NA1',
  'Sneaky#NA1',
  'Bjergsen#NA1',
  // ... adicione mais 12
]
```

### EUW (Europe West)
```typescript
export const TRACKED_PLAYERS = [
  'Rekkles#EUW',
  'Caps#EUW',
  'Jankos#EUW',
  // ... adicione mais 12
]
```

### KR (Korea)
```typescript
export const TRACKED_PLAYERS = [
  'Faker#KR1',
  'ShowMaker#KR1',
  'Chovy#KR1',
  // ... adicione mais 12
]
```

## Como Encontrar o Riot ID de um Jogador

### Método 1: No Cliente do LoL
1. Abra o League of Legends
2. Procure o jogador na aba Social
3. O nome completo aparece como: `NomeDoJogador #TAG`
4. Use no formato: `NomeDoJogador#TAG` (sem espaço antes do #)

### Método 2: No Op.gg
1. Acesse [op.gg](https://www.op.gg/)
2. Pesquise pelo jogador
3. No topo da página, você verá o Riot ID completo
4. Exemplo: "Brtt #BR1" → use `'Brtt#BR1'`

### Método 3: No U.gg
1. Acesse [u.gg](https://u.gg/)
2. Pesquise pelo jogador
3. O Riot ID aparece no perfil

## Dicas Importantes

### ✅ Correto
```typescript
'NomeJogador#BR1'
'Nome com Espaço#NA1'
'Player123#EUW'
```

### ❌ Incorreto
```typescript
'NomeJogador #BR1'  // Espaço antes do #
'NomeJogador'       // Faltando a TAG
'#BR1'              // Faltando o nome
'NomeJogador-BR1'   // Usando - em vez de #
```

## Configurando Regiões

No arquivo `.env.local`, ajuste a região:

### Brasil
```env
RIOT_REGION=br1
RIOT_ROUTING=americas
```

### North America
```env
RIOT_REGION=na1
RIOT_ROUTING=americas
```

### Europe West
```env
RIOT_REGION=euw1
RIOT_ROUTING=europe
```

### Korea
```env
RIOT_REGION=kr
RIOT_ROUTING=asia
```

## Testando a Configuração

1. Comece com 3-5 jogadores conhecidos
2. Execute `npm run dev`
3. Veja se os dados aparecem corretamente
4. Se funcionar, adicione os demais jogadores

## Exemplo Completo para Começar

Aqui está um exemplo funcional que você pode usar:

```typescript
// lib/constants.ts
export const TRACKED_PLAYERS = [
  'Brtt#BR1',
  'Kami#BR1',
  'Robo#BR1',
  'TitaN#BR1',
  'Ranger#BR1',
]
```

Teste com esses 5 jogadores primeiro, depois adicione os outros 10!

