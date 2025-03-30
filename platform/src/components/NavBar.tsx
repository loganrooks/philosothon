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
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-800">
            {/* TODO: Replace text with actual logo/SVG if available */}
            Philosothon UofT
          </Link>

          {/* Navigation Links */}
          <ul className="flex space-x-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;