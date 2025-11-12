'use client'

import { motion } from 'framer-motion'

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] py-20">
      {/* Modern spinner with glassmorphism */}
      <div className="relative">
        {/* Outer rotating ring */}
        <motion.div
          className="relative w-32 h-32"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 shadow-lg shadow-primary/20"></div>
        </motion.div>
        
        {/* Inner counter-rotating ring */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-20 h-20 rounded-full border-4 border-transparent border-b-secondary border-l-secondary/50 shadow-lg shadow-secondary/20"></div>
        </motion.div>

        {/* Center pulse */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg"></div>
        </motion.div>
      </div>
      
      <motion.div
        className="mt-12 text-2xl font-bold text-neutral tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Carregando Ranking
      </motion.div>

      <motion.div
        className="mt-3 text-sm text-neutral/50 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      >
        Apertem os cintos, os dados estão chegando!
      </motion.div>

      {/* Elegant animated progress dots */}
      <div className="flex items-center gap-2 mt-8">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  )
}

