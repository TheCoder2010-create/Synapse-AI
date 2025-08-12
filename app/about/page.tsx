
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Rocket, Zap } from 'lucide-react';
import { motion } from 'framer-motion';


export default function AboutPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

       <header className="sticky top-0 left-0 right-0 z-30 p-4 bg-background/50 backdrop-blur-lg border-b">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    <BrainCircuit className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold text-foreground">Synapse AI</span>
                </Link>
                <div className="flex items-center gap-2 md:gap-4">
                    <Button asChild variant="ghost">
                        <Link href="/product">Product</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/medical-labeler">Services</Link>
                    </Button>
                     <Button asChild variant="ghost">
                        <Link href="/about">About</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/faq">FAQs</Link>
                    </Button>
                    <Button asChild className="glow-button">
                        <Link href="/app">Launch App</Link>
                    </Button>
                </div>
            </div>
        </header>

      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 z-10 py-16">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="max-w-4xl w-full bg-card/50 backdrop-blur-lg border rounded-2xl p-8 md:p-12 space-y-8"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-center">
                About Synapse AI
            </h1>

            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                    Synapse AI was born from a singular focus: to solve the most significant bottleneck in modern medical AI—the data problem. We saw brilliant researchers and startups struggling to acquire the high-quality, structured, AI-ready data needed for transformative breakthroughs.
                </p>
                <p>
                    Our mission is to provide the data engine for the entire biotech industry. We are building the foundational platform that ingests, enriches, and structures complex medical data, turning it into a reliable, high-value asset for building and training next-generation AI models.
                </p>
            </div>

            <div className="border-t pt-8 space-y-6">
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3 justify-center">
                    <Zap className="h-8 w-8 text-primary" />
                    Our Vision
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed text-center">
                   Synapse AI is a conceptual application by Alonix.io to demonstrate our vision for a data-centric AI platform. We believe that by providing the best data and tools, we can empower a new wave of innovation across healthcare. We are building the platform we wish we had: powerful, accessible, and dedicated to accelerating progress.
                </p>
            </div>

            <div className="text-center pt-6">
                <Button asChild size="lg" className="glow-button">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </motion.div>
      </main>

      <footer className="w-full text-center text-xs text-muted-foreground z-10 py-6 border-t">
          <p>Powered by Alonix.io</p>
        </footer>
    </div>
  );
}
