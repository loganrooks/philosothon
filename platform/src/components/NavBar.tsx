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
    <> {/* Use fragment to wrap nav and mobile menu */}
      <nav className="py-4 border-b border-hacker-green"> {/* Vertical padding and border on nav */}
        {/* Updated padding to match layout */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold font-mono text-hacker-green hover:text-white transition">
            Philosothon UofT
          </Link>

          {/* Hamburger Menu Button (visible on small screens) */}
          <button
            className="md:hidden text-hacker-green focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {/* Simple Hamburger Icon (can be replaced with SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          {/* Hide desktop links on small screens */}
          <ul className="hidden md:flex space-x-6">
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
      </nav>

      {/* Mobile Menu (conditionally rendered) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-base border-t border-hacker-green">
          <ul className="flex flex-col items-center space-y-4 py-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-hacker-green hover:text-white font-mono text-sm font-medium transition"
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </> // Closing fragment tag
  ); // Closing parenthesis for return statement
};

export default NavBar;