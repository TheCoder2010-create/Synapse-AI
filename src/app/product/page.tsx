
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Cpu, Layers, UploadCloud, Brush } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = (delay: number, duration: number = 0.5) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { delay, duration, ease: "easeOut" }
});

export default function ProductPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

       <header className="sticky top-0 left-0 right-0 z-30 p-4 bg-background/50 backdrop-blur-lg border-b">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    <BrainCircuit className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold text-foreground">Synapse AI</span>
                </Link>
                <div className="flex items-center gap-2 md:gap-4">
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
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                    Our Platform Services
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Synapse AI provides the critical infrastructure to accelerate medical AI development, from high-quality data to MLOps.
                </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 pt-8 border-t">
                <motion.div {...fadeIn(0.2)} className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><Brush className="w-6 h-6 text-primary"/> Data Labeling with AI</h3>
                    <p className="text-muted-foreground">
                        Leverage our powerful AI models to get a first-pass annotation on your datasets. Our expert-in-the-loop workbench allows your specialists to then review and refine these labels with high efficiency, turning raw data into a valuable, AI-ready asset.
                    </p>
                </motion.div>
                 <motion.div {...fadeIn(0.3)} className="space-y-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2"><Layers className="w-6 h-6 text-primary"/> MLOps Workbench</h3>
                    <p className="text-muted-foreground">
                       Stop wrestling with complex cloud environments. Securely upload your datasets and use our pre-configured MLOps platform to train, test, and deploy your own proprietary models using the frameworks you already know.
                    </p>
                </motion.div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-foreground font-semibold">
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-card/80"><Cpu className="h-5 w-5 text-primary"/> PyTorch</div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-card/80"><Cpu className="h-5 w-5 text-primary"/> Keras</div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-card/80"><Cpu className="h-5 w-5 text-primary"/> TensorFlow</div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-card/80"><Cpu className="h-5 w-5 text-primary"/> Scikit-learn</div>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-card/80"><Cpu className="h-5 w-5 text-primary"/> MONAI</div>
            </div>

            <div className="text-center pt-8 border-t">
                 <h3 className="text-2xl font-bold">Ready to Accelerate Your Research?</h3>
                 <p className="text-muted-foreground mt-2">Contact us to learn more about our data labeling services and MLOps platform.</p>
                 <Button asChild size="lg" className="mt-6 glow-button">
                    <Link href="mailto:sales@synapse-ai.com">
                        Contact Sales
                    </Link>
                </Button>
            </div>

            <div className="text-center pt-6">
                <Button asChild size="lg" variant="ghost">
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
