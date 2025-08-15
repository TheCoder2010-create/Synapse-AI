'use client';

import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  animationDelay?: number;
}

function AnimatedCounter({ value, delay = 0 }: { value: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  
  // Extract numeric value if it exists
  const numericValue = parseInt(value.replace(/\D/g, ''));
  const suffix = value.replace(/\d/g, '');
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView && !isNaN(numericValue)) {
      const timer = setTimeout(() => {
        motionValue.set(numericValue);
      }, delay * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, numericValue, motionValue, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest) + suffix;
      }
    });

    return unsubscribe;
  }, [springValue, suffix]);

  return (
    <div ref={ref} className="text-5xl font-bold text-primary">
      {isNaN(numericValue) ? value : '0' + suffix}
    </div>
  );
}

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { 
    delay, 
    duration: 0.8, 
    ease: [0.25, 0.46, 0.45, 0.94] 
  },
  viewport: { once: true, amount: 0.3 }
});

export default function MetricCard({ value, label, animationDelay = 0 }: MetricCardProps) {
  return (
    <motion.div 
      {...fadeInUp(animationDelay)}
      className="metric-card group hover:scale-105 transition-all duration-300"
    >
      <AnimatedCounter value={value} delay={animationDelay} />
      <p className="text-muted-foreground mt-3 leading-relaxed">
        {label}
      </p>
      
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}