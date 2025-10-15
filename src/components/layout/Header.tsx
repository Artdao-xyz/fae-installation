'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Briefings', href: '/briefings' },
    { name: 'Papers', href: '/papers' },
    { name: 'Projects', href: '/projects' },
    { name: 'Network', href: '/network' },
  ];

  return (
    <header className="backdrop-blur-xl bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo and Navigation */}
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-5">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-black text-xs font-normal font-geist-mono leading-3 hover:text-gray-900 transition-colors duration-200 px-5 py-2.5 ${
                    pathname === item.href ? 'bg-white outline outline-black rounded-100px' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          
          {/* Right side - About */}
          <div className="hidden md:block">
            <Link
              href="/about"
              className={`text-black text-xs font-normal font-geist-mono leading-3 hover:text-gray-900 transition-colors duration-200 px-5 py-2.5 ${
                pathname === '/about' ? 'bg-white outline outline-black rounded-100px' : ''
              }`}
            >
              About
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-black text-xs font-normal font-geist-mono leading-3 hover:text-gray-900 transition-colors duration-200 px-5 py-2.5 ${
                    pathname === item.href ? 'bg-white outline outline-black rounded-100px' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4">
                <Link
                  href="/about"
                  className={`text-black text-xs font-normal font-geist-mono leading-3 hover:text-gray-900 transition-colors duration-200 px-5 py-2.5 ${
                    pathname === '/about' ? 'bg-white outline outline-black rounded-100px' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  About
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
