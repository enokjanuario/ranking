'use client'

export default function Footer() {
  return (
    <footer className="mt-12 pb-8">
      <div className="bg-dark-card border border-gray-700/50 rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Dados atualizados automaticamente a cada 5 minutos</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Riot API</span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-400">League of Legends YoJornada</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

