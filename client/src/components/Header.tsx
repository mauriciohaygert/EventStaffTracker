import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  QrCode, 
  Users, 
  ChevronDown, 
  Menu, 
  X,
  LogOut,
  Settings,
  User,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const [location] = useLocation();
  const { setShowQRScanModal } = useEmployeeContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const isActive = (path: string) => {
    // Use exact match for home, prefix match for other routes
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Função para obter as iniciais do usuário para o avatar
  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    return user.username.substring(0, 2).toUpperCase();
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
              <span className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/") ? "font-semibold" : ""} cursor-pointer`}>
                Dashboard
              </span>
            </Link>
            <Link href="/employees">
              <span className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/employees") ? "font-semibold" : ""} cursor-pointer`}>
                Funcionários
              </span>
            </Link>
            <Link href="/shifts">
              <span className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/shifts") ? "font-semibold" : ""} cursor-pointer`}>
                Turnos
              </span>
            </Link>
            <Link href="/reports">
              <span className={`text-white hover:text-gray-200 px-2 py-1 rounded font-medium ${isActive("/reports") ? "font-semibold" : ""} cursor-pointer`}>
                Relatórios
              </span>
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full focus:ring-0 focus:ring-offset-0">
                  <Avatar className="h-8 w-8 bg-secondary text-primary">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                
                {/* Item apenas para administradores */}
                {user?.role === "admin" && (
                  <Link href="/admin/users">
                    <DropdownMenuItem>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Gerenciar Usuários</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <span onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/") ? "bg-blue-600" : ""} cursor-pointer`}>
                Dashboard
              </span>
            </Link>
            <Link href="/employees">
              <span onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/employees") ? "bg-blue-600" : ""} cursor-pointer`}>
                Funcionários
              </span>
            </Link>
            <Link href="/shifts">
              <span onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/shifts") ? "bg-blue-600" : ""} cursor-pointer`}>
                Turnos
              </span>
            </Link>
            <Link href="/reports">
              <span onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/reports") ? "bg-blue-600" : ""} cursor-pointer`}>
                Relatórios
              </span>
            </Link>
            
            {/* Menu admin para versão mobile */}
            {user?.role === "admin" && (
              <Link href="/admin/users">
                <span onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-2 rounded-md text-white font-medium hover:bg-blue-600 ${isActive("/admin/users") ? "bg-blue-600" : ""} cursor-pointer`}>
                  Gerenciar Usuários
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
