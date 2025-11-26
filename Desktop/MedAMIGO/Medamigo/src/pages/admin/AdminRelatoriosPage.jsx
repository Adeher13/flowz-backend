
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Users, AlertTriangle } from 'lucide-react';

const AdminRelatoriosPage = () => {
  return (
    <>
      <Helmet>
        <title>Admin: Relatórios - AmigoMeD!</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="mr-2 h-6 w-6" />
            Relatórios
          </CardTitle>
          <CardDescription>
            Análises e estatísticas sobre o desempenho dos alunos e o uso da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Página em Construção</h2>
            <p className="text-gray-500 mt-2 max-w-md">
              A funcionalidade de relatórios detalhados está sendo desenvolvida e estará disponível em breve. Você poderá visualizar gráficos de desempenho, questões mais difíceis e muito mais.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminRelatoriosPage;
