'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer className="mt-20 pb-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative glass-light rounded-3xl p-8 overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300"
      >
        {/* Subtle top accent line with gradient */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <span className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse block"></span>
              <span className="absolute inset-0 w-2.5 h-2.5 bg-secondary rounded-full animate-ping opacity-50 block"></span>
            </div>
            <span className="text-neutral/50 text-sm font-medium group-hover:text-neutral/70 transition-colors">
              Auto-refresh a cada 15 minutos
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral/40 font-medium hover:text-neutral/60 transition-colors cursor-default">
              Powered by Riot API
            </span>
            <span className="text-neutral/20">•</span>
            <span className="text-neutral/60 font-bold hover:text-gradient-primary transition-all cursor-default">
              Academia Y
            </span>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}

