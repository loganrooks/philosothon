import TerminalShell from './components/TerminalShell';

export default function RegisterPage() {
  return (
    // Container to give the terminal a defined area.
    // Adjust height as needed (e.g., 'h-screen', 'h-[calc(100vh-theme_header_height)]').
    // Using vh might require parent containers to also have height defined.
    // Let's start with a relative height or a large fixed height for now.
    <div className="h-[85vh] w-full p-4 bg-black"> {/* Added padding and bg for context */}
      <TerminalShell />
    </div>
  );
}