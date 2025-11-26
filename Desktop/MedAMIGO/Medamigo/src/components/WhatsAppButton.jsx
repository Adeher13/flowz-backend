import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const handleClick = () => {
    // Futuramente será substituído pelo número real
    // window.open('https://wa.me/5511999999999?text=Olá, gostaria de mais informações!', '_blank');
    console.log('WhatsApp button clicked - número será adicionado futuramente');
  };

  return (
    <div className='fixed bottom-6 right-6 z-50 group'>
      {/* Ondas de pulso suaves */}
      <div className='absolute inset-0 rounded-full'>
        <span className='absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping-slow'></span>
        <span className='absolute inset-0 rounded-full bg-green-400 opacity-50 animate-ping-slower'></span>
      </div>

      {/* Botão principal */}
      <button
        onClick={handleClick}
        className='relative bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-full p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110'
        aria-label='Falar no WhatsApp'
      >
        <MessageCircle className='h-7 w-7' />

        {/* Tooltip elegante */}
        <span className='absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl'>
          Fale conosco no WhatsApp
          <span className='absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-gray-900'></span>
        </span>
      </button>

      <style>{`
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes ping-slower {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.2;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppButton;
