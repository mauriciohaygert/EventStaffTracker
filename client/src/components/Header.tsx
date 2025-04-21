import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  QrCode, 
  Users, 
  ChevronDown, 
  Menu, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEmployeeContext } from "@/context/EmployeeContext";

const Header = () => {
  const [location] = useLocation();
  const { setShowQRScanModal } = useEmployeeContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const isActive = (path: string) => {
    // Use exact match for home, prefix match for other routes
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-xl font-semibold">EventStaff</h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/">
              <a className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/") ? "font-semibold" : ""}`}>
                Dashboard
              </a>
            </Link>
            <Link href="/employees">
              <a className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/employees") ? "font-semibold" : ""}`}>
                Funcionários
              </a>
            </Link>
            <Link href="/shifts">
              <a className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/shifts") ? "font-semibold" : ""}`}>
                Turnos
              </a>
            </Link>
            <Link href="/reports">
              <a className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/reports") ? "font-semibold" : ""}`}>
                Relatórios
              </a>
            </Link>
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setShowQRScanModal(true)}
              variant="default" 
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white"
              size="icon"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <div className="relative">
              <button className="flex items-center space-x-1">
                <span className="hidden md:inline">Admin</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-white focus:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/">
              <a onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/") ? "bg-blue-600" : ""}`}>
                Dashboard
              </a>
            </Link>
            <Link href="/employees">
              <a onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/employees") ? "bg-blue-600" : ""}`}>
                Funcionários
              </a>
            </Link>
            <Link href="/shifts">
              <a onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/shifts") ? "bg-blue-600" : ""}`}>
                Turnos
              </a>
            </Link>
            <Link href="/reports">
              <a onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/reports") ? "bg-blue-600" : ""}`}>
                Relatórios
              </a>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
