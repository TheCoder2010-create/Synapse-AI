
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, ArrowRight, Sparkles, Workflow, ShieldCheck, Zap, Target } from 'lucide-react';
import Aurora from '@/components/ui/Aurora';
import Orb from '@/components/ui/Orb';
import { motion } from 'framer-motion';
import BlurText from '@/components/ui/BlurText';
import { TooltipProvider } from '@/components/ui/tooltip';

const fadeIn = (delay: number, duration: number = 0.6) => ({
    initial: { opacity: 0, y: 20 },
    animate: "visible",
    viewport: { once: true },
    variants: {
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { delay, duration, ease: "easeOut" } 
        }
    }
});


export default function LandingPage() {
    return (
        <TooltipProvider>
            <div className="relative flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
                <Aurora
                    colorStops={["#111", "#333", "#111"]}
                    blend={0.5}
                    amplitude={0.2}
                    speed={0.05}
                />

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
                            <Button asChild>
                                <Link href="/app">Launch App</Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center text-center container mx-auto px-4 z-10 py-24">
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[50vw] h-[50vh] max-w-[500px] max-h-[500px]">
                            <Orb hue={210} forceHoverState={true} rotateOnHover={false} hoverIntensity={0.1}/>
                        </div>
                    </div>

                    <div 
                        className="relative z-10 space-y-4"
                    >
                        <BlurText
                            text="Synapse AI"
                            delay={150}
                            animateBy="words"
                            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-foreground"
                        />
                        <motion.p {...fadeIn(0.3)} className="text-2xl md:text-3xl font-semibold text-primary tracking-tight">GenAI Powered Reporting</motion.p>
                        <motion.p {...fadeIn(0.4)} className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground pt-2">
                            We're not replacing radiologists—we're revolutionizing their workflow. Transform complex findings into clear, structured reports in seconds.
                        </motion.p>
                        <motion.div {...fadeIn(0.5)}>
                            <Button asChild size="lg" className="mt-6 glow-button">
                                <Link href="/app">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                        </motion.div>
                    </div>
                </main>

                <div className="container mx-auto px-4 z-10 pb-24 space-y-24">
                    {/* Problem/Solution Section */}
                    <section className="max-w-4xl mx-auto text-center">
                        <motion.h2 {...fadeIn(0.2)} className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">The Challenge: The Reporting Bottleneck</motion.h2>
                        <motion.p {...fadeIn(0.3)} className="mt-4 text-lg text-muted-foreground">
                            Radiologists are under immense pressure to interpret a growing number of complex scans. The final step—crafting a detailed, accurate, and consistent report—is often the most time-consuming part of the workflow, leading to delays and burnout.
                        </motion.p>
                        <motion.p {...fadeIn(0.4)} className="mt-8 text-lg font-semibold text-primary">
                            Synapse AI tackles this bottleneck head-on, providing an intelligent co-pilot that automates the generation of high-quality report drafts, freeing experts to focus on diagnosis.
                        </motion.p>
                    </section>
                    
                    {/* How it Works Section */}
                    <section className="text-center">
                        <motion.h2 {...fadeIn(0.2)} className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">From Image to Insightful Report</motion.h2>
                        <motion.p {...fadeIn(0.3)} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Synapse AI transforms your diagnostic workflow into a streamlined, three-step process.
                        </motion.p>
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <motion.div {...fadeIn(0.4)} className="flex flex-col items-center text-center gap-4 p-6 border rounded-lg bg-card/50">
                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary"><span className="font-bold text-xl">1</span></div>
                                <h3 className="text-xl font-semibold">Upload & Analyze</h3>
                                <p className="text-muted-foreground">Securely upload any scan. Synapse AI performs an initial analysis, identifies key findings, and cross-references them with clinical knowledge bases.</p>
                            </motion.div>
                            <motion.div {...fadeIn(0.5)} className="flex flex-col items-center text-center gap-4 p-6 border rounded-lg bg-card/50">
                                 <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary"><span className="font-bold text-xl">2</span></div>
                                <h3 className="text-xl font-semibold">Generate Draft Report</h3>
                                <p className="text-muted-foreground">With one click, generate a comprehensive, structured report draft. The AI synthesizes all findings, measurements, and tool-based research into a formal document.</p>
                            </motion.div>
                            <motion.div {...fadeIn(0.6)} className="flex flex-col items-center text-center gap-4 p-6 border rounded-lg bg-card/50">
                                 <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary"><span className="font-bold text-xl">3</span></div>
                                <h3 className="text-xl font-semibold">Review & Finalize</h3>
                                <p className="text-muted-foreground">The AI-generated report is ready for your expert review. Edit, approve, and finalize the document with confidence, knowing the groundwork is already done.</p>
                            </motion.div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="max-w-5xl mx-auto">
                         <div className="text-center mb-12">
                            <motion.h2 {...fadeIn(0.2)} className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Features Built for Reporting Efficiency</motion.h2>
                            <motion.p {...fadeIn(0.3)} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                                Powerful tools designed to enhance reporting speed, consistency, and quality.
                            </motion.p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <motion.div {...fadeIn(0.4)} className="p-6 border rounded-lg bg-card/50">
                                <Sparkles className="h-8 w-8 mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">AI-Generated Drafts</h3>
                                <p className="mt-2 text-muted-foreground">Instantly create comprehensive report drafts from scan analysis and your notes.</p>
                            </motion.div>
                            <motion.div {...fadeIn(0.5)} className="p-6 border rounded-lg bg-card/50">
                                <Workflow className="h-8 w-8 mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">Custom Templates</h3>
                                <p className="mt-2 text-muted-foreground">Ensure consistency by using your own institutional templates for all generated reports.</p>
                            </motion.div>
                            <motion.div {...fadeIn(0.6)} className="p-6 border rounded-lg bg-card/50">
                                <ShieldCheck className="h-8 w-8 mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">Transparent Reasoning</h3>
                                <p className="mt-2 text-muted-foreground">See exactly how the AI arrived at its suggestions with a clear, step-by-step reasoning log.</p>
                            </motion.div>
                             <motion.div {...fadeIn(0.4)} className="p-6 border rounded-lg bg-card/50">
                                <Zap className="h-8 w-8 mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">Early Diagnosis Prediction</h3>
                                <p className="mt-2 text-muted-foreground">Our model is trained to detect subtle abnormalities, aiding in earlier diagnosis and intervention.</p>
                            </motion.div>
                             <motion.div {...fadeIn(0.5)} className="p-6 border rounded-lg bg-card/50">
                                <BrainCircuit className="h-8 w-8 mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">Best-in-Class AI Model</h3>
                                <p className="mt-2 text-muted-foreground">Leverage a state-of-the-art AI with up to 90% accuracy in identifying key findings.</p>
                            </motion.div>
                             <motion.div {...fadeIn(0.6)} className="p-6 border rounded-lg bg-card/50">
                                <Target className="h-8 w-8 mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">High Accuracy Support</h3>
                                <p className="mt-2 text-muted-foreground">Get AI-powered support that is consistent, reliable, and grounded in clinical knowledge bases.</p>
                            </motion.div>
                        </div>
                    </section>

                     {/* CTA Section */}
                    <section className="text-center">
                        <motion.h2 {...fadeIn(0.2)} className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to Revolutionize Your Reporting?</motion.h2>
                        <motion.p {...fadeIn(0.3)} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                           Experience the future of diagnostic reporting. Launch the Synapse AI platform and see how our intelligent co-pilot can transform your workflow.
                        </motion.p>
                        <motion.div {...fadeIn(0.4)}>
                             <Button asChild size="lg" className="mt-8 glow-button">
                                <Link href="/app">Launch Synapse AI <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                        </motion.div>
                    </section>
                </div>


                <footer className="w-full text-center text-xs text-muted-foreground z-10 py-6 border-t">
                     <p>Powered by Alonix.io</p>
                </footer>
            </div>
        </TooltipProvider>
    );
}
