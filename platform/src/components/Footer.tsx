
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-base border-t border-medium-gray mt-16 py-8"> {/* Use subtle gray border */}
      <div className="container mx-auto px-4 text-center text-light-text text-sm">
        <p>&copy; {currentYear} Philosothon UofT. All rights reserved.</p>
        {/* Optional: Add links to privacy policy, terms, contact, etc. later */}
        {/* <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;