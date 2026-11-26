export interface Dish {
  id: string;
  name: string;
  subtitle: string;
  category: 'Entradas' | 'Platos Fuertes' | 'Postres' | 'Coctelería & Maridaje';
  description: string;
  story: string;
  ingredients: string[];
  pairing: string;
  image: string;
  tag?: string;
  prepTechnique: string;
}

export interface ExperienceService {
  id: string;
  title: string;
  tagline: string;
  description: string;
  courses: string;
  idealFor: string;
  features: string[];
  image: string;
  priceNote: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  occasion: string;
  quote: string;
  rating: number;
}
