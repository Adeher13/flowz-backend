
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

const AuthModal = ({ open, onOpenChange }) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    const email = event.target.email.value;
    const password = event.target.password.value;
    const { error } = await signIn(email, password);
    if (!error) {
      toast({ title: 'Login bem-sucedido!', description: 'Bem-vindo de volta!' });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro de Login', description: error.message || 'Ocorreu um erro ao tentar fazer login.' });
    }
    setLoading(false);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    const fullName = event.target.fullName.value;
    const email = event.target.email.value;
    const password = event.target.password.value;
    const confirmPassword = event.target.confirmPassword.value;

    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Erro', description: 'As senhas não coincidem.' });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, { data: { full_name: fullName } });
    if (!error) {
      toast({ title: 'Conta criada com sucesso!', description: 'Verifique seu e-mail para confirmar sua conta.' });
      onOpenChange(false);
    } else {
      toast({ variant: 'destructive', title: 'Erro ao Criar Conta', description: error.message || 'Ocorreu um erro ao tentar criar sua conta.' });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">Bem-vindo ao AmigoMeD!</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Acesse sua conta ou crie uma nova para começar.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-md">
            <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200">
              <LogIn className="mr-2 h-4 w-4" /> Entrar
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200">
              <UserPlus className="mr-2 h-4 w-4" /> Criar Conta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-800">Email</Label>
                <Input id="login-email" name="email" type="email" placeholder="seu@email.com" required className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-800">Senha</Label>
                <Input id="login-password" name="password" type="password" required className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500" />
              </div>
              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleSignUp} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="register-fullName" className="text-gray-800">Nome Completo</Label>
                <Input id="register-fullName" name="fullName" placeholder="Seu nome" required className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-gray-800">Email</Label>
                <Input id="register-email" name="email" type="email" placeholder="seu@email.com" required className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-gray-800">Senha</Label>
                <Input id="register-password" name="password" type="password" required className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-confirmPassword" className="text-gray-800">Confirmar Senha</Label>
                <Input id="register-confirmPassword" name="confirmPassword" type="password" required className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500" />
              </div>
              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
