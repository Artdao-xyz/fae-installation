'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Minus } from 'lucide-react';

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
  const allItems = [...navigationItems, { name: 'About', href: '/about' }];
  const activeItem = allItems.find(i => i.href === pathname) || allItems[0];

  return (
    <header className="md:bg-white/60 h-full md:h-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 md:py-4">
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
        </div>

        {/* Mobile Navigation */} 
          <div className="md:hidden">
            <nav className="flex flex-col justify-center gap-3">
              {(isMenuOpen ? allItems : allItems.filter(item => pathname === item.href)).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <div className={`flex items-center px-5 py-3.5 rounded-100px transition-colors duration-200 shadow-md ${isActive ? 'justify-between bg-white border border-black' : 'justify-center bg-white/60'}`}>
                    {isActive ? (
                      <>
                        <Link
                          key={item.name}
                          href={item.href}
                          className="w-full text-black text-xs font-normal font-geist-mono leading-3"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="flex-1 text-center">{item.name}</span>
                        </Link>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                          {isMenuOpen ? <Minus className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
                        </button>
                      </>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-black text-xs font-normal font-geist-mono leading-3"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
      </div>
    </header>
  );
}
