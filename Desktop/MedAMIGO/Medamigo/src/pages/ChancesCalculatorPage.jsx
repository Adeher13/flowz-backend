import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Calculator, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';

const GaugeChart = ({ value }) => {
  const getRotation = (v) => (v / 100) * 180 - 90;
  const rotation = getRotation(value);
  const color =
    value >= 70
      ? 'text-green-500'
      : value >= 40
      ? 'text-yellow-500'
      : 'text-red-500';

  return (
    <div className='relative w-48 h-24 mx-auto'>
      <div className='absolute w-full h-full border-8 border-gray-200 rounded-t-full border-b-0 overflow-hidden'></div>
      <div
        className={`absolute w-full h-full border-8 rounded-t-full border-b-0 overflow-hidden transition-transform duration-700 ${color} border-l-transparent border-r-transparent border-t-current`}
        style={{ transform: `rotate(${rotation}deg)` }}
      ></div>
      <div className='absolute bottom-0 w-full text-center'>
        <span className={`text-4xl font-bold ${color}`}>{value}%</span>
        <p className='text-sm text-gray-500'>de Chance</p>
      </div>
    </div>
  );
};

const ChancesCalculatorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [semester, setSemester] = useState([4]);
  const [gpa, setGpa] = useState([8]);
  const [studyHours, setStudyHours] = useState('10-20');
  const [institutionType, setInstitutionType] = useState('Ambas');
  const [result, setResult] = useState(null);

  const calculateChances = () => {
    let chance = 0;

    // Semester: sweet spot is between 3rd and 8th
    const s = semester[0];
    if (s >= 3 && s <= 8) chance += 35;
    else if (s < 3) chance += 20;
    else chance += 15;

    // GPA: crucial factor
    const g = gpa[0];
    if (g >= 9) chance += 35;
    else if (g >= 7.5) chance += 25;
    else if (g >= 6) chance += 15;
    else chance += 5;

    // Study Hours
    if (studyHours === '30+') chance += 20;
    else if (studyHours === '20-30') chance += 15;
    else if (studyHours === '10-20') chance += 10;
    else chance += 5;

    // Institution Type Competitiveness
    if (institutionType === 'Pública') chance *= 0.8;
    else if (institutionType === 'Privada') chance *= 1.1;

    chance = Math.min(Math.max(Math.round(chance), 5), 98); // Clamp between 5 and 98

    let riskLevel, riskColor, feedback;
    if (chance >= 70) {
      riskLevel = 'Baixo';
      riskColor = 'text-green-500';
      feedback =
        'Excelente! Suas chances são altas. Com uma boa preparação, seu sucesso é muito provável.';
    } else if (chance >= 40) {
      riskLevel = 'Médio';
      riskColor = 'text-yellow-500';
      feedback =
        'Boas chances! Você está no caminho certo. Focar em alguns pontos-chave pode aumentar muito seu potencial.';
    } else {
      riskLevel = 'Alto';
      riskColor = 'text-red-500';
      feedback =
        'É um desafio, mas não impossível! Com estratégia e dedicação, você pode virar o jogo. Vamos te ajudar!';
    }

    setResult({
      chance,
      chanceWithSupport: Math.min(
        chance + 15 + Math.floor(Math.random() * 10),
        99
      ),
      riskLevel,
      riskColor,
      feedback,
    });
  };

  const handleFullAnalysis = () => {
    navigate('/analise-perfil', {
      state: {
        semester: semester[0],
        weeklyStudyHours: studyHours,
        institutionType: institutionType,
      },
    });
  };

  return (
    <>
      <Helmet>
        <title>Calculadora de Chances - AmigoMeD!</title>
        <meta
          name='description'
          content='Calcule instantaneamente suas chances de transferência para medicina com base no seu perfil.'
        />
      </Helmet>
      <div className='py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className='text-center mb-12'>
              <Calculator className='h-16 w-16 text-cyan-600 mx-auto mb-4' />
              <h1 className='text-4xl font-bold text-gray-900'>
                Calculadora de Chances
              </h1>
              <p className='text-xl text-gray-600 mt-2'>
                Descubra suas chances de transferência em segundos.
              </p>
            </div>
          </motion.div>

          <div className='grid md:grid-cols-2 gap-8 items-start'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Insira seus dados</CardTitle>
                </CardHeader>
                <CardContent className='space-y-8 pt-4'>
                  <div>
                    <Label htmlFor='semester' className='flex justify-between'>
                      <span>Semestre Atual</span>
                      <span className='font-bold text-cyan-600'>
                        {semester[0]}º
                      </span>
                    </Label>
                    <Slider
                      id='semester'
                      min={1}
                      max={12}
                      step={1}
                      value={semester}
                      onValueChange={setSemester}
                    />
                  </div>
                  <div>
                    <Label htmlFor='gpa' className='flex justify-between'>
                      <span>Média Geral (GPA)</span>
                      <span className='font-bold text-cyan-600'>
                        {gpa[0].toFixed(1)}
                      </span>
                    </Label>
                    <Slider
                      id='gpa'
                      min={0}
                      max={10}
                      step={0.1}
                      value={gpa}
                      onValueChange={setGpa}
                    />
                  </div>
                  <div>
                    <Label htmlFor='studyHours'>Horas de Estudo Semanais</Label>
                    <Select value={studyHours} onValueChange={setStudyHours}>
                      <SelectTrigger id='studyHours'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='0-10'>0-10 horas</SelectItem>
                        <SelectItem value='10-20'>10-20 horas</SelectItem>
                        <SelectItem value='20-30'>20-30 horas</SelectItem>
                        <SelectItem value='30+'>Mais de 30 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='institutionType'>
                      Tipo de Instituição Alvo
                    </Label>
                    <Select
                      value={institutionType}
                      onValueChange={setInstitutionType}
                    >
                      <SelectTrigger id='institutionType'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Pública'>Pública</SelectItem>
                        <SelectItem value='Privada'>Privada</SelectItem>
                        <SelectItem value='Ambas'>Ambas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size='lg'
                    className='w-full'
                    onClick={calculateChances}
                  >
                    Calcular Minhas Chances
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className='bg-gradient-to-br from-cyan-50 to-blue-100'>
                    <CardHeader>
                      <CardTitle className='text-center text-2xl'>
                        Seu Resultado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='text-center space-y-6'>
                      <GaugeChart value={result.chance} />

                      <div className='space-y-2'>
                        <p className='text-lg font-semibold'>
                          Risco:{' '}
                          <span className={result.riskColor}>
                            {result.riskLevel}
                          </span>
                        </p>
                        <p className='text-gray-700 max-w-sm mx-auto'>
                          {result.feedback}
                        </p>
                      </div>

                      <div className='bg-white/70 p-4 rounded-lg'>
                        <p className='font-bold text-gray-800 mb-2'>
                          Potencialize seu Resultado!
                        </p>
                        <div className='flex justify-around items-center'>
                          <div className='text-center'>
                            <p className='text-sm text-gray-500'>Sua Chance</p>
                            <p className='text-2xl font-bold text-gray-700'>
                              {result.chance}%
                            </p>
                          </div>
                          <TrendingUp className='h-8 w-8 text-green-500' />
                          <div className='text-center'>
                            <p className='text-sm text-cyan-600'>
                              Com AmigoMeD!
                            </p>
                            <p className='text-2xl font-bold text-cyan-600'>
                              {result.chanceWithSupport}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        size='lg'
                        className='w-full bg-cyan-600 hover:bg-cyan-700'
                        onClick={handleFullAnalysis}
                      >
                        <Sparkles className='mr-2 h-5 w-5' /> Fazer Raio-X
                        Completo
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChancesCalculatorPage;
