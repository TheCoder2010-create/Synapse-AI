

"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is Synapse AI a replacement for a radiologist?",
    answer: "Absolutely not. Synapse AI is a platform designed to provide data and tools *for* experts. Our co-pilot application is a demonstration of our API, designed to augment the expertise of human radiologists by handling tedious data processing and reporting tasks. The final diagnostic interpretation and sign-off always rests with the medical professional."
  },
  {
    question: "What is the core product of Synapse AI?",
    answer: "Our core products are our proprietary data API—the Synapse Wrapper API—and our MLOps Workbench. We provide high-quality, structured, AI-ready data as a service, and the cloud platform for companies to train their own models on that data or their own private datasets."
  },
  {
    question: "How does the AI ground its reports in facts?",
    answer: "This is a key feature of our data enrichment pipeline. Our proprietary Synapse Wrapper API connects to multiple external knowledge bases (like Radiopaedia) and anatomical atlases. The AI is programmed to cross-reference its findings with these sources, and our API returns this structured, verified data."
  },
  {
    question: "Is my data secure?",
    answer: "As a conceptual application, data security is modeled on best practices but is not HIPAA compliant for real patient data. A production version of the Synapse AI platform would feature end-to-end encryption and adhere to all relevant medical data privacy regulations (HIPAA, GDPR). No uploaded data is ever used for training without explicit partnership agreements."
  },
  {
    question: "What file formats are supported for analysis?",
    answer: "Our data ingestion pipeline is designed to handle standard medical imaging formats, including DICOM (.dcm), g-zipped DICOM archives (.gz), as well as common image files like JPG and PNG. It can also process video files (e.g., MP4) by extracting key frames for analysis."
  }
];

export default function FAQPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground">
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

      <main className="flex-1 flex flex-col items-center container mx-auto px-4 z-10 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="max-w-4xl w-full bg-card/50 backdrop-blur-lg border rounded-2xl p-8 md:p-12 space-y-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-center">
            Frequently Asked Questions
          </h1>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

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
