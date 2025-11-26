import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CheckCircle, BarChart } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const StatCard = ({ title, value, icon, loading }) => (
  <Card>
    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
      <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
      ) : (
        <div className='text-2xl font-bold'>{value}</div>
      )}
    </CardContent>
  </Card>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeSimulations: 0,
    completedTests: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const { count: studentCount, error: studentError } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        if (studentError) throw studentError;

        const { count: simCount, error: simError } = await supabase
          .from('custom_simulations')
          .select('*', { count: 'exact', head: true });

        if (simError) throw simError;

        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .not('finished_at', 'is', null);

        if (attemptsError) throw attemptsError;

        const completedTests = attempts?.length || 0;

        // Calcular média de acertos baseado em score/total_questions
        let averageScore = 0;
        if (completedTests > 0 && attempts) {
          const validAttempts = attempts.filter(
            (a) => a.score != null && a.total_questions > 0
          );
          if (validAttempts.length > 0) {
            const totalPercentage = validAttempts.reduce(
              (acc, a) => acc + (a.score / a.total_questions) * 100,
              0
            );
            averageScore = totalPercentage / validAttempts.length;
          }
        }

        setStats({
          totalStudents: studentCount,
          activeSimulations: simCount,
          completedTests,
          averageScore: averageScore.toFixed(1),
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar estatísticas',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AmigoMeD!</title>
      </Helmet>
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Dashboard do Administrador
        </h1>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='Total de Alunos'
            value={stats.totalStudents}
            icon={<Users className='h-4 w-4 text-muted-foreground' />}
            loading={loading}
          />
          <StatCard
            title='Simulados Ativos'
            value={stats.activeSimulations}
            icon={<FileText className='h-4 w-4 text-muted-foreground' />}
            loading={loading}
          />
          <StatCard
            title='Testes Concluídos'
            value={stats.completedTests}
            icon={<CheckCircle className='h-4 w-4 text-muted-foreground' />}
            loading={loading}
          />
          <StatCard
            title='Pontuação Média'
            value={`${stats.averageScore}%`}
            icon={<BarChart className='h-4 w-4 text-muted-foreground' />}
            loading={loading}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Em breve: um feed de atividades recentes dos alunos e simulados.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral do Desempenho</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Em breve: gráficos de desempenho geral dos alunos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
