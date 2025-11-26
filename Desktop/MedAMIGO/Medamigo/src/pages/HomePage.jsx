import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Calculator,
  TrendingUp,
  Users,
  Award,
  Clock,
  Stethoscope,
  LayoutDashboard,
  FileText,
} from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: <GraduationCap className='h-8 w-8' />,
      title: 'Raio-X Completo',
      description:
        'Avaliação detalhada do seu perfil acadêmico e chances de transferência',
    },
    {
      icon: <TrendingUp className='h-8 w-8' />,
      title: 'Acompanhamento',
      description:
        'Monitore seu progresso e melhore suas chances continuamente',
    },
    {
      icon: <Users className='h-8 w-8' />,
      title: 'Assessoria Especializada',
      description:
        'Orientação personalizada de profissionais experientes em transferências médicas',
    },
    {
      icon: <FileText className='h-8 w-8' />,
      title: 'Auxílio em Documentação',
      description:
        'Suporte completo na preparação e conferência de toda documentação necessária',
    },
  ];

  const plans = [
    {
      name: 'Raio-X + Consultoria Individual',
      duration: '1 mês de acesso',
      price: 'R$ 427,00',
      features: [
        'Diagnóstico completo',
        '1 consultoria individual',
        'Acesso ao canal exclusivo no Discord',
        'Suporte por 30 dias',
      ],
      highlight: false,
    },
    {
      name: 'Raio-X + Consultoria Individual',
      duration: '3 meses de acesso',
      price: 'R$ 597,00',
      features: [
        'Diagnóstico completo',
        '1 consultoria individual',
        'Acesso ao canal exclusivo no Discord',
        'Suporte e acompanhamento por 90 dias',
        'Priorização no canal de dúvidas',
      ],
      highlight: true,
      badge: 'MAIS QUERIDO',
    },
    {
      name: 'Diagnóstico + Consultoria + Conferência de Documentação',
      duration: '3 meses de acesso',
      price: 'R$ 797,00',
      features: [
        'Diagnóstico completo',
        '1 consultoria individual',
        'Acesso ao canal exclusivo no Discord',
        'Suporte e acompanhamento por 90 dias',
        'Priorização no canal de dúvidas',
        'Conferência completa da documentação (histórico, ementa, carga horária, apostila, traduções)',
      ],
      highlight: false,
    },
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Transferida para UFMG',
      content:
        'O AmigoMeD! foi essencial na minha transferência. O raio-x acadêmico me ajudou a focar nas instituições certas.',
      avatar: 'Medical student studying with books',
    },
    {
      name: 'João Santos',
      role: 'Transferido para USP',
      content:
        'A calculadora de chances me deu uma visão realista e me motivou a estudar mais. Consegui minha transferência!',
      avatar: 'Happy medical student with stethoscope',
    },
    {
      name: 'Ana Costa',
      role: 'Transferida para UFRJ',
      content:
        'Plataforma completa e intuitiva. Me ajudou em cada etapa do processo de transferência.',
      avatar: 'Female medical student smiling',
    },
  ];

  const stats = [
    { number: '500+', label: 'Transferências Realizadas' },
    { number: '92%', label: 'Taxa de Satisfação' },
    { number: '82%', label: 'Taxa de Sucesso' },
    { number: '50+', label: 'Instituições Parceiras' },
  ];

  return (
    <>
      <Helmet>
        <title>AmigoMeD! - Plataforma de Transferência Médica</title>
        <meta
          name='description'
          content='Plataforma completa para raio-x acadêmico e cálculo de chances de transferência para cursos de medicina. Realize seu sonho de estudar na instituição ideal.'
        />
      </Helmet>

      <div className='min-h-screen'>
        {/* Hero Section */}
        <section
          id='assessoria'
          className='relative overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0D3A5F] to-[#134E7A] text-white min-h-[90vh]'
        >
          {/* Mapa da América do Sul como fundo com animação */}
          <motion.div
            className='absolute inset-0 opacity-15'
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.15 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <div
              className='w-full h-full animate-pulse'
              style={{ animationDuration: '10s' }}
            >
              <img
                src='https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1920&q=80'
                alt='Mapa América do Sul'
                className='w-full h-full object-cover'
              />
            </div>
          </motion.div>

          {/* Overlay com gradiente */}
          <div className='absolute inset-0 bg-gradient-to-br from-[#0A2540]/80 via-[#0D3A5F]/70 to-[#134E7A]/80'></div>

          <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10'>
            {/* Conteúdo centralizado */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className='text-center space-y-8'
            >
              {/* Título principal */}
              <h1 className='text-5xl md:text-6xl lg:text-7xl font-bold leading-tight'>
                Transfira seu curso de medicina com assessoria especializada e
                mais de{' '}
                <span className='text-green-400'>82% de aprovação.</span>
              </h1>

              {/* Subtítulo */}
              <p className='text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto'>
                Assessoria especializada para garantir sua vaga em uma nova
                instituição no Brasil.
              </p>

              {/* Botão CTA */}
              <div className='pt-6'>
                <Link to='/dashboard'>
                  <Button
                    size='lg'
                    className='bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white text-xl px-12 py-8 rounded-2xl font-bold shadow-2xl shadow-green-500/50 hover:scale-105 transition-all duration-300 border-0'
                  >
                    Quero conhecer
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Degradê suave para a próxima seção */}
          <div className='absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent'></div>
        </section>

        {/* Stats Section */}
        <section className='py-16 bg-gradient-to-br from-white via-green-50/30 to-blue-50/30'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100'
                >
                  <div className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3'>
                    {stat.number}
                  </div>
                  <div className='text-sm md:text-base text-gray-700 font-medium'>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className='py-20 bg-gradient-to-br from-white via-slate-50 to-gray-50'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className='text-center mb-16'
            >
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                Por Que Escolher o{' '}
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600'>
                  AmigoMeD!
                </span>
                ?
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                Tecnologia de ponta para ajudar você a alcançar seus objetivos
                acadêmicos
              </p>
            </motion.div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto'>
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-400/50 transform hover:-translate-y-2 overflow-hidden'
                >
                  <div className='absolute inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <div className='relative z-10'>
                    <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300 shadow-lg'>
                      {feature.icon}
                    </div>
                    <h3 className='text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors'>
                      {feature.title}
                    </h3>
                    <p className='text-gray-600 leading-relaxed'>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section id='planos' className='py-20 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className='text-center mb-16'
            >
              <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
                Nossos Planos
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                Escolha o plano ideal para sua jornada de transferência
              </p>
            </motion.div>

            <div className='grid md:grid-cols-3 gap-8'>
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  viewport={{ once: true }}
                  className={`rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${
                    plan.highlight
                      ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 ring-4 ring-amber-400 border-amber-300 transform scale-110 shadow-amber-200 hover:shadow-amber-300 hover:border-amber-500'
                      : 'bg-gradient-to-br from-white via-slate-50 to-gray-50 border-gray-200 hover:border-cyan-400'
                  }`}
                >
                  {plan.highlight && (
                    <div className='relative overflow-hidden'>
                      <div className='absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 animate-pulse'></div>
                      <div className='relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white text-center py-4 font-extrabold text-sm tracking-widest shadow-2xl'>
                        <div className='flex items-center justify-center gap-2'>
                          <span className='text-lg'>👑</span>
                          <span>{plan.badge || 'MAIS QUERIDO'}</span>
                          <span className='text-lg'>👑</span>
                        </div>
                        <div className='text-xs font-semibold mt-1 opacity-90'>
                          MELHOR CUSTO-BENEFÍCIO
                        </div>
                      </div>
                    </div>
                  )}
                  <div className='p-8 relative'>
                    <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                      {plan.name}
                    </h3>
                    <p className='text-gray-600 mb-6'>{plan.duration}</p>
                    <div className='mb-6'>
                      <span className='text-4xl font-bold text-cyan-600'>
                        {plan.price}
                      </span>
                    </div>
                    <div className='space-y-4 mb-8'>
                      <p className='font-semibold text-gray-900'>Inclui:</p>
                      <ul className='space-y-3'>
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className='flex items-start'>
                            <svg
                              className='h-6 w-6 text-green-500 mr-2 flex-shrink-0'
                              fill='none'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path d='M5 13l4 4L19 7'></path>
                            </svg>
                            <span className='text-gray-700'>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      className={`w-full text-lg py-6 font-semibold transform transition-all hover:scale-105 text-white ${
                        plan.highlight
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-green-500/50'
                          : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg hover:shadow-green-600/50'
                      }`}
                    >
                      Escolher Plano →
                    </Button>

                    {/* Efeito de brilho no hover */}
                    <div className='absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none'>
                      <div className='absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-2xl'></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className='py-20 bg-white'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className='text-center mb-16'
            >
              <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
                Histórias de Sucesso
              </h2>
              <p className='text-xl text-gray-600'>
                Veja o que nossos usuários têm a dizer
              </p>
            </motion.div>

            <div className='grid md:grid-cols-3 gap-8'>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='bg-gray-50 p-6 rounded-xl'
                >
                  <div className='flex items-center mb-4'>
                    <img
                      alt={`${testimonial.name} avatar`}
                      className='w-12 h-12 rounded-full mr-4'
                      src='https://images.unsplash.com/photo-1649399045831-40bfde3ef21d'
                    />
                    <div>
                      <div className='font-bold text-gray-900'>
                        {testimonial.name}
                      </div>
                      <div className='text-sm text-cyan-600'>
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className='text-gray-600 italic'>
                    "{testimonial.content}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-24 bg-gradient-to-br from-green-600 via-emerald-600 to-blue-600 text-white relative overflow-hidden'>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-20'></div>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className='text-4xl md:text-5xl font-bold mb-6'>
                Pronto Para Começar Sua Jornada? 🚀
              </h2>
              <p className='text-xl md:text-2xl mb-10 text-green-50'>
                Acesse seu dashboard e siga o passo a passo rumo à sua
                transferência
              </p>
              <Link to='/dashboard'>
                <Button
                  size='lg'
                  className='bg-white text-green-600 hover:bg-green-50 text-xl px-12 py-8 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all duration-300'
                >
                  <LayoutDashboard className='mr-2 h-6 w-6' />
                  Acessar Dashboard Agora
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className='bg-gray-900 text-white py-12'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid md:grid-cols-4 gap-8'>
              <div>
                <div className='flex items-center space-x-2 mb-4'>
                  <Stethoscope className='h-6 w-6 text-cyan-400' />
                  <span className='text-xl font-bold'>AmigoMeD!</span>
                </div>
                <p className='text-gray-400 text-sm'>
                  Sua plataforma completa para transferência médica
                </p>
              </div>
              <div>
                <span className='font-bold mb-4 block'>Navegação</span>
                <div className='space-y-2 text-sm'>
                  <Link
                    to='/'
                    className='block text-gray-400 hover:text-white transition-colors'
                  >
                    Início
                  </Link>
                  <Link
                    to='/analise-perfil'
                    className='block text-gray-400 hover:text-white transition-colors'
                  >
                    Raio-X Acadêmico
                  </Link>
                  <Link
                    to='/calculadora-chances'
                    className='block text-gray-400 hover:text-white transition-colors'
                  >
                    Calculadora
                  </Link>
                  <Link
                    to='/simulados'
                    className='block text-gray-400 hover:text-white transition-colors'
                  >
                    Simulados
                  </Link>
                </div>
              </div>
              <div>
                <span className='font-bold mb-4 block'>Recursos</span>
                <div className='space-y-2 text-sm text-gray-400'>
                  <p>Blog</p>
                  <p>FAQ</p>
                  <p>Suporte</p>
                  <p>Contato</p>
                </div>
              </div>
              <div>
                <span className='font-bold mb-4 block'>Legal</span>
                <div className='space-y-2 text-sm text-gray-400'>
                  <p>Termos de Uso</p>
                  <p>Política de Privacidade</p>
                  <p>Cookies</p>
                </div>
              </div>
            </div>
            <div className='border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400'>
              <p>&copy; 2025 AmigoMeD!. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
