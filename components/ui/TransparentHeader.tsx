'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Menu, X } from 'lucide-react';
import { useScrolled } from '@/lib/hooks/useScrolled';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationItem {
  label: string;
  href: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Product', href: '/product' },
  { label: 'Services', href: '/medical-labeler' },
  { label: 'About', href: '/about' },
  { label: 'FAQs', href: '/faq' },
];

export default function TransparentHeader() {
  const isScrolled = useScrolled(50);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
      isScrolled ? 'transparent-header scrolled' : 'transparent-header'
    }`}>
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 z-10">
          <BrainCircuit className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Synapse AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/app">Sign In</Link>
          </Button>
          <Button asChild className="glow-button">
            <Link href="/app">Launch App</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-10 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-white/10 md:hidden"
            >
              <div className="container mx-auto py-4 space-y-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/app" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="glow-button justify-start">
                    <Link href="/app" onClick={() => setIsMobileMenuOpen(false)}>
                      Launch App
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}