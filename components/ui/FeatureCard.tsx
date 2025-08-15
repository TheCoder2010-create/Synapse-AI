'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const fadeInUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30, scale: 0.95 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  transition: { 
    delay, 
    duration: 0.6, 
    ease: [0.25, 0.46, 0.45, 0.94] 
  },
  viewport: { once: true, amount: 0.3 }
});

export default function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div 
      {...fadeInUp(delay)}
      className="feature-card group cursor-pointer"
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
    >
      {/* Icon Container */}
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary mb-6 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
        <Icon className="h-7 w-7" />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}