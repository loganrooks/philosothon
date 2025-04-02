import Link from 'next/link';

const NavBar = () => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Themes', href: '/themes' },
    { name: 'Workshops', href: '/workshops' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Register', href: '/register' },
    // Add Admin link later, potentially conditionally rendered
  ];

  return (
    <nav className="py-6">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo/Brand */}
        <Link href="/" className="text-xl font-bold font-mono text-hacker-green hover:brightness-125 transition">
          Philosothon UofT
        </Link>

        {/* Navigation Links */}
        <ul className="flex space-x-6">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="text-hacker-green hover:brightness-125 font-mono text-sm font-medium transition"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;