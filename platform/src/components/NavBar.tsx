'use client'; // Add 'use client' directive for useState

import { useState } from 'react';
import Link from 'next/link';

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Themes', href: '/themes' },
    { name: 'Workshops', href: '/workshops' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Student Proposal', href: '/proposal' },
    { name: 'Register', href: '/register' },
    // Add Admin link later, potentially conditionally rendered
  ];

  return (
    // Use relative positioning context for the absolute dropdown
    <nav className="relative py-4 border-b border-hacker-green">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo/Brand - Use Philosopher font */}
        <Link href="/" className="text-xl font-bold font-philosopher text-hacker-green hover:text-white transition">
          Philosothon UofT
        </Link>

        {/* Hamburger Menu Button (visible on small screens) */}
        <button
          className="md:hidden text-hacker-green focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {/* Simple Hamburger Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {/* Desktop Links (hidden on small screens) */}
        <ul className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6"> {/* Ensure flex alignment */}
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="text-hacker-green hover:text-white font-mono text-sm font-medium transition"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu (Hanging Dropdown - absolutely positioned) */}
      {isMobileMenuOpen && (
        // Position absolute, below nav, full width, dark background, padding, bottom
        <div className="absolute top-full right-4 z-10 md:hidden bg-black border-t border-hacker-green px-6 py-4 w-48">
          <ul className="flex flex-col space-y-2"> {/* Vertical list, basic spacing */}
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  // Block display, vertical padding, consistent styling
                  className="block py-2 text-hacker-green hover:text-white font-mono text-sm font-medium transition"
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NavBar;