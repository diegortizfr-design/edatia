export interface Product {
  id: number
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: number
  categoria: 'Labios' | 'Rostro' | 'Ojos' | 'Accesorios'
  imagen: string
  rating: number
  stock: number
  detalles: string[]
}

export const PRODUCTOS: Product[] = [
  {
    id: 1,
    nombre: "Labial Líquido Mate Velvet",
    descripcion: "Labial mate de alta pigmentación y larga duración sin resecar.",
    descripcionLarga: "Fórmula ultrapigmentada que se desliza como un gloss y se seca dejando un acabado mate aterciopelado impecable. Enriquecido con vitamina E y aceite de aguacate para mantener tus labios hidratados hasta por 12 horas.",
    precio: 45000,
    categoria: "Labios",
    imagen: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    stock: 24,
    detalles: ["Acabado mate de larga duración", "Enriquecido con Vitamina E", "No transfiere", "Cruelty-free"]
  },
  {
    id: 2,
    nombre: "Base Hidratante Silk Glow",
    descripcion: "Base fluida con cobertura media y acabado luminoso y natural.",
    descripcionLarga: "Consigue una piel radiante y uniforme al instante. Su fórmula ligera se funde con la piel, hidratando y difuminando imperfecciones para un acabado satinado que dura todo el día.",
    precio: 78000,
    categoria: "Rostro",
    imagen: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    stock: 15,
    detalles: ["Acabado luminoso", "Cobertura construible media a total", "Protección SPF 15", "Hipoalergénico"]
  },
  {
    id: 3,
    nombre: "Paleta de Sombras Sunset Bloom",
    descripcion: "Paleta con 12 tonos cálidos altamente mezclables en acabados mate y shimmer.",
    descripcionLarga: "Inspirada en los atardeceres mágicos, esta paleta ofrece 12 sombras de alta calidad que van desde tonos tierra neutros hasta corales vibrantes y brillos dorados deslumbrantes.",
    precio: 95000,
    categoria: "Ojos",
    imagen: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
    rating: 4.7,
    stock: 10,
    detalles: ["12 tonos de alta pigmentación", "Fórmula de fácil difuminado", "Espejo integrado de gran tamaño", "Vegano"]
  },
  {
    id: 4,
    nombre: "Rubor en Crema Dewy Petal",
    descripcion: "Rubor en crema sedoso que aporta un rubor natural y jugoso a las mejillas.",
    descripcionLarga: "Fórmula innovadora que se transforma de crema a polvo al contacto con la piel. Su textura ligera y traslúcida se aplica de forma uniforme, dejando un aspecto saludable y fresco en el rostro.",
    precio: 38000,
    categoria: "Rostro",
    imagen: "https://images.unsplash.com/photo-1590156546746-c2240b5287bc?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    stock: 18,
    detalles: ["Fórmula crema a polvo", "Acabado dewy ultra natural", "Aplicación sencilla con dedos o brocha", "Larga duración"]
  },
  {
    id: 5,
    nombre: "Pestañina Volumen Infinito Lash Up",
    descripcion: "Máscara de pestañas para un volumen dramático y definición extrema sin grumos.",
    descripcionLarga: "Consigue pestañas visiblemente más largas y gruesas. Su cepillo de elastómero abraza cada pestaña desde la raíz hasta la punta, peinándolas y levantándolas al instante.",
    precio: 42000,
    categoria: "Ojos",
    imagen: "https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=600&auto=format&fit=crop&q=80",
    rating: 4.8,
    stock: 30,
    detalles: ["Volumen dramático e inmediato", "Cepillo de alta definición", "Fórmula resistente al agua", "Adecuada para ojos sensibles"]
  },
  {
    id: 6,
    nombre: "Kit de Brochas Profesionales Velvet Touch",
    descripcion: "Set de 8 brochas de fibra sintética extrasuave con estuche de viaje.",
    descripcionLarga: "El kit definitivo para un maquillaje profesional en casa. Incluye brochas para base, polvos, rubor y difuminadores de sombras, elaboradas con cerdas de alta densidad que no absorben producto de más.",
    precio: 120000,
    categoria: "Accesorios",
    imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    rating: 4.9,
    stock: 12,
    detalles: ["Cerdas sintéticas extrasuaves de alta densidad", "Mangos ergonómicos de madera sostenible", "Estuche premium de cuero ecológico", "Hipoalergénicas"]
  }
]
