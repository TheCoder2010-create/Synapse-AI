'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  title: string;
  company?: string;
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

export default function TestimonialCard({ 
  quote, 
  author, 
  title, 
  company, 
  delay = 0 
}: TestimonialCardProps) {
  return (
    <motion.div 
      {...fadeInUp(delay)}
      className="testimonial-card group relative"
    >
      {/* Quote Icon */}
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors duration-300">
        <Quote className="h-5 w-5" />
      </div>

      {/* Quote Text */}
      <blockquote className="text-muted-foreground mb-6 leading-relaxed italic">
        "{quote}"
      </blockquote>

      {/* Author Info */}
      <div className="space-y-1">
        <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
          {author}
        </p>
        <p className="text-sm text-muted-foreground">
          {title}
          {company && (
            <>
              <br />
              <span className="text-xs">{company}</span>
            </>
          )}
        </p>
      </div>

      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent rounded-l-xl" />
    </motion.div>
  );
}