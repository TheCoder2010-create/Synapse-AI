
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, ArrowRight, CheckCircle, Zap, ShieldCheck, Microscope, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import Aurora from '@/components/ui/Aurora';
import Orb from '@/components/ui/Orb';
import TransparentHeader from '@/components/ui/TransparentHeader';
import TransparentFooter from '@/components/ui/TransparentFooter';
import FeatureCard from '@/components/ui/FeatureCard';
import MetricCard from '@/components/ui/MetricCard';
import TestimonialCard from '@/components/ui/TestimonialCard';

const fadeIn = (delay = 0, duration = 0.5) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration, ease: "easeOut" },
  viewport: { once: true, amount: 0.3 }
});



const PricingCard = ({ title, price, features, isFeatured = false, ctaText }) => (
    <motion.div {...fadeIn(0.2)} className={`p-8 rounded-2xl border ${isFeatured ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}>
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <p className="text-4xl font-bold my-4">{price}</p>
        <ul className="space-y-3 text-muted-foreground mb-8">
            {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <Button asChild className={isFeatured ? 'w-full glow-button' : 'w-full'} variant={isFeatured ? 'default' : 'outline'}>
            <Link href="/app">{ctaText}</Link>
        </Button>
    </motion.div>
);



export default function LandingPage() {
    return (
        <div className="bg-background text-foreground relative overflow-x-hidden">
            <Aurora
                colorStops={["#111", "#333", "#111"]}
                blend={0.5}
                amplitude={0.2}
                speed={0.05}
            />
            {/* Header */}
            <TransparentHeader />

            <main>
                {/* Hero Section */}
                <section className="relative py-32 pt-40 text-center overflow-hidden">
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[50vw] h-[50vh] max-w-[500px] max-h-[500px]">
                            <Orb hue={250} forceHoverState={true} rotateOnHover={false} hoverIntensity={0.1}/>
                        </div>
                    </div>
                    <div className="container mx-auto relative z-10">
                        <motion.h1 {...fadeIn(0)} className="text-5xl md:text-7xl font-bold tracking-tighter">Powerful AI.</motion.h1>
                        <motion.h1 {...fadeIn(0.1)} className="text-5xl md:text-7xl font-bold tracking-tighter text-primary">Smarter Diagnostics.</motion.h1>
                        <motion.p {...fadeIn(0.2)} className="max-w-2xl mx-auto mt-6 text-lg text-muted-foreground">
                            Synapse AI bridges the gap between complex imaging data and rapid, accurate diagnostic reports, empowering healthcare professionals with cutting-edge tools.
                        </motion.p>
                        <motion.div {...fadeIn(0.3)}>
                            <Button size="lg" className="mt-8 glow-button" asChild>
                                <Link href="/app">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </motion.div>
                    </div>
                </section>

                {/* Key Metrics Section */}
                <section className="py-24">
                    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        <MetricCard 
                            value="90%" 
                            label="Accuracy in identifying key findings" 
                            animationDelay={0} 
                        />
                        <MetricCard 
                            value="5x" 
                            label="Faster reporting workflow on average" 
                            animationDelay={0.1} 
                        />
                        <MetricCard 
                            value="100%" 
                            label="Transparent & auditable AI reasoning" 
                            animationDelay={0.2} 
                        />
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-card/30">
                    <div className="container mx-auto text-center">
                        <motion.h2 {...fadeIn(0)} className="text-4xl font-bold tracking-tight mb-4">Discover the Solutions for Your Work</motion.h2>
                        <motion.p {...fadeIn(0.1)} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                            A suite of powerful tools designed to enhance diagnostic precision, consistency, and speed.
                        </motion.p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           <FeatureCard icon={Zap} title="AI-Generated Drafts" description="Instantly create comprehensive report drafts from scan analysis and your notes, complete with findings and measurements." delay={0} />
                           <FeatureCard icon={ShieldCheck} title="Transparent Reasoning" description="See exactly how the AI arrived at its suggestions with a clear, step-by-step reasoning log for full auditability." delay={0.1} />
                           <FeatureCard icon={Microscope} title="Tool-Augmented Analysis" description="Our AI uses external knowledge bases and internal case histories to ground its findings in real-world data, improving accuracy." delay={0.2} />
                           <FeatureCard icon={Layers} title="Custom Templates" description="Ensure consistency across your institution by using your own report templates for all AI-generated outputs." delay={0.3} />
                        </div>
                    </div>
                </section>

                 {/* Pricing Section */}
                <section className="py-24">
                    <div className="container mx-auto text-center">
                        <motion.h2 {...fadeIn(0)} className="text-4xl font-bold tracking-tight mb-4">Choose What Works Best</motion.h2>
                        <motion.p {...fadeIn(0.1)} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                            Flexible plans for individuals, teams, and large healthcare enterprises.
                        </motion.p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <PricingCard 
                                title="Basic"
                                price="Free"
                                features={["Up to 10 cases/month", "Standard AI analysis", "Community support"]}
                                ctaText="Get Started"
                            />
                            <PricingCard 
                                title="Pro"
                                price="$99/mo"
                                features={["Unlimited cases", "Advanced AI tool usage", "Custom templates", "Priority email support"]}
                                ctaText="Start Pro Trial"
                                isFeatured
                            />
                            <PricingCard 
                                title="Enterprise"
                                price="Custom"
                                features={["On-premise deployment", "MLOps Workbench", "Dedicated support & SLA", "HIPAA/GDPR compliance"]}
                                ctaText="Contact Sales"
                            />
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-24 bg-card/30">
                    <div className="container mx-auto">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <TestimonialCard 
                                quote="Synapse AI has cut our reporting time in half. The AI-generated drafts are remarkably accurate and well-structured, allowing us to focus more on complex cases."
                                author="Dr. Evelyn Reed"
                                title="Head of Radiology"
                                company="City General Hospital"
                                delay={0}
                            />
                             <TestimonialCard 
                                quote="The transparency of the AI's reasoning process is a game-changer. Being able to see the 'why' behind a suggestion builds trust in a way black-box systems can't."
                                author="Dr. Ben Carter"
                                title="Neuroradiologist"
                                delay={0.1}
                            />
                             <TestimonialCard 
                                quote="As a research institution, the MLOps workbench has been invaluable. It's accelerated our ability to train and validate our own models on our private datasets."
                                author="Dr. Alani Sharma"
                                title="Director of Medical AI Research"
                                delay={0.2}
                            />
                        </div>
                    </div>
                </section>

                 {/* Final CTA Section */}
                <section className="py-32 text-center">
                    <div className="container mx-auto">
                        <motion.h2 {...fadeIn(0)} className="text-4xl font-bold tracking-tight mb-4">Ready to revolutionize your reporting?</motion.h2>
                        <motion.p {...fadeIn(0.1)} className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                           Let us handle the preliminary work so you can focus on what matters most: patient outcomes.
                        </motion.p>
                        <motion.div {...fadeIn(0.2)}>
                             <Button size="lg" className="glow-button" asChild>
                                <Link href="/app">Launch Synapse AI</Link>
                            </Button>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <TransparentFooter />
        </div>
    );
}
