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
    <nav className="py-4 border-b border-hacker-green"> {/* Vertical padding and border on nav */}
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center"> {/* Container, horizontal padding, flex */}
        {/* Logo/Brand */}
        <Link href="/" className="text-xl font-bold font-mono text-hacker-green hover:text-white transition">
          Philosothon UofT
        </Link>

        {/* Navigation Links */}
        <ul className="flex space-x-6">
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
  );
};

export default NavBar;