'use client';

import Link from 'next/link';
import { Twitter, Github, Linkedin } from 'lucide-react';
import Container from '../ui/Container';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Changelog', href: '/changelog' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/anything', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/anything', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/company/anything', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="py-16 border-t border-zinc-200 dark:border-slate-800 transition-colors">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-slate-100 mb-4">
              Anything
            </h3>
            <p className="text-sm text-zinc-600 dark:text-slate-400 mb-4">
              Turn any idea into a business with the power of AI.
            </p>
            {/* Social links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-slate-100 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-slate-100 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-slate-100 mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-slate-400 hover:text-zinc-900 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Anything. All rights reserved.
          </p>
          <p className="text-sm text-zinc-500">
            Made with AI, for builders everywhere.
          </p>
        </div>
      </Container>
    </footer>
  );
}
