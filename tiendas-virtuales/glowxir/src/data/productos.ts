export interface Product {
  id: number
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: number
  precioAnterior?: number
  categoria: 'Pañalera' | 'Juguetería' | 'Variedades'
  subcategoria?: string
  genero?: 'Niño' | 'Niña' | 'Unisex'
  etapa?: string
  imagen: string
  imagenes?: string[]
  rating: number
  reviewsCount?: number
  stock: number
  esDestacado?: boolean
  esOferta?: boolean
  esNovedad?: boolean
  detalles: string[]
  especificaciones?: { [key: string]: string }
}

export const CATEGORIAS_PRODUCTOS = [
  'Todos',
  'Pañalera',
  'Juguetería',
  'Variedades'
] as const

export const PRODUCTOS_BABY_WORLD: Product[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // 1. PAÑALERA & CUIDADO INFANTIL
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 101,
    nombre: "Pañales Huggies Natural Care Prematuro / RN (Pack x 60)",
    descripcion: "Máxima suavidad con extracto de algodón para proteger la delicada piel del recién nacido.",
    descripcionLarga: "Diseñado especialmente para la piel más sensible del bebé en sus primeros meses. Cuenta con tecnología de absorción 3D que encapsula líquidos al instante, corte especial para el cordón umbilical e indicador de humedad inteligente.",
    precio: 48900,
    precioAnterior: 56000,
    categoria: "Pañalera",
    subcategoria: "Pañales",
    etapa: "Recién Nacido (RN)",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 142,
    stock: 45,
    esDestacado: true,
    esOferta: true,
    detalles: [
      "Fibras naturales libres de fragancias y parabenos",
      "Corte especial para proteger el ombligo del recién nacido",
      "Indicador de humedad que cambia de color",
      "Barreras antifugas anatómicas reforzadas"
    ],
    especificaciones: {
      "Presentación": "Paquete x 60 unidades",
      "Etapa": "Recién Nacido (Hasta 4.5 kg)",
      "Material": "Algodón hipoalergénico dermatológicamente probado"
    }
  },
  {
    id: 102,
    nombre: "Pañales Winny Sensitive Etapa 1 (Mega Pack x 90)",
    descripcion: "Absorción ultra-rápida hasta por 12 horas con cubierta hipoalergénica de sábila.",
    descripcionLarga: "El pañal preferido de las mamás en Colombia. Con capa súper absorbente Dual Sec que mantiene la piel seca y fresca, cintas elásticas reposicionables y extracto de aloe vera que previene irritaciones y pañalitis.",
    precio: 64500,
    precioAnterior: 72000,
    categoria: "Pañalera",
    subcategoria: "Pañales",
    etapa: "Etapa 1 (3.5 a 6 kg)",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 210,
    stock: 60,
    esDestacado: true,
    detalles: [
      "Hasta 12 horas de protección continua día y noche",
      "Cubierta con extracto natural de Sábila y Vitamina E",
      "Cintas pega y despega ultra-flexibles",
      "Ajuste anatómico que evita derrames de popó líquida"
    ],
    especificaciones: {
      "Presentación": "Mega Pack x 90 pañales",
      "Etapa": "Etapa 1 (3.5 a 6 kg)",
      "Marca": "Winny Sensitive"
    }
  },
  {
    id: 103,
    nombre: "Pañales Pampers Premium Care Etapa 2 (Pack x 72)",
    descripcion: "La máxima protección suave como algodón con canales de aire transpirables.",
    descripcionLarga: "Protección 5 estrellas para la piel del bebé. Contiene micro-perlas absorbentes que atrapan la humedad al fondo del pañal y loción hipoalergénica que ayuda a prevenir rozaduras graves.",
    precio: 68000,
    precioAnterior: 76500,
    categoria: "Pañalera",
    subcategoria: "Pañales",
    etapa: "Etapa 2 (5 a 8 kg)",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 98,
    stock: 30,
    esDestacado: false,
    esOferta: true,
    detalles: [
      "Canales de aire para piel fresca y ventilada",
      "Loción protectora hipoalergénica integrada",
      "Ajuste ultra cómodo 360°",
      "Dermatológicamente testeado"
    ],
    especificaciones: {
      "Presentación": "Pack x 72 unidades",
      "Etapa": "Etapa 2 (5 a 8 kg)",
      "Marca": "Pampers Premium Care"
    }
  },
  {
    id: 104,
    nombre: "Toallitas Húmedas Winny Aloe Vera y Manzanilla (Pack x 3 x 80 und)",
    descripcion: "Toallitas extra gruesas sin alcohol con aroma calmante y fórmula hipoalergénica.",
    descripcionLarga: "Pack ahorro de 240 toallitas húmedas con tela suave y acolchada. Enriquecidas con agua pura, extracto de manzanilla relajante y aloe vera para una limpieza profunda sin frotar agresivamente.",
    precio: 29900,
    precioAnterior: 36000,
    categoria: "Pañalera",
    subcategoria: "Aseo & Cuidado",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 315,
    stock: 85,
    esDestacado: true,
    detalles: [
      "Fórmula 99% a base de agua purificada",
      "0% Alcohol etílico, parabenos y fenoxietanol",
      "Tapa dispensadora Flip-Top que mantiene la humedad",
      "Textura suave de algodón acolchado"
    ],
    especificaciones: {
      "Contenido": "Tripack (3 paquetes de 80 und = 240 toallitas)",
      "Fragancia": "Suave Manzanilla & Aloe",
      "Uso": "Cuerpo, carita y zona del pañal"
    }
  },
  {
    id: 105,
    nombre: "Crema Antipañalitis Desitin Máxima Protección Pote 454g",
    descripcion: "Fórmula líder pediátrica con 40% de óxido de zinc para alivio y prevención inmediata.",
    descripcionLarga: "Crea una barrera protectora espesa e impenetrable que aísla la humedad del pañal desde la primera aplicación. Calma el enrojecimiento, ardor y repara la barrera cutánea de forma clínicamente comprobada.",
    precio: 52000,
    precioAnterior: 59000,
    categoria: "Pañalera",
    subcategoria: "Aseo & Cuidado",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 164,
    stock: 40,
    esDestacado: true,
    detalles: [
      "40% Óxido de Zinc de grado médico",
      "Alivio clínicamente demostrado en menos de 12 horas",
      "Hipoalergénico y libre de colorantes artificiales",
      "Rinde meses de aplicación diaria"
    ],
    especificaciones: {
      "Presentación": "Pote de 454 gramos (16 oz)",
      "Tipo": "Protección Máxima Púrpura",
      "Uso": "Cada cambio de pañal"
    }
  },
  {
    id: 106,
    nombre: "Biberón Anticólicos Philips Avent Natural 260ml / 9oz",
    descripcion: "Tetina ergonómica en espiral con válvula anticólicos para alimentación natural y sin gases.",
    descripcionLarga: "Facilita la transición natural entre el pecho materno y el biberón. Su tetina ancha y ultra suave imita la forma y sensación del seno materno, reduciendo el cólico y reflujo en un 80%.",
    precio: 44000,
    precioAnterior: 51000,
    categoria: "Pañalera",
    subcategoria: "Alimentación",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 88,
    stock: 25,
    esDestacado: false,
    detalles: [
      "100% Libre de BPA y ftalatos",
      "Válvula anticólicos integrada en la tetina",
      "Fácil de lavar y esterilizar con cuello ancho",
      "Flujo medio regulado para 1m+"
    ],
    especificaciones: {
      "Capacidad": "260 ml / 9 onzas",
      "Material": "Polipropileno libre de BPA + Silicona médica",
      "Marca": "Philips Avent Natural"
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. JUGUETERÍA & ESTIMULACIÓN TEMPRANA
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 201,
    nombre: "Gimnasio de Estimulación Piano Pataditas Deluxe",
    descripcion: "Alfombra acolchada interactiva con piano musical sensible al tacto y 5 juguetes colgantes.",
    descripcionLarga: "Estimula el desarrollo motor, visual y auditivo del bebé desde los 0 meses. Incluye piano musical extraíble con 4 modos de juego, luces relajantes, espejo irrompible y sonajeros de diferentes texturas sensoriales.",
    precio: 135000,
    precioAnterior: 165000,
    categoria: "Juguetería",
    subcategoria: "Gimnasios & Tapetes",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 112,
    stock: 18,
    esDestacado: true,
    esOferta: true,
    detalles: [
      "Piano desmontable para usar acostado, sentado o de pie",
      "Melodías clásicas y sonidos de animales estimulantes",
      "Tapete ultra-acolchado lavable en lavadora",
      "Estructura segura con bordes suaves anti-golpes"
    ],
    especificaciones: {
      "Dimensiones": "75 cm x 60 cm x 45 cm",
      "Edad recomendada": "0 a 24 meses",
      "Baterías": "Usa 3 pilas AA (incluidas)"
    }
  },
  {
    id: 202,
    nombre: "Set de 6 Sonajeros & Mordedores Sensoriales en Silicona",
    descripcion: "Juguetes ergonómicos libres de BPA con texturas de masaje para aliviar la dentición.",
    descripcionLarga: "Set completo diseñado para que las manitas del bebé agarren con facilidad. Fabricado en silicona de grado alimenticio 100% segura para morder, con cascabeles internos suaves y colores pastel estimulantes.",
    precio: 38000,
    precioAnterior: 48000,
    categoria: "Juguetería",
    subcategoria: "Mordedores & Sonajeros",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 76,
    stock: 35,
    esDestacado: true,
    detalles: [
      "Silicona médica 100% libre de BPA y toxinas",
      "Se pueden enfriar en nevera para alivio de encías inflamadas",
      "Esterilizables con agua hirviendo sin deformarse",
      "Incluye práctico estuche contenedor para viajes"
    ],
    especificaciones: {
      "Contenido": "6 piezas de diferentes formas y texturas + caja",
      "Material": "Silicona grado alimenticio y ABS no tóxico",
      "Edad": "3 a 18 meses"
    }
  },
  {
    id: 203,
    nombre: "Caminador Interactivo 2 en 1 Primeros Pasos con Sonidos",
    descripcion: "Andadera con freno de seguridad, panel didáctico extraíble, luces y engranajes.",
    descripcionLarga: "Acompaña a tu bebé desde que aprende a sentarse hasta que da sus primeros pasos firmes y seguros. Cuenta con ruedas con tracción antideslizante, ajuste de velocidad y panel de actividades con figuras geométricas y música.",
    precio: 159000,
    precioAnterior: 185000,
    categoria: "Juguetería",
    subcategoria: "Caminadores & Andaderas",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 64,
    stock: 12,
    esDestacado: false,
    esNovedad: true,
    detalles: [
      "Sistema de freno y peso ajustable con agua en la base",
      "Ruedas con banda de goma antideslizante",
      "Panel de juego desmontable para llevar en el auto",
      "Desarrolla el equilibrio, coordinación y motricidad gruesa"
    ],
    especificaciones: {
      "Material": "Polipropileno de alta resistencia anti-impactos",
      "Edad": "6 a 30 meses",
      "Certificación": "Cumple norma de seguridad infantil ASTM"
    }
  },
  {
    id: 204,
    nombre: "Peluche Relajante Musical Nutria Dulces Sueños",
    descripcion: "Suave peluche con movimiento rítmico de respiración, luces tenues y música calmante.",
    descripcionLarga: "El compañero perfecto para dormir a tu bebé. Imita el movimiento rítmico de respiración y latidos del corazón de mamá para calmar el llanto, cólicos y ansiedad nocturna de forma natural.",
    precio: 75000,
    precioAnterior: 92000,
    categoria: "Juguetería",
    subcategoria: "Peluches & Sueño",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 195,
    stock: 22,
    esDestacado: true,
    detalles: [
      "Movimiento suave de respiración que sube y baja",
      "Hasta 30 minutos de música relajante y ruido blanco",
      "Peluche extra suave lavable a máquina (extrayendo el módulo)",
      "Luz nocturna cálida en el pechito"
    ],
    especificaciones: {
      "Material": "Felpa hipoalergénica súper suave",
      "Edad": "0 meses en adelante",
      "Funciones": "Música, latidos, respiración y luz tenue"
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. VARIEDADES & ROPA / ACCESORIOS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 301,
    nombre: "Ajuar Completo 5 Piezas 100% Algodón Pima Recién Nacido",
    descripcion: "Set suave que incluye mameluco, saquito, pantalón con pies, gorrito y manoplas.",
    descripcionLarga: "El primer conjunto perfecto para la salida de la clínica. Elaborado en algodón peruano ultra-suave y transpirable, con broches libres de níquel para evitar alergias en la piel recién nacida.",
    precio: 62000,
    precioAnterior: 75000,
    categoria: "Variedades",
    subcategoria: "Ropa & Ajuares",
    genero: "Unisex",
    etapa: "0 a 3 Meses",
    imagen: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 130,
    stock: 28,
    esDestacado: true,
    esOferta: true,
    detalles: [
      "100% Algodón Pima hipoalergénico de fibra larga",
      "Broches a presión suaves sin níquel",
      "Costuras planas hacia afuera para no marcar la piel",
      "Diseño unisex en tonos marfil y beige pastel"
    ],
    especificaciones: {
      "Piezas": "Mameluco, pantalón con pie, saquito, gorrito y manoplas",
      "Talla": "0 a 3 meses (RN)",
      "Lavado": "Apto para lavadora en ciclo delicado"
    }
  },
  {
    id: 302,
    nombre: "Cobija Térmica Ovejera Piel de Ángel con Capota de Osito",
    descripcion: "Manta ultra térmica con forro ovejero interior y textura aterciopelada exterior.",
    descripcionLarga: "Mantiene al bebé abrigado y protegido del frío en cualquier clima. Suave al tacto como una caricia, ligera, no bota motas ni pelo y viene con tierna capota bordada de orejitas.",
    precio: 42000,
    precioAnterior: 52000,
    categoria: "Variedades",
    subcategoria: "Cobijas & Músicas",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 155,
    stock: 50,
    esDestacado: true,
    detalles: [
      "Forro interior en sherpa ovejero térmico",
      "Exterior en piel de ángel suave antialérgica",
      "Capota protectora para cubrir cabecita y orejas",
      "Tamaño generoso para cuna, coche o brazos"
    ],
    especificaciones: {
      "Medidas": "100 cm x 80 cm",
      "Material": "Microfibra térmica hipoalergénica",
      "Colores": "Gris perla, Rosa pastel, Azul nube y Beige"
    }
  },
  {
    id: 303,
    nombre: "Set de 4 Baberos Bandana Absorbentes en Algodón Orgánico",
    descripcion: "Baberos tipo pañoleta con doble capa absorbente y broches ajustables para baba y comida.",
    descripcionLarga: "Protege la ropa del bebé de la humedad causada por la dentición y el reflujo. Parte delantera en algodón orgánico estampado y parte trasera en forro polar súper absorbente.",
    precio: 26000,
    precioAnterior: 32000,
    categoria: "Variedades",
    subcategoria: "Accesorios",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 92,
    stock: 45,
    esDestacado: false,
    detalles: [
      "Doble capa: Algodón frontal + vellón polar absorbente",
      "2 Broches a presión que se adaptan al crecimiento del cuello",
      "Estilos modernos y tiernos que combinan con cualquier ropa",
      "Evita que el pecho del bebé permanezca mojado"
    ],
    especificaciones: {
      "Contenido": "Pack de 4 baberos con diseños surtidos",
      "Edad": "0 a 24 meses",
      "Material": "100% Algodón orgánico"
    }
  },
  {
    id: 304,
    nombre: "Kit de Aseo & Cuidado Médico 8 Piezas para Bebé",
    descripcion: "Estuche completo con cortaúñas de seguridad, tijeritas redondas, cepillo suave, termómetro y aspirador nasal.",
    descripcionLarga: "Todo lo que los padres necesitan para el cuidado diario y salud de su pequeño en un solo estuche compacto e higiénico. Herramientas diseñadas con puntas redondeadas y materiales libres de tóxicos.",
    precio: 36000,
    precioAnterior: 45000,
    categoria: "Variedades",
    subcategoria: "Higiene & Salud",
    genero: "Unisex",
    imagen: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 118,
    stock: 32,
    esDestacado: false,
    esNovedad: true,
    detalles: [
      "Tijeras y cortaúñas con bordes de seguridad anti-cortes",
      "Cepillo de cerdas ultra suaves para el cuero cabelludo",
      "Aspirador nasal ergonómico de succión suave",
      "Estuche con cremallera ideal para bolso pañalera"
    ],
    especificaciones: {
      "Piezas": "8 herramientas esenciales + estuche",
      "Material": "Acero inoxidable quirúrgico y silicona libre de BPA"
    }
  }
]
