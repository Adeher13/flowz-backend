import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Automatically redirect if not logged in
    if (!authLoading) {
      if (!user) {
        navigate('/?auth=required'); // Redirect to home with a prompt to log in
      } else {
        const isAdminPath = location.pathname.startsWith('/admin/');
        // Redirect non-admin users from admin pages to main dashboard
        if (isAdminPath && !isAdmin) {
          navigate('/dashboard');
        }
      }
    }
  }, [user, authLoading, isAdmin, location.pathname, navigate]);

  if (authLoading || !user) {
    return (
      <div className='flex h-[calc(100vh-4rem)] items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-cyan-600' />
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-4rem)] bg-gray-50/50'>
      <AdminSidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />

      <main className='flex-1 flex flex-col overflow-hidden'>
        <div className='md:hidden flex items-center justify-between p-2 border-b bg-white'>
          <span className='text-lg font-semibold text-gray-800'>
            AmigoMeD! {isAdmin ? 'Admin' : 'Dashboard'}
          </span>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </Button>
        </div>

        <div className='flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
