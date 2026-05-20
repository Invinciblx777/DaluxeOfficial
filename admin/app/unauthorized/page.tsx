"use client";

import { ShieldX, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#0B0B0B' }}
    >
      {/* Background gradient accents */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '-20%',
          right: '-15%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: '-20%',
          left: '-15%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 65%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] px-6 z-10"
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '1.5rem',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
            padding: '2.5rem 2rem 2rem',
          }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mb-6"
            >
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #F87171)',
                  filter: 'blur(16px)',
                  opacity: 0.35,
                  transform: 'scale(1.3)',
                }}
              />
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}
              >
                <ShieldX size={30} color="#fff" strokeWidth={2.5} />
              </div>
            </motion.div>

            <h1
              className="text-[22px] font-black tracking-[0.15em] mb-2"
              style={{ color: '#FAFAFA' }}
            >
              ACCESS DENIED
            </h1>
            <p
              className="text-sm font-medium leading-relaxed mb-6"
              style={{ color: '#71717A' }}
            >
              You don&apos;t have permission to access the admin panel. 
              Only authorized administrators can view this area.
            </p>

            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold tracking-[0.1em] uppercase transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#A1A1AA',
              }}
            >
              <ArrowLeft size={16} />
              Back to Site
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#1C1C1E' }}>
            Daluxe Luxury Skincare © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
