

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="sticky top-0 z-30 p-4 bg-background/50 backdrop-blur-lg border-b">
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
                </div>
            </div>
        </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
