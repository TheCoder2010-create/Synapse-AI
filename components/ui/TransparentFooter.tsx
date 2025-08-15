'use client';

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';

interface FooterLinkGroup {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

const footerLinks: FooterLinkGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
    ],
  },
];

export default function TransparentFooter() {
  return (
    <footer className="transparent-footer">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BrainCircuit className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">Synapse AI</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The AI co-pilot for diagnostic radiology, empowering healthcare professionals with cutting-edge tools.
            </p>
          </div>

          {/* Footer Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold mb-3 text-foreground">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Synapse AI. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}