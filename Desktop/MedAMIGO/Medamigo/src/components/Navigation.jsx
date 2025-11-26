import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Stethoscope,
  LogIn,
  LogOut,
  LayoutDashboard,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AuthModal from '@/components/AuthModal';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const navLinks = [
    { path: '/', label: 'Início' },
    { path: '/#assessoria', label: 'Falar com Assessoria', isAnchor: true },
    { path: '/#planos', label: 'Matricular', isAnchor: true },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (link, e) => {
    if (link.isAnchor) {
      e.preventDefault();
      const targetId = link.path.split('#')[1];
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAreaAluno = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <nav className='bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <Link to='/' className='flex items-center space-x-2'>
              <Stethoscope className='h-8 w-8 text-cyan-600' />
              <span className='text-2xl font-bold text-gray-900'>
                AmigoMe<span className='text-cyan-600'>D!</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className='hidden md:flex items-center space-x-1 lg:space-x-4'>
              {navLinks.map((link) =>
                link.isAnchor ? (
                  <button
                    key={link.path}
                    onClick={(e) => handleNavClick(link, e)}
                    className='px-3 py-2 text-sm font-medium transition-colors hover:text-cyan-600 hover:bg-gray-100 rounded-md text-gray-700 flex items-center gap-2'
                  >
                    {link.label === 'Falar com Assessoria' && (
                      <MessageCircle className='h-4 w-4' />
                    )}
                    {link.label === 'Matricular' && (
                      <UserPlus className='h-4 w-4' />
                    )}
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 text-sm font-medium transition-colors hover:text-cyan-600 hover:bg-gray-100 rounded-md ${
                      isActive(link.path) ? 'text-cyan-600' : 'text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>

            <div className='flex items-center gap-2'>
              <div className='hidden md:flex items-center gap-3'>
                {user ? (
                  <>
                    <div className='text-sm font-medium text-gray-700'>
                      Bem-vindo,{' '}
                      <span className='text-cyan-600 font-semibold'>
                        {user.user_metadata?.full_name?.split(' ')[0] ||
                          user.email.split('@')[0]}
                      </span>
                    </div>
                    <Button
                      onClick={handleAreaAluno}
                      className='bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                    >
                      <LayoutDashboard className='mr-2 h-4 w-4' />
                      {isAdmin ? 'Admin Dashboard' : 'Área do Aluno'}
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant='outline'
                      className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                    >
                      <LogOut className='mr-2 h-4 w-4' /> Sair
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsAuthModalOpen(true)}
                    className='bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                  >
                    <LogIn className='mr-2 h-4 w-4' /> Área do Aluno
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className='md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100'
              >
                {isMobileMenuOpen ? (
                  <X className='h-6 w-6' />
                ) : (
                  <Menu className='h-6 w-6' />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='md:hidden border-t border-gray-200'
            >
              <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
                {navLinks.map((link) =>
                  link.isAnchor ? (
                    <button
                      key={link.path}
                      onClick={(e) => {
                        handleNavClick(link, e);
                        setIsMobileMenuOpen(false);
                      }}
                      className='w-full text-left block py-2 px-3 text-base font-medium rounded-md transition-colors hover:bg-gray-50 text-gray-700 flex items-center gap-2'
                    >
                      {link.label === 'Falar com Assessoria' && (
                        <MessageCircle className='h-4 w-4' />
                      )}
                      {link.label === 'Matricular' && (
                        <UserPlus className='h-4 w-4' />
                      )}
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block py-2 px-3 text-base font-medium rounded-md transition-colors hover:bg-gray-50 ${
                        isActive(link.path)
                          ? 'text-cyan-600 bg-cyan-50'
                          : 'text-gray-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </div>
              <div className='pt-4 pb-3 border-t border-gray-200'>
                {user ? (
                  <div className='px-2 space-y-2'>
                    <div className='text-center mb-3 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-full'>
                      <span className='text-sm font-medium text-gray-700'>
                        Bem-vindo,{' '}
                        <span className='text-cyan-600 font-semibold'>
                          {user.user_metadata?.full_name?.split(' ')[0] ||
                            user.email.split('@')[0]}
                        </span>
                      </span>
                    </div>
                    <Button
                      className='w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                      onClick={() => {
                        handleAreaAluno();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className='mr-2 h-4 w-4' />
                      {isAdmin ? 'Admin Dashboard' : 'Área do Aluno'}
                    </Button>
                    <Button
                      variant='outline'
                      className='w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className='mr-2 h-4 w-4' /> Sair do Sistema
                    </Button>
                  </div>
                ) : (
                  <div className='px-2'>
                    <Button
                      className='w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogIn className='mr-2 h-4 w-4' /> Área do Aluno
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </>
  );
};

export default Navigation;
