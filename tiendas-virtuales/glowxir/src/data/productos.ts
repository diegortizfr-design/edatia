export interface Product {
  id: number
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: number
  precioAnterior?: number
  categoria: 'Pañalera & Cuidado' | 'Juguetería' | 'Ropa & Ajuares' | 'Baby Shower' | 'Revelación de Género' | 'Paseo & Habitación'
  genero?: 'Niño' | 'Niña' | 'Unisex'
  etapa?: string
  imagen: string
  imagenes?: string[]
  rating: number
  reviewsCount?: number
  stock: number
  esDestacado?: boolean
  esNovedad?: boolean
  esMayorista?: boolean
  detalles: string[]
  especificaciones?: { [key: string]: string }
}

export const CATEGORIAS_PRODUCTOS = [
  'Todos',
  'Pañalera & Cuidado',
  'Juguetería',
  'Ropa & Ajuares',
  'Baby Shower',
  'Revelación de Género',
  'Paseo & Habitación'
] as const

export const PRODUCTOS_BABY_WORLD: Product[] = [
  // --- REVELACIÓN DE GÉNERO ---
  {
    id: 1,
    nombre: "Kit Cañones de Humo Revelación de Género (Dúo Rosa / Azul)",
    descripcion: "Efecto de humo continuo de alta densidad y colores ultrabrillantes para una revelación mágica e inolvidable.",
    descripcionLarga: "Cañones de humo formulados con polvos de color 100% orgánicos, biodegradables y no tóxicos. El tubo viene con empaque neutro que oculta el color con código secreto para mantener la sorpresa absoluta hasta el gran momento. Duración de expulsión: 60 segundos continuos con explosión de color radiante.",
    precio: 55000,
    precioAnterior: 68000,
    categoria: "Revelación de Género",
    genero: "Unisex",
    etapa: "Fiesta / Evento",
    imagen: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 84,
    stock: 35,
    esDestacado: true,
    esNovedad: true,
    detalles: [
      "100% Biodegradable y no tóxico",
      "Empaque exterior 100% incógnito (código oculto)",
      "Disparo continuo de 60 segundos",
      "No mancha la ropa al sacudir"
    ],
    especificaciones: {
      "Contenido": "2 Tubos cañón de humo",
      "Colores": "Azul Celeste y Rosa Neón",
      "Seguridad": "Libre de pólvora y químicos irritantes"
    }
  },
  {
    id: 2,
    nombre: "Globo Gigante Revelación 36\" con Confeti y Mini Globos",
    descripcion: "Globo negro opaco extragrande de látex biodegradable con confeti metálico y mini globos para explotar.",
    descripcionLarga: "Globo negro mate extra grueso que garantiza cero visibilidad del color interior hasta el pinchazo. Incluye confeti circular brillante y polvo de color a elegir, cinta decorativa y alfiler temático con pompón para el estallido.",
    precio: 38000,
    precioAnterior: 45000,
    categoria: "Revelación de Género",
    genero: "Unisex",
    etapa: "Fiesta / Evento",
    imagen: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 52,
    stock: 28,
    esDestacado: true,
    detalles: [
      "Látex 100% opaco resistente",
      "Incluye confeti rosa y celeste",
      "Alfiler decorativo incluido",
      "Apto para inflar con helio o aire"
    ],
    especificaciones: {
      "Diámetro": "36 pulgadas (90 cm)",
      "Material": "Látex natural premium"
    }
  },
  {
    id: 3,
    nombre: "Kit Fiesta Gender Reveal: Pizarra de Votación + 50 Pines",
    descripcion: "Tablero interactivo 'Team Boy vs Team Girl' con pines decorativos para que los invitados voten su elección.",
    descripcionLarga: "Dinámica interactiva para Baby Shower o Gender Reveal. Incluye tablero rígido de alta resolución con atril de mesa, 25 pines metálicos esmaltados 'Team Niño' en azul pastel y 25 pines 'Team Niña' en rosa pastel con cierre de seguridad.",
    precio: 42000,
    categoria: "Revelación de Género",
    genero: "Unisex",
    etapa: "Fiesta / Evento",
    imagen: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 39,
    stock: 20,
    detalles: [
      "50 pines metálicos esmaltados",
      "Pizarra ilustrada con atril",
      "Guía de juegos y dinámicas incluida",
      "Recuerdo perfecto para fotos"
    ]
  },

  // --- BABY SHOWER & REGALOS ---
  {
    id: 4,
    nombre: "Torta de Pañales Temática 'Oso Soñador' 3 Pisos",
    descripcion: "Espectacular centro de mesa y regalo útil para Baby Shower con 60 pañales y accesorios esenciales.",
    descripcionLarga: "Creación artesanal premium elaborada con 60 pañales Huggies/Pampers Etapa 1, decorada con cintas de raso, peluche de apego hipoalergénico, toallitas faciales, manta térmica de algodón y tetero decorativo.",
    precio: 145000,
    precioAnterior: 165000,
    categoria: "Baby Shower",
    genero: "Unisex",
    etapa: "Recién Nacido",
    imagen: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 67,
    stock: 14,
    esDestacado: true,
    detalles: [
      "60 Pañales Etapa 1 de marca líder",
      "Peluche de oso hipoalergénico lavable",
      "Manta térmica extrasuave de microfibra",
      "Envuelto en papel celofán con lazo de lujo"
    ]
  },
  {
    id: 5,
    nombre: "Canasta de Bienvenida Newborn Luxury Box",
    descripcion: "Caja de madera personalizada con set completo de cuidado, ajuar 100% algodón y termómetro digital.",
    descripcionLarga: "El regalo soñado para futuros padres. Contiene 1 body cruzado algodón Pima, 1 pijama enteriza, 1 set de cortaúñas y cepillo de cerdas naturales para recién nacido, 1 loción de caléndula 200ml, 1 colonia sin alcohol y sonajero de madera Montessori.",
    precio: 189000,
    precioAnterior: 220000,
    categoria: "Baby Shower",
    genero: "Unisex",
    etapa: "0-3 Meses",
    imagen: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 43,
    stock: 12,
    esDestacado: true,
    detalles: [
      "Presentación en baúl de pino reutilizable",
      "Prendas en 100% algodón Pima peruano",
      "Cosmética hipoalergénica sin parabenos",
      "Tarjeta dedicatoria incluida"
    ]
  },

  // --- PAÑALERA & CUIDADO ---
  {
    id: 6,
    nombre: "Bulto Pañales Huggies Natural Care x120 Unidades (Etapa 1 a 5)",
    descripcion: "Pañal con tecnología de máxima absorción y suavidad tipo algodón. Suavidad extrema con burbujas protectoras.",
    descripcionLarga: "Pañales con absorción reforzada de hasta 12 horas de protección continua. Cuentan con indicador de humedad inteligente que cambia de color cuando es momento de cambiar al bebé, cintura elástica ultra-adaptable y barreras antifugas.",
    precio: 94000,
    precioAnterior: 110000,
    categoria: "Pañalera & Cuidado",
    genero: "Unisex",
    etapa: "Etapa 1 - 5",
    imagen: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 198,
    stock: 80,
    esDestacado: true,
    esMayorista: true,
    detalles: [
      "Presentación ahorro: 120 unidades",
      "Indicador de humedad con cambio de color",
      "Cintura anatómica libre de látex",
      "Hipoalergénico dermatológicamente probado"
    ],
    especificaciones: {
      "Etapas disponibles": "RN, Etapa 1 (2-5kg), Etapa 2 (5-7kg), Etapa 3 (7-10kg), Etapa 4 (10-13kg), Etapa 5 (+13kg)",
      "Horas de absorción": "Hasta 12 horas seco"
    }
  },
  {
    id: 7,
    nombre: "Pack Toallitas Húmedas 99% Agua Pura (Pack x6 Paquetes de 80 und)",
    descripcion: "Toallitas formuladas a base de agua purificada, extracto de manzanilla y libres de alcohol y fragancias.",
    descripcionLarga: "Cuidado delicado para la piel más sensible desde el primer día de vida. Suave textura acolchada con fibras de origen vegetal que limpian sin irritar la barrera cutánea del bebé.",
    precio: 49900,
    precioAnterior: 62000,
    categoria: "Pañalera & Cuidado",
    genero: "Unisex",
    etapa: "Todas las edades",
    imagen: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 112,
    stock: 95,
    esMayorista: true,
    detalles: [
      "Total 480 toallitas (6 paquetes de 80)",
      "99% Agua purificada en 7 filtros",
      "Sin alcohol, parabenos ni perfume sintético",
      "Tapa dispensadora Flip-Top hermética"
    ]
  },
  {
    id: 8,
    nombre: "Crema Antipañalitis Óxido de Zinc 40% + Caléndula (Pote 150g)",
    descripcion: "Barrera protectora instantánea que alivia y previene rozaduras severas desde la primera aplicación.",
    descripcionLarga: "Fórmula de máxima concentración médica de óxido de zinc enriquecida con aceite de almendras dulces y extracto orgánico de caléndula. Crea un escudo impermeable contra la acidez de la orina y heces.",
    precio: 28500,
    categoria: "Pañalera & Cuidado",
    genero: "Unisex",
    etapa: "Todas las edades",
    imagen: "https://images.unsplash.com/photo-1608248597359-009935e68337?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 76,
    stock: 45,
    detalles: [
      "40% Óxido de zinc terapéutico",
      "Alivio clínicamente probado en 6 horas",
      "Textura suave fácil de esparcir y limpiar",
      "Recomendada por la Sociedad Colombiana de Pediatría"
    ]
  },
  {
    id: 9,
    nombre: "Set de Biberones Anticólicos Natural Flow (Kit x3 con Válvula de Aire)",
    descripcion: "Biberones ergonómicos con tetina de silicona ultrasuave que imita el pecho materno y evita cólicos y reflujo.",
    descripcionLarga: "Sistema de ventilación interno que canaliza el aire hacia el fondo del tetero, evitando la ingesta de burbujas durante la toma. Libres de BPA y fáciles de esterilizar en microondas o agua hirviendo.",
    precio: 68000,
    precioAnterior: 82000,
    categoria: "Pañalera & Cuidado",
    genero: "Unisex",
    etapa: "0-12 Meses",
    imagen: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 88,
    stock: 30,
    detalles: [
      "Kit de 3 teteros: 4oz, 8oz y 9oz",
      "Tetina ergonómica flujo lento y medio",
      "100% Libre de BPA y Ftalatos",
      "Reduce cólicos, gases y regurgitaciones"
    ]
  },

  // --- JUGUETERÍA & ESTIMULACIÓN ---
  {
    id: 10,
    nombre: "Gimnasio Sensorial Piano Musical Kick & Play con Sonajeros",
    descripcion: "Manta acolchada con arco de estimulación visual y piano musical accionable con pataditas o manitas.",
    descripcionLarga: "Estimula el desarrollo motriz y sensorial del bebé desde los primeros meses. Cuenta con 5 juguetes colgantes desmontables (espejo de autodescubrimiento, mordedor de silicona, sonajero sonoro) y un piano de 4 teclas luminosas con más de 20 melodías alegres.",
    precio: 135000,
    precioAnterior: 160000,
    categoria: "Juguetería",
    genero: "Unisex",
    etapa: "0-18 Meses",
    imagen: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 142,
    stock: 22,
    esDestacado: true,
    detalles: [
      "Piano con 3 modos: notas, música y luces",
      "Colchoneta lavable en lavadora",
      "Arco de juguetes adaptable para jugar boca arriba o boca abajo",
      "Estimula coordinación ojo-mano y fuerza muscular"
    ]
  },
  {
    id: 11,
    nombre: "Móvil Musical de Cuna 360° con Proyector de Estrellas y Control",
    descripcion: "Móvil giratorio con animalitos de felpa desmontables, proyector de luces nocturnas y 45 nanas relajantes.",
    descripcionLarga: "Ayuda a conciliar el sueño del bebé con suaves melodías clásicas y sonidos de la naturaleza. El proyector ilumina el techo de la habitación con un cielo estrellado tenue.",
    precio: 115000,
    precioAnterior: 139000,
    categoria: "Juguetería",
    genero: "Unisex",
    etapa: "0-12 Meses",
    imagen: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 65,
    stock: 18,
    detalles: [
      "Giro suave y silencioso a 360 grados",
      "Temporizador de apagado automático a 20/40/60 min",
      "Proyección de galaxia de estrellas relajante",
      "Control remoto inalámbrico incluido"
    ]
  },
  {
    id: 12,
    nombre: "Set de Mordedores Sensoriales de Silicona Alimentaria (Pack x4)",
    descripcion: "Mordedores ergonómicos con texturas de masaje para calmar el dolor de encías en la etapa de dentición.",
    descripcionLarga: "Elaborados en 100% silicona de grado alimenticio apta para refrigerar. Sus diferentes relieves masajean suavemente las encías inflamadas, fáciles de agarrar por manitos pequeñas.",
    precio: 32000,
    categoria: "Juguetería",
    genero: "Unisex",
    etapa: "3-18 Meses",
    imagen: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 91,
    stock: 50,
    detalles: [
      "100% Silicona grado alimenticio libre de BPA",
      "Apto para refrigerador (calma fría)",
      "Fácil de desinfectar y hervir",
      "Diseño ergonómico anticaídas"
    ]
  },

  // --- ROPA & AJUARES ---
  {
    id: 13,
    nombre: "Ajuar Completo Primera Puesta 100% Algodón Pima (Set 5 Piezas)",
    descripcion: "Set de bienvenida para la clínica: body kimono, pantalón con piecitos, gorrito protector, mitones y babero.",
    descripcionLarga: "Confeccionado con el algodón Pima más suave del mundo, transpirable y sin costuras que rocen la delicada piel del recién nacido. Cierre con broches libres de níquel para cambios rápidos.",
    precio: 89000,
    precioAnterior: 105000,
    categoria: "Ropa & Ajuares",
    genero: "Unisex",
    etapa: "Recién Nacido (0-1M)",
    imagen: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=700&auto=format&fit=crop&q=80",
    rating: 5.0,
    reviewsCount: 110,
    stock: 35,
    esDestacado: true,
    detalles: [
      "100% Algodón Pima hipoalergénico",
      "Broches hipoalergénicos sin níquel",
      "Costuras planas que evitan rozaduras",
      "Colores neutros y pasteles para clínica"
    ]
  },
  {
    id: 14,
    nombre: "Pack x5 Bodies Manga Corta con Cuello Expandible de Algodón",
    descripcion: "Pack básico indispensable para el día a día, suave, elástico y resistente a múltiples lavadas.",
    descripcionLarga: "Bodies con hombros montados para colocarlos fácilmente de arriba a abajo o de abajo a arriba en caso de fugas del pañal. Diseños adorables con estampados al agua libres de plomo.",
    precio: 65000,
    precioAnterior: 78000,
    categoria: "Ropa & Ajuares",
    genero: "Unisex",
    etapa: "0-3M / 3-6M / 6-12M",
    imagen: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=700&auto=format&fit=crop&q=80",
    rating: 4.8,
    reviewsCount: 78,
    stock: 45,
    esMayorista: true,
    detalles: [
      "Pack surtido de 5 bodies estampados y lisos",
      "Algodón peinado de alto gramaje",
      "Hombros americanos deslizables",
      "Colores sólidos no destiñen"
    ]
  },
  {
    id: 15,
    nombre: "Mameluco Térmico con Capucha Orejitas de Osito Sherpa",
    descripcion: "Enterizo abrigador forrado en suave felpa tipo oveja, ideal para climas fríos y paseos nocturnos.",
    descripcionLarga: "Mantén a tu bebé calentito y cómodo como en una nube. Con cremallera completa de doble sentido desde el cuello hasta los piecitos para cambios de pañal rápidos sin desvestirlo.",
    precio: 72000,
    precioAnterior: 85000,
    categoria: "Ropa & Ajuares",
    genero: "Unisex",
    etapa: "0-6M / 6-12M",
    imagen: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 54,
    stock: 25,
    detalles: [
      "Doble capa térmica con forro interno de algodón",
      "Cremallera bidireccional con protector de barbilla",
      "Capucha con tiernas orejitas 3D",
      "Piecitos cerrados antideslizantes"
    ]
  },

  // --- PASEO & HABITACIÓN ---
  {
    id: 16,
    nombre: "Coche Paseador Ultracompacto Plegado Automático con 1 Mano",
    descripcion: "Coche ligero de aluminio aeroespacial apto desde recién nacido hasta los 22kg, ideal para viajes y cabina de avión.",
    descripcionLarga: "Máxima comodidad y practicidad para los padres. Se pliega de forma autónoma con presionar un botón en el manillar. Cuenta con arnés de 5 puntos, capota extensible con protección solar UV50+ y respaldo reclinable en múltiples posiciones hasta 175°.",
    precio: 490000,
    precioAnterior: 580000,
    categoria: "Paseo & Habitación",
    genero: "Unisex",
    etapa: "0 Meses a 4 Años",
    imagen: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=700&auto=format&fit=crop&q=80",
    rating: 4.9,
    reviewsCount: 88,
    stock: 10,
    esDestacado: true,
    detalles: [
      "Plegado ultra compacto con una sola mano",
      "Peso pluma: solo 6.2 kg",
      "Capota impermeable con filtro solar UPF 50+",
      "Canasta portaobjetos inferior de gran capacidad"
    ],
    especificaciones: {
      "Peso máximo soportado": "22 kg",
      "Dimensiones plegado": "52 x 44 x 22 cm (Apto cabina de avión)"
    }
  }
]
