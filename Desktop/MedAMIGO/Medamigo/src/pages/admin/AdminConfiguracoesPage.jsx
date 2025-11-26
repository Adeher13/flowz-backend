
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, AlertTriangle } from 'lucide-react';

const AdminConfiguracoesPage = () => {
  return (
    <>
      <Helmet>
        <title>Admin: Configurações - AmigoMeD!</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-6 w-6" />
            Configurações
          </CardTitle>
          <CardDescription>
            Gerencie as configurações da plataforma e do seu perfil de administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Página em Construção</h2>
            <p className="text-gray-500 mt-2 max-w-md">
              A página de configurações está em desenvolvimento. Em breve, você poderá gerenciar seu perfil, alterar senhas, ajustar preferências de notificação e muito mais.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AdminConfiguracoesPage;
