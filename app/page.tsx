
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrainCircuit, ArrowRight, CheckCircle, Zap, ShieldCheck, Microscope, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import Aurora from '@/components/ui/Aurora';
import Orb from '@/components/ui/Orb';

const fadeIn = (delay = 0, duration = 0.5) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration, ease: "easeOut" },
  viewport: { once: true, amount: 0.3 }
});

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
    <motion.div {...fadeIn(delay)} className="p-6 rounded-lg bg-card/50 border border-white/10">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
            <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </motion.div>
);

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

const TestimonialCard = ({ quote, author, title, delay = 0 }) => (
    <motion.div {...fadeIn(delay)} className="p-6 rounded-lg bg-card/50 border border-white/10">
        <p className="text-muted-foreground mb-4">"{quote}"</p>
        <div>
            <p className="font-semibold">{author}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
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
            <header className="sticky top-0 z-50 p-4 bg-background/80 backdrop-blur-lg border-b border-white/10">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <BrainCircuit className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold">Synapse AI</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/product" className="text-muted-foreground hover:text-foreground">Product</Link>
                        <Link href="/medical-labeler" className="text-muted-foreground hover:text-foreground">Services</Link>
                        <Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link>
                        <Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQs</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild><Link href="/app">Sign In</Link></Button>
                        <Button asChild className="glow-button"><Link href="/app">Launch App</Link></Button>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative py-32 text-center overflow-hidden">
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
                    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <motion.div {...fadeIn(0)}>
                            <p className="text-5xl font-bold text-primary">90%</p>
                            <p className="text-muted-foreground mt-2">Accuracy in identifying key findings</p>
                        </motion.div>
                        <motion.div {...fadeIn(0.1)}>
                            <p className="text-5xl font-bold text-primary">5x</p>
                            <p className="text-muted-foreground mt-2">Faster reporting workflow on average</p>
                        </motion.div>
                        <motion.div {...fadeIn(0.2)}>
                            <p className="text-5xl font-bold text-primary">100%</p>
                            <p className="text-muted-foreground mt-2">Transparent & auditable AI reasoning</p>
                        </motion.div>
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
                                title="Head of Radiology, City General Hospital"
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
            <footer className="border-t border-white/10">
                <div className="container mx-auto py-12 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <BrainCircuit className="h-7 w-7 text-primary" />
                                <span className="text-xl font-bold">Synapse AI</span>
                            </Link>
                            <p className="text-muted-foreground text-sm">The AI co-pilot for diagnostic radiology.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Product</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                                <li><Link href="/faq" className="hover:text-foreground">FAQs</Link></li>
                                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                            </ul>
                        </div>
                        <div>
                           <h4 className="font-semibold mb-3">Company</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                            </ul>
                        </div>
                         <div>
                           <h4 className="font-semibold mb-3">Legal</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} Synapse AI. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
