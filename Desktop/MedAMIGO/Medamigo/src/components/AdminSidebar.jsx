import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  BarChart,
  Settings,
  LogOut,
  UserCheck,
  History,
  X,
  BrainCircuit,
  User as UserIcon,
  Target,
  Sparkles,
  FileCheck,
  BookOpen,
  FileQuestion,
  Plus,
} from 'lucide-react';

const AdminSidebar = ({ isOpen, setOpen }) => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const adminNavItems = [
    // Seção: Navegação (Não Gerenciamento)
    { icon: LayoutDashboard, label: 'Comece por Aqui', path: '/dashboard' },
    { icon: BrainCircuit, label: 'Raio-X Acadêmico', path: '/analise-perfil' },
    { icon: Sparkles, label: 'Ver Raio-X', path: '/ver-raio-x' },
    {
      icon: Target,
      label: 'Simulados Disponíveis',
      path: '/simulados-disponiveis',
    },
    {
      icon: FileCheck,
      label: 'Preparar Documentos',
      path: '/preparar-documentos',
    },
    { icon: UserIcon, label: 'Meu Perfil', path: '/perfil' },
    {
      icon: FileQuestion,
      label: 'Provas Anteriores',
      path: '/provas-anteriores',
    },

    // Seção: Gerenciamento Admin
    {
      icon: LayoutDashboard,
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: ClipboardList,
      label: 'Gerenciar Questões',
      path: '/admin/questoes',
    },
    {
      icon: FileText,
      label: 'Gerenciar Simulados',
      path: '/admin/gerenciar-simulados',
    },
    {
      icon: BrainCircuit,
      label: 'Gerenciar Raio-X',
      path: '/admin/raio-x',
    },
    {
      icon: UserIcon,
      label: 'Gerenciar Faculdades',
      path: '/admin/faculdades',
    },
    { icon: Users, label: 'Alunos', path: '/admin/alunos' },
    { icon: BarChart, label: 'Relatórios', path: '/admin/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/admin/configuracoes' },
    {
      icon: Plus,
      label: 'Criar Simulado',
      path: '/admin/criar-simulado',
    },
  ];

  const studentNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Comece por Aqui',
      path: '/dashboard',
    },
    { icon: BrainCircuit, label: 'Raio-X Acadêmico', path: '/analise-perfil' },
    { icon: Sparkles, label: 'Ver Raio-X', path: '/ver-raio-x' },
    {
      icon: Target,
      label: 'Simulados Disponíveis',
      path: '/simulados-disponiveis',
    },
    {
      icon: FileCheck,
      label: 'Preparar Documentos',
      path: '/preparar-documentos',
    },
    { icon: UserIcon, label: 'Meu Perfil', path: '/perfil' },
    {
      icon: FileQuestion,
      label: 'Provas Anteriores',
      path: '/provas-anteriores',
    },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  const NavLink = ({ item }) => (
    <Link to={item.path} onClick={() => setOpen(false)}>
      <Button
        variant='ghost'
        className={cn(
          'w-full justify-start text-base transition-all duration-200',
          location.pathname === item.path
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700'
        )}
      >
        <item.icon className='mr-3 h-5 w-5' />
        {item.label}
      </Button>
    </Link>
  );

  const SidebarContent = () => (
    <div className='flex flex-col h-full'>
      <div className='p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-12 w-12 ring-4 ring-white/30'>
            <AvatarImage
              src={user.user_metadata?.avatar_url}
              alt={user.user_metadata?.full_name}
            />
            <AvatarFallback className='bg-white text-blue-600 font-bold text-lg'>
              {getInitials(user.user_metadata?.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 overflow-hidden'>
            <p className='font-bold text-white truncate text-lg'>
              {user.user_metadata?.full_name || 'Usuário'}
            </p>
            <p className='text-sm text-blue-100 truncate'>{user.email}</p>
          </div>
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden text-white hover:bg-white/20'
          onClick={() => setOpen(false)}
        >
          <X className='h-6 w-6' />
        </Button>
      </div>

      <nav className='flex-1 p-4 space-y-2'>
        {navItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      <div className='p-4 mt-auto border-t bg-gradient-to-r from-red-50 to-pink-50'>
        <Button
          variant='outline'
          className='w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all'
          onClick={handleLogout}
        >
          <LogOut className='mr-3 h-5 w-5' />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 bg-white border-r transform transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className='hidden md:block md:w-80 md:flex-shrink-0 bg-white border-r'>
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;
