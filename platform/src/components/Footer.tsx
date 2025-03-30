
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-12 py-6">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
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