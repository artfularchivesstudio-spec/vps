// src/components/HeroSection.tsx
import { useState, useEffect } from 'react';
import Particles from './Particles';
import { Button } from './ui/Button';

interface HeroSectionProps {
  scrollToContent: () => void;
}

export default function HeroSection({ scrollToContent }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      console.log(window.scrollY);
      if (currentScrollY > 10) {
        console.log("setIsVisible == false");
        setIsVisible(false);
      } else {
        console.log("setIsVisible == true");
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleArrowClick = () => {
    console.log("handleArrowClick");
    scrollToContent();
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col items-center justify-center w-screen h-screen overflow-hidden bg-art-image">
        <Particles className="absolute inset-0 -z-10 animate-fade-in" quantity={100} />
      </div>
      <div className="absolute inset-0 bg-teal-700 bg-opacity-30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <h1 className="text-6xl font-light mb-4">Artful Archives Studio</h1>
        <p className="text-xl mb-8">Discovering Artists, and the messages inside their works</p>
        <Button 
          onClick={handleArrowClick}
          variant="outline"
        >
          Explore
        </Button>
      </div>
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
        onClick={handleArrowClick}
      >
        <svg className="w-8 h-8 text-white animate-bounce" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  );
}
