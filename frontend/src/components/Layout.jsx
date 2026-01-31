import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, PlusCircle, Wallet } from "lucide-react";

export const Layout = ({ children }) => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-zinc-200">
        <div className="container-main">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 rounded-xl bg-[#FF5F00] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
                FundFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-[#0a0a0a]' : 'text-[#52525b] hover:text-[#0a0a0a]'}`}
                data-testid="nav-home"
              >
                Home
              </Link>
              <Link 
                to="/browse" 
                className={`text-sm font-medium transition-colors ${isActive('/browse') ? 'text-[#0a0a0a]' : 'text-[#52525b] hover:text-[#0a0a0a]'}`}
                data-testid="nav-browse"
              >
                Browse Collections
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-[#0a0a0a]' : 'text-[#52525b] hover:text-[#0a0a0a]'}`}
                data-testid="nav-about"
              >
                About Us
              </Link>
            </nav>

            {/* CTA Button */}
            <Link to="/create" data-testid="create-collection-btn">
              <Button className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <PlusCircle className="w-4 h-4 mr-2" />
                Start Collection
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] text-white py-12 mt-20">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF5F00] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
                  FundFlow
                </span>
              </div>
              <p className="text-zinc-400 max-w-sm">
                The easiest way to collect funds from friends, family, and community for any occasion.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4" style={{ fontFamily: 'Bricolage Grotesque' }}>Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/browse" className="text-zinc-400 hover:text-white transition-colors">
                    Browse Collections
                  </Link>
                </li>
                <li>
                  <Link to="/create" className="text-zinc-400 hover:text-white transition-colors">
                    Start Collection
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-zinc-400 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="font-semibold mb-4" style={{ fontFamily: 'Bricolage Grotesque' }}>Use Cases</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>Team Celebrations</li>
                <li>Medical Emergency</li>
                <li>Festival Funds</li>
                <li>Society Maintenance</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-zinc-500 text-sm">
            <p>&copy; {new Date().getFullYear()} FundFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50">
        <div className="flex items-center justify-around py-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center p-2 ${isActive('/') ? 'text-[#FF5F00]' : 'text-zinc-500'}`}
            data-testid="mobile-nav-home"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link 
            to="/browse" 
            className={`flex flex-col items-center p-2 ${isActive('/browse') ? 'text-[#FF5F00]' : 'text-zinc-500'}`}
            data-testid="mobile-nav-browse"
          >
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">Browse</span>
          </Link>
          <Link 
            to="/create" 
            className={`flex flex-col items-center p-2 ${isActive('/create') ? 'text-[#FF5F00]' : 'text-zinc-500'}`}
            data-testid="mobile-nav-create"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-xs mt-1">Create</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
