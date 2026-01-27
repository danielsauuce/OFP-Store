import React from 'react';
import { Sparkles } from 'lucide-react';

const stats = [
  {
    value: '500+',
    label: 'Unique Pieces',
  },
  {
    value: '15+',
    label: 'Years Experience',
  },
  {
    value: '10k+',
    label: 'Happy Customers',
  },
];

const LeftPanelAuthPage = () => {
  const imgUrl = 'https://i.pinimg.com/1200x/de/8e/6c/de8e6cee6fb469054b917257e5149662.jpg';
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-cover bg-center ">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imgUrl})` }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/30 to-primary-dark/20" />

      {/* Decorative circle at the top */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-32 h-32 border border-gold/30 rounded-full animate-pulse border-4" />
        <div className="absolute bottom-40 right-20 w-24 h-24 border border-gold/20 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gold/10 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="flex items-center gap-3 mb-4 text-gold" />
            <span className="text-2xl font-serif font-bold">Olayinka</span>
          </div>
          <p className="text-primary-foreground/80 text-sm tracking-widest uppercase">
            Furniture Palace
          </p>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-serif font-bold leading-tight">
            Craft Your
            <br />
            <span className="text-gold">Perfect Space</span>
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Experience luxury furniture that transforms houses into homes. Each piece tells a story
            of craftsmanship and elegance.
          </p>

          {/* Features */}
          <div className="flex gap-8 pt-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-gold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanelAuthPage;
