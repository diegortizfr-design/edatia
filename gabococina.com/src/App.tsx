import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { CreationsGallery } from './components/CreationsGallery';
import { ServicesSection } from './components/ServicesSection';
import { PrivateDiningCalculator } from './components/PrivateDiningCalculator';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { DishModal } from './components/DishModal';
import { Dish } from './types';

export const App: React.FC = () => {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const handleOpenBooking = () => {
    const el = document.getElementById('cotizador');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectService = (serviceTitle: string) => {
    const el = document.getElementById('cotizador');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-noir-950 text-stone-200 flex flex-col font-sans selection:bg-gold-500 selection:text-noir-950">
      <Toaster position="top-right" />

      {/* Navigation */}
      <Navbar onOpenBooking={handleOpenBooking} />

      {/* Hero */}
      <Hero onOpenBooking={handleOpenBooking} />

      {/* About & Philosophy */}
      <AboutSection />

      {/* Creations Menu Gallery */}
      <CreationsGallery onSelectDish={(dish) => setSelectedDish(dish)} />

      {/* Services & Formats */}
      <ServicesSection onSelectService={handleSelectService} />

      {/* Interactive Event Calculator */}
      <PrivateDiningCalculator />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Contact & Date Booking */}
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* Dish Detail Modal */}
      <DishModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
      />
    </div>
  );
};
