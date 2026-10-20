-- ====================================================================
-- IMPORTACIÓN DE PAÑALES Y LECHES (PRODUCCIÓN: SOLO INVENTARIO / publicadoWeb = false)
-- Total productos: 24
-- Generado: 2026-10-20T01:29:39.530Z
-- ====================================================================

DO $$
DECLARE
  v_empresa_id INT;
  v_cat_panales_id INT;
  v_cat_alimentacion_id INT;
BEGIN
  -- 1. Obtener ID de empresa de distribuidorababyworld
  SELECT "empresaId" INTO v_empresa_id FROM "ConfiguracionTienda" WHERE "slugTienda" = 'distribuidorababyworld' LIMIT 1;
  IF v_empresa_id IS NULL THEN
    SELECT id INTO v_empresa_id FROM "Empresa" LIMIT 1;
  END IF;

  -- 2. Asegurar o resolver categoría Pañales
  SELECT id INTO v_cat_panales_id FROM "Categoria" WHERE "empresaId" = v_empresa_id AND nombre ILIKE '%Pañales%' LIMIT 1;
  IF v_cat_panales_id IS NULL THEN
    INSERT INTO "Categoria" ("empresaId", "nombre", "slug", "activo", "createdAt", "updatedAt")
    VALUES (v_empresa_id, 'Pañales y Cuidado', 'panales-y-cuidado', true, NOW(), NOW())
    RETURNING id INTO v_cat_panales_id;
  END IF;

  -- 3. Asegurar o resolver categoría Alimentación
  SELECT id INTO v_cat_alimentacion_id FROM "Categoria" WHERE "empresaId" = v_empresa_id AND nombre ILIKE '%Alimentación%' LIMIT 1;
  IF v_cat_alimentacion_id IS NULL THEN
    INSERT INTO "Categoria" ("empresaId", "nombre", "slug", "activo", "createdAt", "updatedAt")
    VALUES (v_empresa_id, 'Alimentación', 'alimentacion', true, NOW(), NOW())
    RETURNING id INTO v_cat_alimentacion_id;
  END IF;

  -- SKU: PAN-014-XXG | Pañales Winny Pants Etapa 5 XXG x 50 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-014-XXG') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Pants Etapa 5 XXG x 50 Und',
      descripcion = 'Pañales desechables tipo calzoncito Winny Pants Etapa 5 XXG, paquete por 50 unidades. Para bebés de más de 14 kg.',
      "descripcionWeb" = 'Los pañales Winny Pants Etapa 5 XXG ofrecen la máxima comodidad y absorción para tu bebé. Diseñados como ropita interior para facilitar la transición y el cambio. Cuentan con ultra absorción, cintura elástica y fibra natural para cuidar la piel delicada de tu pequeño, evitando filtraciones por más tiempo.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459458/distribuidorababyworld/panales_y_leches/PAN-014-XXG-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459458/distribuidorababyworld/panales_y_leches/PAN-014-XXG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459462/distribuidorababyworld/panales_y_leches/PAN-014-XXG-2.png"],"detalles":["Diseño tipo calzoncito fácil de subir y bajar","Ultra absorbentes para mayor protección","Con fibra natural para el cuidado de la piel","Para bebés de más de 14 kg / Over 30 lbs","Paquete económico por 50 unidades"],"marca":"Winny","presentacion":"Paquete x 50 pañales","etapaTalla":"Etapa 5 / Talla XXG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-014-XXG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-014-XXG', 'Pañales Winny Pants Etapa 5 XXG x 50 Und', 'Pañales desechables tipo calzoncito Winny Pants Etapa 5 XXG, paquete por 50 unidades. Para bebés de más de 14 kg.', 'Los pañales Winny Pants Etapa 5 XXG ofrecen la máxima comodidad y absorción para tu bebé. Diseñados como ropita interior para facilitar la transición y el cambio. Cuentan con ultra absorción, cintura elástica y fibra natural para cuidar la piel delicada de tu pequeño, evitando filtraciones por más tiempo.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459458/distribuidorababyworld/panales_y_leches/PAN-014-XXG-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-pants-etapa-5-xxg-x-50-und-pan-014-xxg', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459458/distribuidorababyworld/panales_y_leches/PAN-014-XXG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459462/distribuidorababyworld/panales_y_leches/PAN-014-XXG-2.png"],"detalles":["Diseño tipo calzoncito fácil de subir y bajar","Ultra absorbentes para mayor protección","Con fibra natural para el cuidado de la piel","Para bebés de más de 14 kg / Over 30 lbs","Paquete económico por 50 unidades"],"marca":"Winny","presentacion":"Paquete x 50 pañales","etapaTalla":"Etapa 5 / Talla XXG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-015-L | Pañales Winny Confort Talla L x 80 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-015-L') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Confort Talla L x 80 Und',
      descripcion = 'Pañales Winny Confort Talla L con hasta 12 horas de absorción, indicador de humedad y diseño anatómico.',
      "descripcionWeb" = 'Los pañales Winny Confort en Talla L ofrecen la máxima protección y comodidad para tu bebé. Cuentan con un sistema ultra-absorbente que retiene y gelatiniza la orina, manteniendo la piel de tu pequeño seca hasta por 12 horas. Su diseño anatómico incluye barreras altas antifugas, cintas y cintura elastizadas para un ajuste perfecto, y una cubierta tipo tela supersuave con indicador de humedad que cambia de color para avisarte el momento del cambio.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459475/distribuidorababyworld/panales_y_leches/PAN-015-L-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459475/distribuidorababyworld/panales_y_leches/PAN-015-L-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459479/distribuidorababyworld/panales_y_leches/PAN-015-L-2.png"],"detalles":["Hasta 12 horas de absorción con sistema que gelatiniza la orina","Barreras altas y cómodas para prevenir filtraciones","Cintas y cintura elastizadas con sistema pega-despega","Indicador de humedad que cambia a color azul al orinar","Cubierta tipo tela con diseños, abullonada y supersuave"],"marca":"Winny","presentacion":"Paquete x 80 pañales","etapaTalla":"Talla L","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-015-L';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-015-L', 'Pañales Winny Confort Talla L x 80 Und', 'Pañales Winny Confort Talla L con hasta 12 horas de absorción, indicador de humedad y diseño anatómico.', 'Los pañales Winny Confort en Talla L ofrecen la máxima protección y comodidad para tu bebé. Cuentan con un sistema ultra-absorbente que retiene y gelatiniza la orina, manteniendo la piel de tu pequeño seca hasta por 12 horas. Su diseño anatómico incluye barreras altas antifugas, cintas y cintura elastizadas para un ajuste perfecto, y una cubierta tipo tela supersuave con indicador de humedad que cambia de color para avisarte el momento del cambio.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459475/distribuidorababyworld/panales_y_leches/PAN-015-L-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-confort-talla-l-x-80-und-pan-015-l', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459475/distribuidorababyworld/panales_y_leches/PAN-015-L-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459479/distribuidorababyworld/panales_y_leches/PAN-015-L-2.png"],"detalles":["Hasta 12 horas de absorción con sistema que gelatiniza la orina","Barreras altas y cómodas para prevenir filtraciones","Cintas y cintura elastizadas con sistema pega-despega","Indicador de humedad que cambia a color azul al orinar","Cubierta tipo tela con diseños, abullonada y supersuave"],"marca":"Winny","presentacion":"Paquete x 80 pañales","etapaTalla":"Talla L","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-016-XXXG | Pañales Winny Pants Talla XXXG x 30 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-016-XXXG') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Pants Talla XXXG x 30 Und',
      descripcion = 'Pañales tipo calzón Winny Pants Talla XXXG para más de 16 Kg. Paquete por 30 unidades con alta absorción.',
      "descripcionWeb" = 'Los pañales Winny Pants en presentación Talla XXXG ofrecen máxima comodidad y absorción para niños de más de 16 kg. Su diseño tipo calzón facilita el cambio rápido y práctico, adaptándose perfectamente a los movimientos del bebé. Cuentan con ultra absorción y fibra natural para cuidar la piel delicada, brindando seguridad y protección contra filtraciones durante todo el día y la noche.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459490/distribuidorababyworld/panales_y_leches/PAN-016-XXXG-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459490/distribuidorababyworld/panales_y_leches/PAN-016-XXXG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459493/distribuidorababyworld/panales_y_leches/PAN-016-XXXG-2.png"],"detalles":["Diseño tipo calzón (Pants) para fácil colocación","Ultra absorbente para mayor protección","Con fibra natural para el cuidado de la piel","Indicado para bebés de más de 16 kg","Paquete económico por 30 unidades"],"marca":"Winny","presentacion":"Paquete x 30 pañales","etapaTalla":"Talla XXXG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-016-XXXG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-016-XXXG', 'Pañales Winny Pants Talla XXXG x 30 Und', 'Pañales tipo calzón Winny Pants Talla XXXG para más de 16 Kg. Paquete por 30 unidades con alta absorción.', 'Los pañales Winny Pants en presentación Talla XXXG ofrecen máxima comodidad y absorción para niños de más de 16 kg. Su diseño tipo calzón facilita el cambio rápido y práctico, adaptándose perfectamente a los movimientos del bebé. Cuentan con ultra absorción y fibra natural para cuidar la piel delicada, brindando seguridad y protección contra filtraciones durante todo el día y la noche.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459490/distribuidorababyworld/panales_y_leches/PAN-016-XXXG-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-pants-talla-xxxg-x-30-und-pan-016-xxxg', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459490/distribuidorababyworld/panales_y_leches/PAN-016-XXXG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459493/distribuidorababyworld/panales_y_leches/PAN-016-XXXG-2.png"],"detalles":["Diseño tipo calzón (Pants) para fácil colocación","Ultra absorbente para mayor protección","Con fibra natural para el cuidado de la piel","Indicado para bebés de más de 16 kg","Paquete económico por 30 unidades"],"marca":"Winny","presentacion":"Paquete x 30 pañales","etapaTalla":"Talla XXXG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-017-SEC | Pañales Winny Sec y Confort
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-017-SEC') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Sec y Confort',
      descripcion = 'Pañales Winny con sistema cushion de absorción y distribución rápida, cintas elásticas y cubiertas suaves para proteger la piel del bebé.',
      "descripcionWeb" = 'Los pañales Winny ofrecen la máxima protección y comodidad para tu bebé. Cuentan con un sistema Cushion que absorbe y distribuye el líquido rápidamente, manteniendo la piel seca y previniendo irritaciones. Sus cintas y cintura elásticas brindan un ajuste perfecto, mientras que las barreras altas previenen filtraciones. Incluyen indicador de humedad y telas suaves que cuidan la delicada piel de tu pequeño.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459502/distribuidorababyworld/panales_y_leches/PAN-017-SEC-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459502/distribuidorababyworld/panales_y_leches/PAN-017-SEC-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459505/distribuidorababyworld/panales_y_leches/PAN-017-SEC-2.png"],"detalles":["Sistema Cushion que absorbe y distribuye más rápido la orina","Cintas y cintura elásticas para garantizar un mejor ajuste","Barreras altas y cómodas para prevenir filtraciones","Indicador de humedad que cambia de color azul cuando es hora de cambiar","Cubierta y telas suaves con diseño anatómico"],"marca":"Winny","presentacion":"Paquete de pañales desechables","etapaTalla":"Varias tallas","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-017-SEC';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-017-SEC', 'Pañales Winny Sec y Confort', 'Pañales Winny con sistema cushion de absorción y distribución rápida, cintas elásticas y cubiertas suaves para proteger la piel del bebé.', 'Los pañales Winny ofrecen la máxima protección y comodidad para tu bebé. Cuentan con un sistema Cushion que absorbe y distribuye el líquido rápidamente, manteniendo la piel seca y previniendo irritaciones. Sus cintas y cintura elásticas brindan un ajuste perfecto, mientras que las barreras altas previenen filtraciones. Incluyen indicador de humedad y telas suaves que cuidan la delicada piel de tu pequeño.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459502/distribuidorababyworld/panales_y_leches/PAN-017-SEC-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-sec-y-confort-pan-017-sec', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459502/distribuidorababyworld/panales_y_leches/PAN-017-SEC-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459505/distribuidorababyworld/panales_y_leches/PAN-017-SEC-2.png"],"detalles":["Sistema Cushion que absorbe y distribuye más rápido la orina","Cintas y cintura elásticas para garantizar un mejor ajuste","Barreras altas y cómodas para prevenir filtraciones","Indicador de humedad que cambia de color azul cuando es hora de cambiar","Cubierta y telas suaves con diseño anatómico"],"marca":"Winny","presentacion":"Paquete de pañales desechables","etapaTalla":"Varias tallas","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-001-250 | Cereal Infantil Nestum Arroz Nestlé Caja x 250g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-001-250') THEN
    UPDATE "Producto" SET
      nombre = 'Cereal Infantil Nestum Arroz Nestlé Caja x 250g',
      descripcion = 'Cereal infantil Nestum Arroz con probiótico Bifidus BL, vitaminas y minerales para bebés.',
      "descripcionWeb" = 'Cereal infantil Nestum Arroz ideal para la alimentación complementaria de tu bebé. Elaborado con granos cuidadosamente cultivados, enriquecido con 15 vitaminas y minerales, rico en hierro para apoyar el desarrollo cognitivo y con probiótico Bifidus BL que ayuda al normal funcionamiento del sistema digestivo. Fácil de preparar.',
      "precioBase" = 25000,
      "precioWeb" = 25000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459516/distribuidorababyworld/panales_y_leches/LEC-001-250-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459516/distribuidorababyworld/panales_y_leches/LEC-001-250-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459518/distribuidorababyworld/panales_y_leches/LEC-001-250-2.png"],"detalles":["Contiene 15 vitaminas y minerales esenciales","Rico en hierro para apoyar el normal desarrollo cognitivo","Con probiótico Bifidus BL que ayuda al sistema digestivo","Granos seleccionados y cultivados responsablemente","Fácil preparación en forma de papilla"],"marca":"Nestlé","presentacion":"Caja x 250g","etapaTalla":"A partir de 6 meses","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-001-250';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-001-250', 'Cereal Infantil Nestum Arroz Nestlé Caja x 250g', 'Cereal infantil Nestum Arroz con probiótico Bifidus BL, vitaminas y minerales para bebés.', 'Cereal infantil Nestum Arroz ideal para la alimentación complementaria de tu bebé. Elaborado con granos cuidadosamente cultivados, enriquecido con 15 vitaminas y minerales, rico en hierro para apoyar el desarrollo cognitivo y con probiótico Bifidus BL que ayuda al normal funcionamiento del sistema digestivo. Fácil de preparar.',
      25000, 25000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459516/distribuidorababyworld/panales_y_leches/LEC-001-250-1.png', v_cat_alimentacion_id, true,
      false, false, 'cereal-infantil-nestum-arroz-nestle-caja-x-250g-lec-001-250', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459516/distribuidorababyworld/panales_y_leches/LEC-001-250-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459518/distribuidorababyworld/panales_y_leches/LEC-001-250-2.png"],"detalles":["Contiene 15 vitaminas y minerales esenciales","Rico en hierro para apoyar el normal desarrollo cognitivo","Con probiótico Bifidus BL que ayuda al sistema digestivo","Granos seleccionados y cultivados responsablemente","Fácil preparación en forma de papilla"],"marca":"Nestlé","presentacion":"Caja x 250g","etapaTalla":"A partir de 6 meses","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-018-M | Pañales Winny Sec Plus Talla M
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-018-M') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Sec Plus Talla M',
      descripcion = 'Pañales desechables Winny Sec Plus con sistema ultra-absorbente y diseño anatómico para mayor comodidad y protección.',
      "descripcionWeb" = 'Los pañales Winny Sec Plus ofrecen la máxima protección y comodidad para tu bebé. Cuentan con un sistema ultra-absorbente que retiene y gelatiza la orina por hasta 12 horas, capa extra-seca que previene irritaciones, barreras altas antifugas y cintas elastizadas para un ajuste perfecto y seguro. Su cubierta tipo tela con divertidos diseños es suave y respirable, cuidando la piel delicada de tu pequeño en todo momento.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459529/distribuidorababyworld/panales_y_leches/PAN-018-M-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459529/distribuidorababyworld/panales_y_leches/PAN-018-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459532/distribuidorababyworld/panales_y_leches/PAN-018-M-2.png"],"detalles":["Hasta 12 horas de absorción con sistema que gelatiza la orina","Barreras altas y cómodas para prevenir filtraciones","Capa extra-seca que ayuda a prevenir irritaciones","Cintas y cintura elastizadas con diseño anatómico","Bandas respirables, almohadonadas y supersuaves"],"marca":"Winny","presentacion":"Paquete de pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-018-M';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-018-M', 'Pañales Winny Sec Plus Talla M', 'Pañales desechables Winny Sec Plus con sistema ultra-absorbente y diseño anatómico para mayor comodidad y protección.', 'Los pañales Winny Sec Plus ofrecen la máxima protección y comodidad para tu bebé. Cuentan con un sistema ultra-absorbente que retiene y gelatiza la orina por hasta 12 horas, capa extra-seca que previene irritaciones, barreras altas antifugas y cintas elastizadas para un ajuste perfecto y seguro. Su cubierta tipo tela con divertidos diseños es suave y respirable, cuidando la piel delicada de tu pequeño en todo momento.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459529/distribuidorababyworld/panales_y_leches/PAN-018-M-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-sec-plus-talla-m-pan-018-m', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459529/distribuidorababyworld/panales_y_leches/PAN-018-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459532/distribuidorababyworld/panales_y_leches/PAN-018-M-2.png"],"detalles":["Hasta 12 horas de absorción con sistema que gelatiza la orina","Barreras altas y cómodas para prevenir filtraciones","Capa extra-seca que ayuda a prevenir irritaciones","Cintas y cintura elastizadas con diseño anatómico","Bandas respirables, almohadonadas y supersuaves"],"marca":"Winny","presentacion":"Paquete de pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-019-XG | Pañales Winny Pants Talla XG
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-019-XG') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Pants Talla XG',
      descripcion = 'Pañales desechables tipo calzoncito Winny Pants con alta absorción y ajuste cómodo para el bebé.',
      "descripcionWeb" = 'Los pañales Winny Pants ofrecen la máxima comodidad y protección para tu bebé. Su diseño tipo calzoncito facilita ponerlo y quitarlo como ropa interior. Cuenta con una capa extra-seca que previene irritaciones, sistema ultra-absorbente que gelifica la orina, y elásticos 360° suaves y ajustables que evitan filtraciones brindando hasta 12 horas de protección continua.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459542/distribuidorababyworld/panales_y_leches/PAN-019-XG-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459542/distribuidorababyworld/panales_y_leches/PAN-019-XG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459544/distribuidorababyworld/panales_y_leches/PAN-019-XG-2.png"],"detalles":["Diseño tipo calzoncito fácil de subir y bajar","Hasta 12 horas de absorción continua","Capa extra-seca que previene irritaciones","Elásticos 360° súper ajustables y suaves"],"marca":"Winny","presentacion":"Paquete de pañales desechables","etapaTalla":"Talla XG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-019-XG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-019-XG', 'Pañales Winny Pants Talla XG', 'Pañales desechables tipo calzoncito Winny Pants con alta absorción y ajuste cómodo para el bebé.', 'Los pañales Winny Pants ofrecen la máxima comodidad y protección para tu bebé. Su diseño tipo calzoncito facilita ponerlo y quitarlo como ropa interior. Cuenta con una capa extra-seca que previene irritaciones, sistema ultra-absorbente que gelifica la orina, y elásticos 360° suaves y ajustables que evitan filtraciones brindando hasta 12 horas de protección continua.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459542/distribuidorababyworld/panales_y_leches/PAN-019-XG-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-pants-talla-xg-pan-019-xg', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459542/distribuidorababyworld/panales_y_leches/PAN-019-XG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459544/distribuidorababyworld/panales_y_leches/PAN-019-XG-2.png"],"detalles":["Diseño tipo calzoncito fácil de subir y bajar","Hasta 12 horas de absorción continua","Capa extra-seca que previene irritaciones","Elásticos 360° súper ajustables y suaves"],"marca":"Winny","presentacion":"Paquete de pañales desechables","etapaTalla":"Talla XG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-020-M | Pañales Winny Sec Plus Talla M x 60 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-020-M') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Sec Plus Talla M x 60 Und',
      descripcion = 'Pañales desechables Winny Sec Plus Talla M con sistema ultra-absorbente de hasta 12 horas y barreras antifugas.',
      "descripcionWeb" = 'Los pañales Winny Sec Plus en Talla M ofrecen máxima protección y comodidad para tu bebé. Cuentan con un sistema ultra-absorbente que retiene y gelatiniza la orina por hasta 12 horas, capa extra-seca para prevenir irritaciones, barreras altas y cómodas, y una cubierta tipo tela con diseño anatómico, cintas elastizadas y reajustables.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459555/distribuidorababyworld/panales_y_leches/PAN-020-M-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459555/distribuidorababyworld/panales_y_leches/PAN-020-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459558/distribuidorababyworld/panales_y_leches/PAN-020-M-2.png"],"detalles":["Sistema ultra-absorbente que retiene y gelatiniza la orina por hasta 12 horas","Capa extra-seca que mantiene seca la colita previniendo irritaciones","Barreras altas y cómodas para prevenir filtraciones de orina","Cintas y cintura elastizadas con diseño anatómico","Cubierta tipo tela con diseños, respirable y supersuave"],"marca":"Winny","presentacion":"Paquete x 60 pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-020-M';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-020-M', 'Pañales Winny Sec Plus Talla M x 60 Und', 'Pañales desechables Winny Sec Plus Talla M con sistema ultra-absorbente de hasta 12 horas y barreras antifugas.', 'Los pañales Winny Sec Plus en Talla M ofrecen máxima protección y comodidad para tu bebé. Cuentan con un sistema ultra-absorbente que retiene y gelatiniza la orina por hasta 12 horas, capa extra-seca para prevenir irritaciones, barreras altas y cómodas, y una cubierta tipo tela con diseño anatómico, cintas elastizadas y reajustables.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459555/distribuidorababyworld/panales_y_leches/PAN-020-M-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-sec-plus-talla-m-x-60-und-pan-020-m', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459555/distribuidorababyworld/panales_y_leches/PAN-020-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459558/distribuidorababyworld/panales_y_leches/PAN-020-M-2.png"],"detalles":["Sistema ultra-absorbente que retiene y gelatiniza la orina por hasta 12 horas","Capa extra-seca que mantiene seca la colita previniendo irritaciones","Barreras altas y cómodas para prevenir filtraciones de orina","Cintas y cintura elastizadas con diseño anatómico","Cubierta tipo tela con diseños, respirable y supersuave"],"marca":"Winny","presentacion":"Paquete x 60 pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-021-M | Pañales Winny Sec Plus Talla M
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-021-M') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Sec Plus Talla M',
      descripcion = 'Pañales desechables Winny Sec Plus Talla M, diseñados para ofrecer máxima absorción, comodidad y protección contra filtraciones.',
      "descripcionWeb" = 'Los pañales Winny Sec Plus Talla M brindan el cuidado ideal para tu bebé. Cuentan con un sistema ultra-absorbente que gelifica la orina en el interior, capa extra-seca para prevenir irritaciones, barreras altas y cómodas antifugas, y una cubierta tipo tela con diseños tiernos. Sus cintas pega-despega y cintura elastizada aseguran un ajuste perfecto y cómodo durante todo el día y la noche.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459568/distribuidorababyworld/panales_y_leches/PAN-021-M-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459568/distribuidorababyworld/panales_y_leches/PAN-021-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459571/distribuidorababyworld/panales_y_leches/PAN-021-M-2.png"],"detalles":["Sistema ultra-absorbente que retiene y gelifica la orina","Capa extra-seca que mantiene seca la colita del bebé","Barreras altas y cómodas para prevenir filtraciones","Cintas y cintura elastizadas con diseño anatómico","Bandas respirables, abullonadas y supersuaves"],"marca":"Winny","presentacion":"Paquete de pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-021-M';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-021-M', 'Pañales Winny Sec Plus Talla M', 'Pañales desechables Winny Sec Plus Talla M, diseñados para ofrecer máxima absorción, comodidad y protección contra filtraciones.', 'Los pañales Winny Sec Plus Talla M brindan el cuidado ideal para tu bebé. Cuentan con un sistema ultra-absorbente que gelifica la orina en el interior, capa extra-seca para prevenir irritaciones, barreras altas y cómodas antifugas, y una cubierta tipo tela con diseños tiernos. Sus cintas pega-despega y cintura elastizada aseguran un ajuste perfecto y cómodo durante todo el día y la noche.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459568/distribuidorababyworld/panales_y_leches/PAN-021-M-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-sec-plus-talla-m-pan-021-m', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459568/distribuidorababyworld/panales_y_leches/PAN-021-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459571/distribuidorababyworld/panales_y_leches/PAN-021-M-2.png"],"detalles":["Sistema ultra-absorbente que retiene y gelifica la orina","Capa extra-seca que mantiene seca la colita del bebé","Barreras altas y cómodas para prevenir filtraciones","Cintas y cintura elastizadas con diseño anatómico","Bandas respirables, abullonadas y supersuaves"],"marca":"Winny","presentacion":"Paquete de pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-022-M | Pañales Winny Ultratrim Sec Etapa 2 Talla M x 50 Unidades
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-022-M') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Ultratrim Sec Etapa 2 Talla M x 50 Unidades',
      descripcion = 'Pañales Winny Ultratrim Sec Etapa 2 Talla M, paquete de 50 unidades con alta absorción.',
      "descripcionWeb" = 'Los pañales Winny Ultratrim Sec Etapa 2 (Talla M) están diseñados para bebés de 6 a 9 kg. Ofrecen una excelente protección gracias a su núcleo ultra absorbente que mantiene la colita seca y evita filtraciones. Brindan comodidad y suavidad durante todo el día y la noche, permitiendo que tu bebé se mueva con total libertad.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459583/distribuidorababyworld/panales_y_leches/PAN-022-M-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459583/distribuidorababyworld/panales_y_leches/PAN-022-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459587/distribuidorababyworld/panales_y_leches/PAN-022-M-2.png"],"detalles":["Núcleo ultra absorbente para mantener la colita seca","Barreras protectoras que ayudan a evitar filtraciones","Diseñado para bebés de 6 a 9 kg (Talla M, Etapa 2)","Incluye 10 toallitas húmedas de regalo"],"marca":"Winny","presentacion":"Paquete x 50 pañales","etapaTalla":"Etapa 2 / Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-022-M';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-022-M', 'Pañales Winny Ultratrim Sec Etapa 2 Talla M x 50 Unidades', 'Pañales Winny Ultratrim Sec Etapa 2 Talla M, paquete de 50 unidades con alta absorción.', 'Los pañales Winny Ultratrim Sec Etapa 2 (Talla M) están diseñados para bebés de 6 a 9 kg. Ofrecen una excelente protección gracias a su núcleo ultra absorbente que mantiene la colita seca y evita filtraciones. Brindan comodidad y suavidad durante todo el día y la noche, permitiendo que tu bebé se mueva con total libertad.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459583/distribuidorababyworld/panales_y_leches/PAN-022-M-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-ultratrim-sec-etapa-2-talla-m-x-50-unidades-pan-022-m', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459583/distribuidorababyworld/panales_y_leches/PAN-022-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459587/distribuidorababyworld/panales_y_leches/PAN-022-M-2.png"],"detalles":["Núcleo ultra absorbente para mantener la colita seca","Barreras protectoras que ayudan a evitar filtraciones","Diseñado para bebés de 6 a 9 kg (Talla M, Etapa 2)","Incluye 10 toallitas húmedas de regalo"],"marca":"Winny","presentacion":"Paquete x 50 pañales","etapaTalla":"Etapa 2 / Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-023-G | Pañales Winny Ultratrim Sec Talla G x 30 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-023-G') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Ultratrim Sec Talla G x 30 Und',
      descripcion = 'Pañales desechables Winny Ultratrim Sec Talla G, paquete por 30 unidades. Incluye 10 toallitas húmedas de regalo.',
      "descripcionWeb" = 'Los pañales Winny Ultratrim Sec en talla G están diseñados para brindar máxima absorción y comodidad a tu bebé. Cuentan con tecnología ultra absorbente que ayuda a mantener la colita seca por más tiempo, previniendo filtraciones y protegiendo la delicada piel del bebé. Ideales para bebés de 8 a 12 kg.',
      "precioBase" = 35000,
      "precioWeb" = 35000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459599/distribuidorababyworld/panales_y_leches/PAN-023-G-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459599/distribuidorababyworld/panales_y_leches/PAN-023-G-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459607/distribuidorababyworld/panales_y_leches/PAN-023-G-2.png"],"detalles":["Ultra absorbentes para mantener la colita seca","Evita filtraciones y derrames","Diseñado para bebés de 8 a 12 kg","Incluye 10 toallitas húmedas con Aloe Vera y Vitamina E"],"marca":"Winny","presentacion":"Paquete x 30 pañales","etapaTalla":"Talla G","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-023-G';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-023-G', 'Pañales Winny Ultratrim Sec Talla G x 30 Und', 'Pañales desechables Winny Ultratrim Sec Talla G, paquete por 30 unidades. Incluye 10 toallitas húmedas de regalo.', 'Los pañales Winny Ultratrim Sec en talla G están diseñados para brindar máxima absorción y comodidad a tu bebé. Cuentan con tecnología ultra absorbente que ayuda a mantener la colita seca por más tiempo, previniendo filtraciones y protegiendo la delicada piel del bebé. Ideales para bebés de 8 a 12 kg.',
      35000, 35000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459599/distribuidorababyworld/panales_y_leches/PAN-023-G-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-ultratrim-sec-talla-g-x-30-und-pan-023-g', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459599/distribuidorababyworld/panales_y_leches/PAN-023-G-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459607/distribuidorababyworld/panales_y_leches/PAN-023-G-2.png"],"detalles":["Ultra absorbentes para mantener la colita seca","Evita filtraciones y derrames","Diseñado para bebés de 8 a 12 kg","Incluye 10 toallitas húmedas con Aloe Vera y Vitamina E"],"marca":"Winny","presentacion":"Paquete x 30 pañales","etapaTalla":"Talla G","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-024-M | Pañales Winny Ultratrim Sec Talla M Etapa 2 x 30 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-024-M') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Ultratrim Sec Talla M Etapa 2 x 30 Und',
      descripcion = 'Pañales Winny Ultratrim Sec Talla M Etapa 2 con 30 unidades, diseñados para mantener la colita seca y evitar filtraciones.',
      "descripcionWeb" = 'Los pañales Winny Ultratrim Sec Etapa 2 Talla M (6 a 9 kg) ofrecen una absorción superior gracias a su diseño avanzado que mantiene la piel de tu bebé seca y protegida. Cuentan con barreras seguras para evitar filtraciones y materiales suaves que cuidan la delicada piel infantil, brindando comodidad durante todo el día y la noche.',
      "precioBase" = 28500,
      "precioWeb" = 28500,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459620/distribuidorababyworld/panales_y_leches/PAN-024-M-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459620/distribuidorababyworld/panales_y_leches/PAN-024-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459626/distribuidorababyworld/panales_y_leches/PAN-024-M-2.png"],"detalles":["Ultra absorbentes para mantener la colita seca","Diseñados para evitar filtraciones y accidentes","Talla M adecuada para bebés de 6 a 9 kg (13 a 20 lbs)","Etapa 2 con ajuste cómodo y seguro"],"marca":"Winny","presentacion":"Paquete x 30 pañales","etapaTalla":"Talla M / Etapa 2","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-024-M';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-024-M', 'Pañales Winny Ultratrim Sec Talla M Etapa 2 x 30 Und', 'Pañales Winny Ultratrim Sec Talla M Etapa 2 con 30 unidades, diseñados para mantener la colita seca y evitar filtraciones.', 'Los pañales Winny Ultratrim Sec Etapa 2 Talla M (6 a 9 kg) ofrecen una absorción superior gracias a su diseño avanzado que mantiene la piel de tu bebé seca y protegida. Cuentan con barreras seguras para evitar filtraciones y materiales suaves que cuidan la delicada piel infantil, brindando comodidad durante todo el día y la noche.',
      28500, 28500, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459620/distribuidorababyworld/panales_y_leches/PAN-024-M-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-ultratrim-sec-talla-m-etapa-2-x-30-und-pan-024-m', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459620/distribuidorababyworld/panales_y_leches/PAN-024-M-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459626/distribuidorababyworld/panales_y_leches/PAN-024-M-2.png"],"detalles":["Ultra absorbentes para mantener la colita seca","Diseñados para evitar filtraciones y accidentes","Talla M adecuada para bebés de 6 a 9 kg (13 a 20 lbs)","Etapa 2 con ajuste cómodo y seguro"],"marca":"Winny","presentacion":"Paquete x 30 pañales","etapaTalla":"Talla M / Etapa 2","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-025-XG | Pañales Winny Sec Etapa 4 XG
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-025-XG') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Winny Sec Etapa 4 XG',
      descripcion = 'Pañales Winny Sec Etapa XG con diseño anatómico, indicador de humedad y hasta 12 horas de absorción.',
      "descripcionWeb" = 'Descubre los pañales Winny Sec en etapa XG, diseñados para brindar la máxima comodidad y protección a tu bebé. Cuentan con un sistema ultra-absorbente que gelifica la orina manteniéndola alejada de la piel, barreras altas antifugas, bandas respirables supersuaves y un práctico indicador de humedad que cambia de color para avisarte cuándo es momento del cambio. Su diseño anatómico y cintas elastizadas garantizan un ajuste perfecto.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459635/distribuidorababyworld/panales_y_leches/PAN-025-XG-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459635/distribuidorababyworld/panales_y_leches/PAN-025-XG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459638/distribuidorababyworld/panales_y_leches/PAN-025-XG-2.png"],"detalles":["Hasta 12 horas de absorción continua","Indicador de humedad que cambia de color","Barreras altas y cómodas para prevenir filtraciones","Cintas y cintura elastizadas para un mejor ajuste","Bandas respirables, abullonaditas y supersuaves"],"marca":"Winny","presentacion":"Paquete de pañales desechables","etapaTalla":"Etapa 4 / XG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-025-XG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-025-XG', 'Pañales Winny Sec Etapa 4 XG', 'Pañales Winny Sec Etapa XG con diseño anatómico, indicador de humedad y hasta 12 horas de absorción.', 'Descubre los pañales Winny Sec en etapa XG, diseñados para brindar la máxima comodidad y protección a tu bebé. Cuentan con un sistema ultra-absorbente que gelifica la orina manteniéndola alejada de la piel, barreras altas antifugas, bandas respirables supersuaves y un práctico indicador de humedad que cambia de color para avisarte cuándo es momento del cambio. Su diseño anatómico y cintas elastizadas garantizan un ajuste perfecto.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459635/distribuidorababyworld/panales_y_leches/PAN-025-XG-1.png', v_cat_panales_id, true,
      false, false, 'panales-winny-sec-etapa-4-xg-pan-025-xg', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459635/distribuidorababyworld/panales_y_leches/PAN-025-XG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792459638/distribuidorababyworld/panales_y_leches/PAN-025-XG-2.png"],"detalles":["Hasta 12 horas de absorción continua","Indicador de humedad que cambia de color","Barreras altas y cómodas para prevenir filtraciones","Cintas y cintura elastizadas para un mejor ajuste","Bandas respirables, abullonaditas y supersuaves"],"marca":"Winny","presentacion":"Paquete de pañales desechables","etapaTalla":"Etapa 4 / XG","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: PAN-026-M | Pañales Babysec Ultra Protect Talla M x 50 Und
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'PAN-026-M') THEN
    UPDATE "Producto" SET
      nombre = 'Pañales Babysec Ultra Protect Talla M x 50 Und',
      descripcion = 'Pañales desechables Babysec Ultra Protect Talla M, paquete por 50 unidades. Con hasta 12 horas de absorción.',
      "descripcionWeb" = 'Los pañales Babysec Ultra Protect Talla M están diseñados para brindar la máxima comodidad y protección a tu bebé. Ofrecen hasta 12 horas de absorción continua para mantenerlo seco toda la noche. Cuentan con cintura elástica para un ajuste perfecto y protección avanzada contra derrames, cuidando la piel delicada de tu pequeño en cada etapa.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459653/distribuidorababyworld/panales_y_leches/PAN-026-M-1.png',
      "categoriaId" = v_cat_panales_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459653/distribuidorababyworld/panales_y_leches/PAN-026-M-1.png"],"detalles":["Hasta 12 horas de absorción que dura toda la noche","Protección avanzada contra derrames","Cintura elástica para mayor comodidad y ajuste","Diseñado para bebés de 5 a 9.5 kg (Talla M)"],"marca":"Babysec","presentacion":"Paquete x 50 pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'PAN-026-M';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'PAN-026-M', 'Pañales Babysec Ultra Protect Talla M x 50 Und', 'Pañales desechables Babysec Ultra Protect Talla M, paquete por 50 unidades. Con hasta 12 horas de absorción.', 'Los pañales Babysec Ultra Protect Talla M están diseñados para brindar la máxima comodidad y protección a tu bebé. Ofrecen hasta 12 horas de absorción continua para mantenerlo seco toda la noche. Cuentan con cintura elástica para un ajuste perfecto y protección avanzada contra derrames, cuidando la piel delicada de tu pequeño en cada etapa.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459653/distribuidorababyworld/panales_y_leches/PAN-026-M-1.png', v_cat_panales_id, true,
      false, false, 'panales-babysec-ultra-protect-talla-m-x-50-und-pan-026-m', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459653/distribuidorababyworld/panales_y_leches/PAN-026-M-1.png"],"detalles":["Hasta 12 horas de absorción que dura toda la noche","Protección avanzada contra derrames","Cintura elástica para mayor comodidad y ajuste","Diseñado para bebés de 5 a 9.5 kg (Talla M)"],"marca":"Babysec","presentacion":"Paquete x 50 pañales","etapaTalla":"Talla M","subcategoria":"Pañales Desechables","tipoProducto":"PANAL"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-002-1800 | Leche Nestlé Klim Crecimiento 1+ Megapack 1800g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-002-1800') THEN
    UPDATE "Producto" SET
      nombre = 'Leche Nestlé Klim Crecimiento 1+ Megapack 1800g',
      descripcion = 'Alimento lácteo instantáneo en polvo con inulina y oligofructosa para niños a partir de 24 meses.',
      "descripcionWeb" = 'Fórmula láctea Nestlé Klim Crecimiento 1+ en presentación Megapack de 1800g. Diseñada especialmente para apoyar la nutrición especializada de los niños a partir de los 24 meses. Contiene nutrientes esenciales como selenio, vitaminas A, D y C para la inmunidad, calcio, magnesio y proteína para huesos y músculos, hierro y zinc para la función cognitiva, además de 2 prebióticos. Ayuda en el desarrollo saludable durante la etapa de crecimiento.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459675/distribuidorababyworld/panales_y_leches/LEC-002-1800-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459675/distribuidorababyworld/panales_y_leches/LEC-002-1800-1.png"],"detalles":["Inmunidad: Selenio, Vitaminas A, D y C","Huesos y músculos: Calcio, magnesio y proteína","Función cognitiva: Hierro y zinc","Contiene 2 prebióticos (inulina y oligofructosa)","A partir de 24 meses"],"marca":"Nestlé Klim","presentacion":"Bolsa x 1800g","etapaTalla":"1+","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-002-1800';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-002-1800', 'Leche Nestlé Klim Crecimiento 1+ Megapack 1800g', 'Alimento lácteo instantáneo en polvo con inulina y oligofructosa para niños a partir de 24 meses.', 'Fórmula láctea Nestlé Klim Crecimiento 1+ en presentación Megapack de 1800g. Diseñada especialmente para apoyar la nutrición especializada de los niños a partir de los 24 meses. Contiene nutrientes esenciales como selenio, vitaminas A, D y C para la inmunidad, calcio, magnesio y proteína para huesos y músculos, hierro y zinc para la función cognitiva, además de 2 prebióticos. Ayuda en el desarrollo saludable durante la etapa de crecimiento.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459675/distribuidorababyworld/panales_y_leches/LEC-002-1800-1.png', v_cat_alimentacion_id, true,
      false, false, 'leche-nestle-klim-crecimiento-1-megapack-1800g-lec-002-1800', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459675/distribuidorababyworld/panales_y_leches/LEC-002-1800-1.png"],"detalles":["Inmunidad: Selenio, Vitaminas A, D y C","Huesos y músculos: Calcio, magnesio y proteína","Función cognitiva: Hierro y zinc","Contiene 2 prebióticos (inulina y oligofructosa)","A partir de 24 meses"],"marca":"Nestlé Klim","presentacion":"Bolsa x 1800g","etapaTalla":"1+","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-003-1000 | Leche Klim Crecimiento 1+ Nestlé Bolsa x 1000g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-003-1000') THEN
    UPDATE "Producto" SET
      nombre = 'Leche Klim Crecimiento 1+ Nestlé Bolsa x 1000g',
      descripcion = 'Alimento lácteo en polvo para niños a partir de 24 meses, con prebióticos, vitaminas y minerales para su desarrollo.',
      "descripcionWeb" = 'Klim Crecimiento 1+ de Nestlé es un alimento lácteo instantáneo en polvo especialmente formulado para niños a partir de 24 meses. Contiene prebióticos, selenio, vitaminas A, D y C para apoyar la inmunidad, además de calcio, magnesio y proteína para huesos y músculos fuertes, y hierro y zinc para la función cognitiva. Su presentación en bolsa con cierre hermético reutilizable facilita su conservación y preparación.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459693/distribuidorababyworld/panales_y_leches/LEC-003-1000-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459693/distribuidorababyworld/panales_y_leches/LEC-003-1000-1.png"],"detalles":["Inmunidad: Enriquecido con selenio, vitaminas A, D y C","Huesos y músculos: Contiene calcio, magnesio y proteína","Función cognitiva: Aporte de hierro y zinc","Contiene 2 prebióticos y fibra (inulina y oligofructosa)","Apto para niños a partir de 24 meses (2 años)"],"marca":"Nestlé","presentacion":"Bolsa x 1000g","etapaTalla":"1+","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-003-1000';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-003-1000', 'Leche Klim Crecimiento 1+ Nestlé Bolsa x 1000g', 'Alimento lácteo en polvo para niños a partir de 24 meses, con prebióticos, vitaminas y minerales para su desarrollo.', 'Klim Crecimiento 1+ de Nestlé es un alimento lácteo instantáneo en polvo especialmente formulado para niños a partir de 24 meses. Contiene prebióticos, selenio, vitaminas A, D y C para apoyar la inmunidad, además de calcio, magnesio y proteína para huesos y músculos fuertes, y hierro y zinc para la función cognitiva. Su presentación en bolsa con cierre hermético reutilizable facilita su conservación y preparación.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459693/distribuidorababyworld/panales_y_leches/LEC-003-1000-1.png', v_cat_alimentacion_id, true,
      false, false, 'leche-klim-crecimiento-1-nestle-bolsa-x-1000g-lec-003-1000', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459693/distribuidorababyworld/panales_y_leches/LEC-003-1000-1.png"],"detalles":["Inmunidad: Enriquecido con selenio, vitaminas A, D y C","Huesos y músculos: Contiene calcio, magnesio y proteína","Función cognitiva: Aporte de hierro y zinc","Contiene 2 prebióticos y fibra (inulina y oligofructosa)","Apto para niños a partir de 24 meses (2 años)"],"marca":"Nestlé","presentacion":"Bolsa x 1000g","etapaTalla":"1+","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-004-E3 | Fórmula Nan Optipro 3 x 800g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-004-E3') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Nan Optipro 3 x 800g',
      descripcion = 'Fórmula láctea de crecimiento Nestlé Nan Optipro 3 con 5 HMO Complex en lata de 800g para niños a partir de 2 años.',
      "descripcionWeb" = 'Nan Optipro 3 de Nestlé es una fórmula de crecimiento científicamente diseñada para niños a partir de 2 años. Contiene el innovador complejo 5 HMO, proteína optimizada de alta calidad, probióticos BL y DHA que apoyan el desarrollo cerebral, visual y el sistema inmune en esta etapa clave de crecimiento. Preparación recomendada según las instrucciones del pediatra.',
      "precioBase" = 85000,
      "precioWeb" = 85000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459704/distribuidorababyworld/panales_y_leches/LEC-004-E3-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459704/distribuidorababyworld/panales_y_leches/LEC-004-E3-1.png"],"detalles":["Contiene 5 HMO Complex para apoyar la inmunidad","Proteína optimizada para el desarrollo saludable","Con Probiótico BL y DHA","A partir de 2 años","Rinde aproximadamente 25 porciones"],"marca":"Nan","presentacion":"Lata x 800g","etapaTalla":"Etapa 3","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-004-E3';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-004-E3', 'Fórmula Nan Optipro 3 x 800g', 'Fórmula láctea de crecimiento Nestlé Nan Optipro 3 con 5 HMO Complex en lata de 800g para niños a partir de 2 años.', 'Nan Optipro 3 de Nestlé es una fórmula de crecimiento científicamente diseñada para niños a partir de 2 años. Contiene el innovador complejo 5 HMO, proteína optimizada de alta calidad, probióticos BL y DHA que apoyan el desarrollo cerebral, visual y el sistema inmune en esta etapa clave de crecimiento. Preparación recomendada según las instrucciones del pediatra.',
      85000, 85000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459704/distribuidorababyworld/panales_y_leches/LEC-004-E3-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-nan-optipro-3-x-800g-lec-004-e3', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459704/distribuidorababyworld/panales_y_leches/LEC-004-E3-1.png"],"detalles":["Contiene 5 HMO Complex para apoyar la inmunidad","Proteína optimizada para el desarrollo saludable","Con Probiótico BL y DHA","A partir de 2 años","Rinde aproximadamente 25 porciones"],"marca":"Nan","presentacion":"Lata x 800g","etapaTalla":"Etapa 3","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-005-E3 | Fórmula Nestlé Nestógeno 3 Etapa 3 Lata x 800g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-005-E3') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Nestlé Nestógeno 3 Etapa 3 Lata x 800g',
      descripcion = 'Fórmula infantil Nestógeno 3 de Nestlé en lata de 800g, diseñada para niños a partir de 2 años.',
      "descripcionWeb" = 'Nestógeno 3 de Nestlé es una fórmula de crecimiento diseñada especialmente para niños a partir de los 2 años. Contiene Comfortis Grow con probiótico L. Reuteri y GOS, ingredientes clínicamente probados que apoyan una digestión saludable, fortalecen el sistema inmune y contribuyen al correcto desarrollo de los huesos. Brinda la nutrición complementaria ideal para esta etapa de crecimiento activo.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459712/distribuidorababyworld/panales_y_leches/LEC-005-E3-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459712/distribuidorababyworld/panales_y_leches/LEC-005-E3-1.png"],"detalles":["Contiene probiótico L. Reuteri y 6 GOS","Apoya una digestión saludable","Fortalece el sistema inmune","Contribuye al desarrollo de los huesos","A partir de 2 años"],"marca":"Nestlé","presentacion":"Lata x 800g","etapaTalla":"Etapa 3","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-005-E3';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-005-E3', 'Fórmula Nestlé Nestógeno 3 Etapa 3 Lata x 800g', 'Fórmula infantil Nestógeno 3 de Nestlé en lata de 800g, diseñada para niños a partir de 2 años.', 'Nestógeno 3 de Nestlé es una fórmula de crecimiento diseñada especialmente para niños a partir de los 2 años. Contiene Comfortis Grow con probiótico L. Reuteri y GOS, ingredientes clínicamente probados que apoyan una digestión saludable, fortalecen el sistema inmune y contribuyen al correcto desarrollo de los huesos. Brinda la nutrición complementaria ideal para esta etapa de crecimiento activo.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459712/distribuidorababyworld/panales_y_leches/LEC-005-E3-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-nestle-nestogeno-3-etapa-3-lata-x-800g-lec-005-e3', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459712/distribuidorababyworld/panales_y_leches/LEC-005-E3-1.png"],"detalles":["Contiene probiótico L. Reuteri y 6 GOS","Apoya una digestión saludable","Fortalece el sistema inmune","Contribuye al desarrollo de los huesos","A partir de 2 años"],"marca":"Nestlé","presentacion":"Lata x 800g","etapaTalla":"Etapa 3","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-006-135 | Fórmula Nestogeno Nutri Esencial 0-12 Meses Bolsa x 135g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-006-135') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Nestogeno Nutri Esencial 0-12 Meses Bolsa x 135g',
      descripcion = 'Fórmula láctea en polvo con hierro para lactantes de 0 a 12 meses. Contiene carbohidratos, vitaminas y minerales esenciales.',
      "descripcionWeb" = 'Nestogeno Nutri Esencial está diseñada para acompañar la nutrición de tu bebé desde el nacimiento hasta los 12 meses. Su fórmula contiene un perfil equilibrado con 100% lactosa, vitaminas y minerales que apoyan el desarrollo saludable. Enriquecida con hierro para lactantes. Se recomienda seguir las indicaciones del pediatra para su correcta preparación y dosificación.',
      "precioBase" = 18500,
      "precioWeb" = 18500,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459721/distribuidorababyworld/panales_y_leches/LEC-006-135-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459721/distribuidorababyworld/panales_y_leches/LEC-006-135-1.png"],"detalles":["Fórmula láctea con hierro para lactantes","Carbohidratos con 100% lactosa","Enriquecida con vitaminas y minerales esenciales","Apta para bebés de 0 a 12 meses"],"marca":"Nestógeno","presentacion":"Bolsa x 135g","etapaTalla":"0-12 meses","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-006-135';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-006-135', 'Fórmula Nestogeno Nutri Esencial 0-12 Meses Bolsa x 135g', 'Fórmula láctea en polvo con hierro para lactantes de 0 a 12 meses. Contiene carbohidratos, vitaminas y minerales esenciales.', 'Nestogeno Nutri Esencial está diseñada para acompañar la nutrición de tu bebé desde el nacimiento hasta los 12 meses. Su fórmula contiene un perfil equilibrado con 100% lactosa, vitaminas y minerales que apoyan el desarrollo saludable. Enriquecida con hierro para lactantes. Se recomienda seguir las indicaciones del pediatra para su correcta preparación y dosificación.',
      18500, 18500, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459721/distribuidorababyworld/panales_y_leches/LEC-006-135-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-nestogeno-nutri-esencial-0-12-meses-bolsa-x-135g-lec-006-135', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459721/distribuidorababyworld/panales_y_leches/LEC-006-135-1.png"],"detalles":["Fórmula láctea con hierro para lactantes","Carbohidratos con 100% lactosa","Enriquecida con vitaminas y minerales esenciales","Apta para bebés de 0 a 12 meses"],"marca":"Nestógeno","presentacion":"Bolsa x 135g","etapaTalla":"0-12 meses","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-007-E1 | Fórmula Nestlé Nan Optipro 1 x 900g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-007-E1') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Nestlé Nan Optipro 1 x 900g',
      descripcion = 'Fórmula infantil en polvo con proteína optimizada, probióticos y 5 HMO para lactantes de 0 a 6 meses.',
      "descripcionWeb" = 'Fórmula infantil avanzada Nestlé Nan Optipro 1 en lata de 900g, diseñada especialmente para lactantes de 0 a 6 meses. Contiene proteína optimizada en cantidad y calidad, complejo 5 HMO, probiótico B. lactis, DHA y ARA para apoyar un crecimiento saludable, el desarrollo visual y cerebral, y fortalecer el sistema inmunitario. Consulte a su pediatra.',
      "precioBase" = 95000,
      "precioWeb" = 95000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459728/distribuidorababyworld/panales_y_leches/LEC-007-E1-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459728/distribuidorababyworld/panales_y_leches/LEC-007-E1-1.png"],"detalles":["Proteína optimizada para el desarrollo saludable","Contiene complejo 5 HMO","Con probiótico B. lactis","Enriquecida con DHA y ARA","Para lactantes de 0 a 6 meses"],"marca":"Nestlé Nan","presentacion":"Lata x 900g","etapaTalla":"Etapa 1 (0-6 meses)","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-007-E1';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-007-E1', 'Fórmula Nestlé Nan Optipro 1 x 900g', 'Fórmula infantil en polvo con proteína optimizada, probióticos y 5 HMO para lactantes de 0 a 6 meses.', 'Fórmula infantil avanzada Nestlé Nan Optipro 1 en lata de 900g, diseñada especialmente para lactantes de 0 a 6 meses. Contiene proteína optimizada en cantidad y calidad, complejo 5 HMO, probiótico B. lactis, DHA y ARA para apoyar un crecimiento saludable, el desarrollo visual y cerebral, y fortalecer el sistema inmunitario. Consulte a su pediatra.',
      95000, 95000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459728/distribuidorababyworld/panales_y_leches/LEC-007-E1-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-nestle-nan-optipro-1-x-900g-lec-007-e1', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459728/distribuidorababyworld/panales_y_leches/LEC-007-E1-1.png"],"detalles":["Proteína optimizada para el desarrollo saludable","Contiene complejo 5 HMO","Con probiótico B. lactis","Enriquecida con DHA y ARA","Para lactantes de 0 a 6 meses"],"marca":"Nestlé Nan","presentacion":"Lata x 900g","etapaTalla":"Etapa 1 (0-6 meses)","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-008-400 | Fórmula Infantil Baby Klim Etapa 1 Lata x 400g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-008-400') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Infantil Baby Klim Etapa 1 Lata x 400g',
      descripcion = 'Fórmula láctea de inicio en polvo para lactantes de 0 a 6 meses con hierro, zinc y vitaminas.',
      "descripcionWeb" = 'Fórmula láctea de inicio Baby Klim Etapa 1 diseñada especialmente para bebés de 0 a 6 meses. Contiene nutrientes esenciales como proteína, hierro, zinc y vitaminas que apoyan el desarrollo y crecimiento saludable durante sus primeros meses de vida. Preparación fácil y segura para la alimentación complementaria o sustituta.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459738/distribuidorababyworld/panales_y_leches/LEC-008-400-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459738/distribuidorababyworld/panales_y_leches/LEC-008-400-1.png"],"detalles":["Fórmula de inicio para bebés de 0 a 6 meses","Enriquecida con hierro y zinc","Contiene proteínas y vitaminas esenciales","Fácil digestión para lactantes","Contenido neto de 400g en lata"],"marca":"Nestlé","presentacion":"Lata x 400g","etapaTalla":"Etapa 1","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-008-400';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-008-400', 'Fórmula Infantil Baby Klim Etapa 1 Lata x 400g', 'Fórmula láctea de inicio en polvo para lactantes de 0 a 6 meses con hierro, zinc y vitaminas.', 'Fórmula láctea de inicio Baby Klim Etapa 1 diseñada especialmente para bebés de 0 a 6 meses. Contiene nutrientes esenciales como proteína, hierro, zinc y vitaminas que apoyan el desarrollo y crecimiento saludable durante sus primeros meses de vida. Preparación fácil y segura para la alimentación complementaria o sustituta.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459738/distribuidorababyworld/panales_y_leches/LEC-008-400-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-infantil-baby-klim-etapa-1-lata-x-400g-lec-008-400', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459738/distribuidorababyworld/panales_y_leches/LEC-008-400-1.png"],"detalles":["Fórmula de inicio para bebés de 0 a 6 meses","Enriquecida con hierro y zinc","Contiene proteínas y vitaminas esenciales","Fácil digestión para lactantes","Contenido neto de 400g en lata"],"marca":"Nestlé","presentacion":"Lata x 400g","etapaTalla":"Etapa 1","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-009-E2 | Fórmula Infantil Nestlé Baby Klim Etapa 2 x 400g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-009-E2') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Infantil Nestlé Baby Klim Etapa 2 x 400g',
      descripcion = 'Fórmula láctea de continuación en polvo con hierro para bebés de 6 a 12 meses. Lata de 400g.',
      "descripcionWeb" = 'Fórmula infantil de continuación Nestlé Baby Klim Etapa 2, diseñada especialmente para cubrir los requerimientos nutricionales de los lactantes de 6 a 12 meses. Su fórmula contiene proteína adecuada, hierro, zinc y vitaminas esenciales para apoyar el crecimiento y desarrollo saludable de tu bebé. Sigue siempre las recomendaciones del pediatra para su preparación.',
      "precioBase" = 45000,
      "precioWeb" = 45000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459751/distribuidorababyworld/panales_y_leches/LEC-009-E2-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459751/distribuidorababyworld/panales_y_leches/LEC-009-E2-1.png"],"detalles":["Fórmula de continuación para bebés de 6 a 12 meses","Enriquecida con hierro y zinc","Aporte óptimo de proteínas y vitaminas esenciales","Presentación práctica en lata de 400g"],"marca":"Nestle","presentacion":"Lata x 400g","etapaTalla":"Etapa 2","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-009-E2';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-009-E2', 'Fórmula Infantil Nestlé Baby Klim Etapa 2 x 400g', 'Fórmula láctea de continuación en polvo con hierro para bebés de 6 a 12 meses. Lata de 400g.', 'Fórmula infantil de continuación Nestlé Baby Klim Etapa 2, diseñada especialmente para cubrir los requerimientos nutricionales de los lactantes de 6 a 12 meses. Su fórmula contiene proteína adecuada, hierro, zinc y vitaminas esenciales para apoyar el crecimiento y desarrollo saludable de tu bebé. Sigue siempre las recomendaciones del pediatra para su preparación.',
      45000, 45000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459751/distribuidorababyworld/panales_y_leches/LEC-009-E2-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-infantil-nestle-baby-klim-etapa-2-x-400g-lec-009-e2', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459751/distribuidorababyworld/panales_y_leches/LEC-009-E2-1.png"],"detalles":["Fórmula de continuación para bebés de 6 a 12 meses","Enriquecida con hierro y zinc","Aporte óptimo de proteínas y vitaminas esenciales","Presentación práctica en lata de 400g"],"marca":"Nestle","presentacion":"Lata x 400g","etapaTalla":"Etapa 2","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-010-800 | Fórmula Nestlé Baby Klim 2 Etapa 2 x 800g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-010-800') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Nestlé Baby Klim 2 Etapa 2 x 800g',
      descripcion = 'Fórmula láctea de continuación en polvo para lactantes de 6 a 12 meses, con proteína, hierro, zinc y vitaminas.',
      "descripcionWeb" = 'Fórmula láctea de continuación Baby Klim 2 de Nestlé, diseñada especialmente para bebés de 6 a 12 meses. Aporta nutrientes esenciales como proteínas de alta calidad, hierro, zinc y vitaminas que apoyan el crecimiento y desarrollo saludable durante esta etapa de transición alimentaria. Preparación fácil y segura siguiendo las instrucciones del empaque.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459762/distribuidorababyworld/panales_y_leches/LEC-010-800-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459762/distribuidorababyworld/panales_y_leches/LEC-010-800-1.png"],"detalles":["Fórmula de continuación para lactantes de 6 a 12 meses","Enriquecida con proteínas, hierro y zinc","Contiene vitaminas esenciales para el desarrollo","Contenido neto de 800g en presentación de lata"],"marca":"Nestlé Baby Klim","presentacion":"Lata x 800g","etapaTalla":"Etapa 2","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-010-800';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-010-800', 'Fórmula Nestlé Baby Klim 2 Etapa 2 x 800g', 'Fórmula láctea de continuación en polvo para lactantes de 6 a 12 meses, con proteína, hierro, zinc y vitaminas.', 'Fórmula láctea de continuación Baby Klim 2 de Nestlé, diseñada especialmente para bebés de 6 a 12 meses. Aporta nutrientes esenciales como proteínas de alta calidad, hierro, zinc y vitaminas que apoyan el crecimiento y desarrollo saludable durante esta etapa de transición alimentaria. Preparación fácil y segura siguiendo las instrucciones del empaque.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459762/distribuidorababyworld/panales_y_leches/LEC-010-800-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-nestle-baby-klim-2-etapa-2-x-800g-lec-010-800', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459762/distribuidorababyworld/panales_y_leches/LEC-010-800-1.png"],"detalles":["Fórmula de continuación para lactantes de 6 a 12 meses","Enriquecida con proteínas, hierro y zinc","Contiene vitaminas esenciales para el desarrollo","Contenido neto de 800g en presentación de lata"],"marca":"Nestlé Baby Klim","presentacion":"Lata x 800g","etapaTalla":"Etapa 2","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  -- SKU: LEC-011-800 | Fórmula Infantil Baby Klim Etapa 1 Lata x 800g
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'LEC-011-800') THEN
    UPDATE "Producto" SET
      nombre = 'Fórmula Infantil Baby Klim Etapa 1 Lata x 800g',
      descripcion = 'Fórmula láctea de inicio en polvo para lactantes de 0 a 6 meses con hierro, zinc y vitaminas.',
      "descripcionWeb" = 'Baby Klim Etapa 1 es una fórmula láctea de inicio especialmente diseñada para brindar una nutrición equilibrada y adecuada a los lactantes de 0 a 6 meses. Su fórmula contiene nutrientes esenciales como proteína, hierro, zinc y vitaminas que apoyan el desarrollo y crecimiento saludable del bebé durante sus primeros meses de vida.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792459775/distribuidorababyworld/panales_y_leches/LEC-011-800-1.png',
      "categoriaId" = v_cat_alimentacion_id,
      "publicadoWeb" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459775/distribuidorababyworld/panales_y_leches/LEC-011-800-1.png"],"detalles":["Fórmula de inicio para bebés de 0 a 6 meses","Enriquecida con hierro y zinc","Contiene proteínas y vitaminas esenciales","Fórmula láctea en polvo de alta calidad"],"marca":"Nestlé","presentacion":"Lata x 800g","etapaTalla":"0-6 meses","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'LEC-011-800';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'LEC-011-800', 'Fórmula Infantil Baby Klim Etapa 1 Lata x 800g', 'Fórmula láctea de inicio en polvo para lactantes de 0 a 6 meses con hierro, zinc y vitaminas.', 'Baby Klim Etapa 1 es una fórmula láctea de inicio especialmente diseñada para brindar una nutrición equilibrada y adecuada a los lactantes de 0 a 6 meses. Su fórmula contiene nutrientes esenciales como proteína, hierro, zinc y vitaminas que apoyan el desarrollo y crecimiento saludable del bebé durante sus primeros meses de vida.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792459775/distribuidorababyworld/panales_y_leches/LEC-011-800-1.png', v_cat_alimentacion_id, true,
      false, false, 'formula-infantil-baby-klim-etapa-1-lata-x-800g-lec-011-800', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792459775/distribuidorababyworld/panales_y_leches/LEC-011-800-1.png"],"detalles":["Fórmula de inicio para bebés de 0 a 6 meses","Enriquecida con hierro y zinc","Contiene proteínas y vitaminas esenciales","Fórmula láctea en polvo de alta calidad"],"marca":"Nestlé","presentacion":"Lata x 800g","etapaTalla":"0-6 meses","subcategoria":"Fórmulas y Leches","tipoProducto":"LECHE"}'::jsonb, 0, 5, 10,
      NOW(), NOW()
    );
  END IF;

  RAISE NOTICE '✅ Importación de pañales y leches finalizada: % productos en inventario.', 24;
END $$;
