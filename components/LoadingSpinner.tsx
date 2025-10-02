'use client'

import { motion } from 'framer-motion'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <motion.div
        className="relative w-24 h-24"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-neon-purple/30"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-neon-purple border-r-neon-blue"></div>
      </motion.div>
      
      <motion.div
        className="mt-8 text-xl font-semibold text-gray-300"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Carregando dados do ranking...
      </motion.div>

      <motion.div
        className="mt-4 text-sm text-gray-500"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Buscando estatísticas da Riot Games API
      </motion.div>

      {/* Animated dots */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-neon-blue"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </div>
  )
}

