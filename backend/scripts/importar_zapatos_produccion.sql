-- ====================================================================
-- IMPORTACIÓN DE CALZADO (PRODUCCIÓN: OCULTO EN TIENDA / SOLO INVENTARIO)
-- Total productos: 39
-- Fecha de generación: 2026-10-17T02:59:38.672Z
-- ====================================================================

DO $$
DECLARE
  v_empresa_id INT;
  v_categoria_id INT;
BEGIN
  -- 1. Obtener ID de la empresa vinculada a la tienda distribuidorababyworld (o fallback a primera empresa activa)
  SELECT "empresaId" INTO v_empresa_id FROM "ConfiguracionTienda" WHERE "slugTienda" = 'distribuidorababyworld' LIMIT 1;
  IF v_empresa_id IS NULL THEN
    SELECT id INTO v_empresa_id FROM "Empresa" WHERE activo = true LIMIT 1;
  END IF;

  -- 2. Asegurar que exista la categoría 'Calzado'
  SELECT id INTO v_categoria_id FROM "Categoria" WHERE "empresaId" = v_empresa_id AND LOWER(nombre) = 'calzado' LIMIT 1;
  IF v_categoria_id IS NULL THEN
    INSERT INTO "Categoria" ("empresaId", "nombre", "slug", "activo", "createdAt", "updatedAt")
    VALUES (v_empresa_id, 'Calzado', 'calzado', true, NOW(), NOW())
    RETURNING id INTO v_categoria_id;
  END IF;

  -- 2.5 Limpiar registros viejos de Calzado para evitar duplicados o datos viejos de pruebas
  DELETE FROM "Producto" WHERE "empresaId" = v_empresa_id AND "categoriaId" = v_categoria_id;

  -- 3. Insertar cada producto con su SKU único
  -- Producto: ZCS-001-MR - Tenis Casuales Bicolor para Bebé
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-001-MR') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Casuales Bicolor para Bebé',
      descripcion = 'Zapatos casuales en combinación de blanco y marrón con cordones elásticos y diseño ergonómico.',
      "descripcionWeb" = 'Hermosos tenis casuales diseñados especialmente para brindar el máximo confort a los primeros pasos de tu bebé. Su combinación de color blanco y marrón estilo gamuza aporta un toque elegante y moderno. Cuentan con materiales suaves, cuello acolchado y cordones gruesos que aseguran un ajuste cómodo y seguro para el uso diario o ocasiones especiales.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203480/distribuidorababyworld/zapatos/ZCS-001-MR-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203480/distribuidorababyworld/zapatos/ZCS-001-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203481/distribuidorababyworld/zapatos/ZCS-001-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203484/distribuidorababyworld/zapatos/ZCS-001-MR-3.png"],"detalles":["Diseño bicolor elegante en blanco y marrón","Cordones gruesos de gran sujeción","Cuello y lengüeta acolchados para mayor comodidad","Costuras reforzadas de alta durabilidad"],"tallas":["18","19","20","21","22"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-001-MR';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-001-MR', 'Tenis Casuales Bicolor para Bebé', 'Zapatos casuales en combinación de blanco y marrón con cordones elásticos y diseño ergonómico.', 'Hermosos tenis casuales diseñados especialmente para brindar el máximo confort a los primeros pasos de tu bebé. Su combinación de color blanco y marrón estilo gamuza aporta un toque elegante y moderno. Cuentan con materiales suaves, cuello acolchado y cordones gruesos que aseguran un ajuste cómodo y seguro para el uso diario o ocasiones especiales.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203480/distribuidorababyworld/zapatos/ZCS-001-MR-1.png', v_categoria_id, true,
      false, false, 'tenis-casuales-bicolor-para-bebe-zcs-001-mr', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203480/distribuidorababyworld/zapatos/ZCS-001-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203481/distribuidorababyworld/zapatos/ZCS-001-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203484/distribuidorababyworld/zapatos/ZCS-001-MR-3.png"],"detalles":["Diseño bicolor elegante en blanco y marrón","Cordones gruesos de gran sujeción","Cuello y lengüeta acolchados para mayor comodidad","Costuras reforzadas de alta durabilidad"],"tallas":["18","19","20","21","22"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-001-RS - Tenis Rosa Pastel con Detalles Blancos
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-001-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Rosa Pastel con Detalles Blancos',
      descripcion = 'Tenis deportivos rosas con cordones y suela blanca, ideales para los primeros pasos de las niñas.',
      "descripcionWeb" = 'Hermosos tenis en tono rosa pastel diseñados especialmente para brindar máxima comodidad y soporte a las pequeñas. Cuentan con un diseño ergonómico, suela antideslizante con textura para mayor seguridad al caminar, y cordones ajustables que garantizan un ajuste perfecto. Su interior acolchado cuida el pie del bebé en cada paso, siendo el calzado ideal para el uso diario y ocasiones casuales.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203494/distribuidorababyworld/zapatos/ZDP-001-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203494/distribuidorababyworld/zapatos/ZDP-001-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203495/distribuidorababyworld/zapatos/ZDP-001-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203496/distribuidorababyworld/zapatos/ZDP-001-RS-3.png"],"detalles":["Suela antideslizante para mayor seguridad en los primeros pasos","Interior acolchado que brinda comodidad y suavidad","Diseño ergonómico que se adapta al pie del bebé","Cordones ajustables para un ajuste seguro"],"tallas":["18","19","20","21","22"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-001-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-001-RS', 'Tenis Rosa Pastel con Detalles Blancos', 'Tenis deportivos rosas con cordones y suela blanca, ideales para los primeros pasos de las niñas.', 'Hermosos tenis en tono rosa pastel diseñados especialmente para brindar máxima comodidad y soporte a las pequeñas. Cuentan con un diseño ergonómico, suela antideslizante con textura para mayor seguridad al caminar, y cordones ajustables que garantizan un ajuste perfecto. Su interior acolchado cuida el pie del bebé en cada paso, siendo el calzado ideal para el uso diario y ocasiones casuales.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203494/distribuidorababyworld/zapatos/ZDP-001-RS-1.png', v_categoria_id, true,
      false, false, 'tenis-rosa-pastel-con-detalles-blancos-zdp-001-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203494/distribuidorababyworld/zapatos/ZDP-001-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203495/distribuidorababyworld/zapatos/ZDP-001-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203496/distribuidorababyworld/zapatos/ZDP-001-RS-3.png"],"detalles":["Suela antideslizante para mayor seguridad en los primeros pasos","Interior acolchado que brinda comodidad y suavidad","Diseño ergonómico que se adapta al pie del bebé","Cordones ajustables para un ajuste seguro"],"tallas":["18","19","20","21","22"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: BOT-001-MR - Botines Infantiles Casuales Nude
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'BOT-001-MR') THEN
    UPDATE "Producto" SET
      nombre = 'Botines Infantiles Casuales Nude',
      descripcion = 'Botines suaves y elegantes en tonos nude y rosa para los primeros pasos.',
      "descripcionWeb" = 'Estos encantadores botines infantiles están diseñados para brindar la máxima comodidad y soporte en los primeros pasos de tu bebé. Confeccionados con materiales suaves y flexibles, cuentan con un diseño ergonómico que cuida el desarrollo natural del pie. Su suela de goma antideslizante ofrece tracción segura, mientras que su estilo en tonos nude con detalles en rosa claro los hace ideales para cualquier ocasión casual o especial.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203505/distribuidorababyworld/zapatos/BOT-001-MR-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203505/distribuidorababyworld/zapatos/BOT-001-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203506/distribuidorababyworld/zapatos/BOT-001-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203508/distribuidorababyworld/zapatos/BOT-001-MR-3.png"],"detalles":["Suela de goma flexible con relieve antideslizante para mayor seguridad","Diseño ergonómico que respeta el desarrollo natural del pie","Cuello y lengüeta acolchados para un confort superior","Detalle de lengüeta trasera con botón metálico decorativo","Materiales suaves al tacto que evitan rozaduras"],"tallas":["18","19","20","21","22"],"tipoCierre":"Sin cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Botas"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'BOT-001-MR';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'BOT-001-MR', 'Botines Infantiles Casuales Nude', 'Botines suaves y elegantes en tonos nude y rosa para los primeros pasos.', 'Estos encantadores botines infantiles están diseñados para brindar la máxima comodidad y soporte en los primeros pasos de tu bebé. Confeccionados con materiales suaves y flexibles, cuentan con un diseño ergonómico que cuida el desarrollo natural del pie. Su suela de goma antideslizante ofrece tracción segura, mientras que su estilo en tonos nude con detalles en rosa claro los hace ideales para cualquier ocasión casual o especial.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203505/distribuidorababyworld/zapatos/BOT-001-MR-1.png', v_categoria_id, true,
      false, false, 'botines-infantiles-casuales-nude-bot-001-mr', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203505/distribuidorababyworld/zapatos/BOT-001-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203506/distribuidorababyworld/zapatos/BOT-001-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203508/distribuidorababyworld/zapatos/BOT-001-MR-3.png"],"detalles":["Suela de goma flexible con relieve antideslizante para mayor seguridad","Diseño ergonómico que respeta el desarrollo natural del pie","Cuello y lengüeta acolchados para un confort superior","Detalle de lengüeta trasera con botón metálico decorativo","Materiales suaves al tacto que evitan rozaduras"],"tallas":["18","19","20","21","22"],"tipoCierre":"Sin cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Botas"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-002-RS - Tenis Casuales Rosados Infantiles
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-002-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Casuales Rosados Infantiles',
      descripcion = 'Tenis casuales para bebé con diseño cómodo y tierno color rosa.',
      "descripcionWeb" = 'Hermosos tenis casuales diseñados especialmente para los más pequeños. Ofrecen una excelente comodidad y soporte ergonómico para sus primeros pasos. Confeccionados con materiales suaves y transpirables, cuentan con un diseño encantador en tonos rosados ideales para cualquier ocasión de uso diario.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203517/distribuidorababyworld/zapatos/ZCS-002-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203517/distribuidorababyworld/zapatos/ZCS-002-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203518/distribuidorababyworld/zapatos/ZCS-002-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203519/distribuidorababyworld/zapatos/ZCS-002-RS-3.png"],"detalles":["Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada para máxima comodidad","Material suave que cuida la piel del bebé","Diseño ergonómico para el desarrollo natural del pie"],"tallas":["18","19","20","21","22"],"tipoCierre":"Sin cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-002-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-002-RS', 'Tenis Casuales Rosados Infantiles', 'Tenis casuales para bebé con diseño cómodo y tierno color rosa.', 'Hermosos tenis casuales diseñados especialmente para los más pequeños. Ofrecen una excelente comodidad y soporte ergonómico para sus primeros pasos. Confeccionados con materiales suaves y transpirables, cuentan con un diseño encantador en tonos rosados ideales para cualquier ocasión de uso diario.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203517/distribuidorababyworld/zapatos/ZCS-002-RS-1.png', v_categoria_id, true,
      false, false, 'tenis-casuales-rosados-infantiles-zcs-002-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203517/distribuidorababyworld/zapatos/ZCS-002-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203518/distribuidorababyworld/zapatos/ZCS-002-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203519/distribuidorababyworld/zapatos/ZCS-002-RS-3.png"],"detalles":["Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada para máxima comodidad","Material suave que cuida la piel del bebé","Diseño ergonómico para el desarrollo natural del pie"],"tallas":["18","19","20","21","22"],"tipoCierre":"Sin cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-003-RS - Zapatos Casuales Flores Perladas
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-003-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Zapatos Casuales Flores Perladas',
      descripcion = 'Zapatos casuales para niña con diseño de flor, perlas y plantilla acolchada.',
      "descripcionWeb" = 'Hermosos y cómodos zapatos casuales diseñados especialmente para las más pequeñas. Confeccionados en cuero sintético de alta calidad y detalles brillantes en tono rosa. Cuentan con un cierre ajustable tipo hebilla con velcro, plantilla suave con divertido estampado de huellas de colores, y un delicado detalle floral con perlas en el lateral. Perfectos para ocasiones especiales o uso diario, brindando comodidad y soporte ergonómico para sus primeros pasos.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203529/distribuidorababyworld/zapatos/ZCS-003-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203529/distribuidorababyworld/zapatos/ZCS-003-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203530/distribuidorababyworld/zapatos/ZCS-003-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203532/distribuidorababyworld/zapatos/ZCS-003-RS-3.png"],"detalles":["Diseño con detalle de flor y perlas decorativas","Plantilla interior acolchada con divertido estampado colorido","Cierre ajustable seguro para mayor practicidad","Suela exterior flexible y antideslizante ideal para primeros pasos","Acabado brillante en la parte posterior"],"tallas":["18","19","20","21","22"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-003-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-003-RS', 'Zapatos Casuales Flores Perladas', 'Zapatos casuales para niña con diseño de flor, perlas y plantilla acolchada.', 'Hermosos y cómodos zapatos casuales diseñados especialmente para las más pequeñas. Confeccionados en cuero sintético de alta calidad y detalles brillantes en tono rosa. Cuentan con un cierre ajustable tipo hebilla con velcro, plantilla suave con divertido estampado de huellas de colores, y un delicado detalle floral con perlas en el lateral. Perfectos para ocasiones especiales o uso diario, brindando comodidad y soporte ergonómico para sus primeros pasos.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203529/distribuidorababyworld/zapatos/ZCS-003-RS-1.png', v_categoria_id, true,
      false, false, 'zapatos-casuales-flores-perladas-zcs-003-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203529/distribuidorababyworld/zapatos/ZCS-003-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203530/distribuidorababyworld/zapatos/ZCS-003-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203532/distribuidorababyworld/zapatos/ZCS-003-RS-3.png"],"detalles":["Diseño con detalle de flor y perlas decorativas","Plantilla interior acolchada con divertido estampado colorido","Cierre ajustable seguro para mayor practicidad","Suela exterior flexible y antideslizante ideal para primeros pasos","Acabado brillante en la parte posterior"],"tallas":["18","19","20","21","22"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-004-MR - Tenis Casuales Infantiles Acolchados Ocre
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-004-MR') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Casuales Infantiles Acolchados Ocre',
      descripcion = 'Tenis estilo botín para bebé en color ocre con detalles blancos, cómodos y seguros.',
      "descripcionWeb" = 'Estos encantadores tenis estilo botín están diseñados para brindar el máximo confort y soporte a los primeros pasos de tu bebé. Con una estructura acolchada en el cuello y la lengüeta, aseguran una pisada suave y protegida. Su diseño combina un tono ocre cálido con refuerzos blancos en el talón y un detalle de botón metálico, ofreciendo estilo y durabilidad para cualquier ocasión diaria.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203541/distribuidorababyworld/zapatos/ZCS-004-MR-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203541/distribuidorababyworld/zapatos/ZCS-004-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203542/distribuidorababyworld/zapatos/ZCS-004-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203544/distribuidorababyworld/zapatos/ZCS-004-MR-3.png"],"detalles":["Diseño tipo botín que brinda mayor soporte al tobillo","Cuello y lengüeta altamente acolchados para máxima comodidad","Material exterior resistente con combinación de tonos ocre y blanco","Suela antideslizante ideal para brindar estabilidad en los primeros pasos","Interior transpirable que mantiene los pies frescos y secos"],"tallas":["18","19","20","21","22","23"],"tipoCierre":"Cordón","material":"Cuero sintético / Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-004-MR';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-004-MR', 'Tenis Casuales Infantiles Acolchados Ocre', 'Tenis estilo botín para bebé en color ocre con detalles blancos, cómodos y seguros.', 'Estos encantadores tenis estilo botín están diseñados para brindar el máximo confort y soporte a los primeros pasos de tu bebé. Con una estructura acolchada en el cuello y la lengüeta, aseguran una pisada suave y protegida. Su diseño combina un tono ocre cálido con refuerzos blancos en el talón y un detalle de botón metálico, ofreciendo estilo y durabilidad para cualquier ocasión diaria.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203541/distribuidorababyworld/zapatos/ZCS-004-MR-1.png', v_categoria_id, true,
      false, false, 'tenis-casuales-infantiles-acolchados-ocre-zcs-004-mr', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203541/distribuidorababyworld/zapatos/ZCS-004-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203542/distribuidorababyworld/zapatos/ZCS-004-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203544/distribuidorababyworld/zapatos/ZCS-004-MR-3.png"],"detalles":["Diseño tipo botín que brinda mayor soporte al tobillo","Cuello y lengüeta altamente acolchados para máxima comodidad","Material exterior resistente con combinación de tonos ocre y blanco","Suela antideslizante ideal para brindar estabilidad en los primeros pasos","Interior transpirable que mantiene los pies frescos y secos"],"tallas":["18","19","20","21","22","23"],"tipoCierre":"Cordón","material":"Cuero sintético / Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-002-SU - Tenis Infantiles Colorblock
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-002-SU') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Infantiles Colorblock',
      descripcion = 'Tenis deportivos infantiles con diseño moderno y combinación de colores vibrantes para mayor comodidad.',
      "descripcionWeb" = 'Estos tenis deportivos para bebé combinan estilo y ergonomía. Su diseño en azul marino con detalles en naranja y suela blanca texturizada ofrece un soporte ideal para los primeros pasos. Fabricados con materiales transpirables, garantizan frescura y comodidad durante todo el día, siendo perfectos para el uso diario o paseos al aire libre.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203554/distribuidorababyworld/zapatos/ZDP-002-SU-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203554/distribuidorababyworld/zapatos/ZDP-002-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203555/distribuidorababyworld/zapatos/ZDP-002-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203556/distribuidorababyworld/zapatos/ZDP-002-SU-3.png"],"detalles":["Diseño ergonómico ideal para el desarrollo del pie del bebé","Materiales ligeros y transpirables para mayor frescura","Suela texturizada para mayor agarre y seguridad","Cuello acolchado para proteger el tobillo"],"tallas":["18","19","20","21","22"],"tipoCierre":"Sin cordón","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-002-SU';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-002-SU', 'Tenis Infantiles Colorblock', 'Tenis deportivos infantiles con diseño moderno y combinación de colores vibrantes para mayor comodidad.', 'Estos tenis deportivos para bebé combinan estilo y ergonomía. Su diseño en azul marino con detalles en naranja y suela blanca texturizada ofrece un soporte ideal para los primeros pasos. Fabricados con materiales transpirables, garantizan frescura y comodidad durante todo el día, siendo perfectos para el uso diario o paseos al aire libre.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203554/distribuidorababyworld/zapatos/ZDP-002-SU-1.png', v_categoria_id, true,
      false, false, 'tenis-infantiles-colorblock-zdp-002-su', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203554/distribuidorababyworld/zapatos/ZDP-002-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203555/distribuidorababyworld/zapatos/ZDP-002-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203556/distribuidorababyworld/zapatos/ZDP-002-SU-3.png"],"detalles":["Diseño ergonómico ideal para el desarrollo del pie del bebé","Materiales ligeros y transpirables para mayor frescura","Suela texturizada para mayor agarre y seguridad","Cuello acolchado para proteger el tobillo"],"tallas":["18","19","20","21","22"],"tipoCierre":"Sin cordón","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-005-BL - Zapatos Elegantes Blancos con Brillo para Bebé
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-005-BL') THEN
    UPDATE "Producto" SET
      nombre = 'Zapatos Elegantes Blancos con Brillo para Bebé',
      descripcion = 'Hermosos zapatos blancos con detalles brillantes y correa ajustable, ideales para fiestas y ocasiones especiales.',
      "descripcionWeb" = 'Estos encantadores zapatos para bebé combinan elegancia y confort en un diseño clásico tipo merceditas. Elaborados con materiales suaves y acabados brillantes que aportan un toque delicado. Cuentan con una correa de sujeción ajustable con hebilla y un diseño ergonómico que cuida los primeros pasos de tu pequeña en bautizos, bodas y eventos formales.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203565/distribuidorababyworld/zapatos/ZCS-005-BL-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203565/distribuidorababyworld/zapatos/ZCS-005-BL-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203566/distribuidorababyworld/zapatos/ZCS-005-BL-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203568/distribuidorababyworld/zapatos/ZCS-005-BL-3.png"],"detalles":["Diseño elegante con sutil acabado brillante","Correa ajustable con hebilla para mayor sujeción","Interior suave y acolchado para máxima comodidad","Suela flexible ideal para el desarrollo del pie"],"tallas":["15","16","17","18","19"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-005-BL';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-005-BL', 'Zapatos Elegantes Blancos con Brillo para Bebé', 'Hermosos zapatos blancos con detalles brillantes y correa ajustable, ideales para fiestas y ocasiones especiales.', 'Estos encantadores zapatos para bebé combinan elegancia y confort en un diseño clásico tipo merceditas. Elaborados con materiales suaves y acabados brillantes que aportan un toque delicado. Cuentan con una correa de sujeción ajustable con hebilla y un diseño ergonómico que cuida los primeros pasos de tu pequeña en bautizos, bodas y eventos formales.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203565/distribuidorababyworld/zapatos/ZCS-005-BL-1.png', v_categoria_id, true,
      false, false, 'zapatos-elegantes-blancos-con-brillo-para-bebe-zcs-005-bl', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203565/distribuidorababyworld/zapatos/ZCS-005-BL-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203566/distribuidorababyworld/zapatos/ZCS-005-BL-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203568/distribuidorababyworld/zapatos/ZCS-005-BL-3.png"],"detalles":["Diseño elegante con sutil acabado brillante","Correa ajustable con hebilla para mayor sujeción","Interior suave y acolchado para máxima comodidad","Suela flexible ideal para el desarrollo del pie"],"tallas":["15","16","17","18","19"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-006-MR - Tenis Casuales Elegantes Beige y Azul
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-006-MR') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Casuales Elegantes Beige y Azul',
      descripcion = 'Tenis infantiles casuales en tono beige con detalles en azul oscuro y suela de goma.',
      "descripcionWeb" = 'Estos tenis casuales combinan estilo y comodidad para los más pequeños. Con un diseño moderno en tonos beige y azul oscuro, ofrecen un excelente soporte gracias a su cuello acolchado y suela antideslizante. Ideales para el uso diario y ocasiones especiales, garantizan confort y seguridad en cada paso.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203578/distribuidorababyworld/zapatos/ZCS-006-MR-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203578/distribuidorababyworld/zapatos/ZCS-006-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203579/distribuidorababyworld/zapatos/ZCS-006-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203580/distribuidorababyworld/zapatos/ZCS-006-MR-3.png"],"detalles":["Diseño ergonómico y acolchado para mayor comodidad en el talón","Suela de goma antideslizante que brinda estabilidad","Materiales suaves y resistentes ideales para el uso diario","Cuello acolchado para proteger el tobillo del niño"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-006-MR';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-006-MR', 'Tenis Casuales Elegantes Beige y Azul', 'Tenis infantiles casuales en tono beige con detalles en azul oscuro y suela de goma.', 'Estos tenis casuales combinan estilo y comodidad para los más pequeños. Con un diseño moderno en tonos beige y azul oscuro, ofrecen un excelente soporte gracias a su cuello acolchado y suela antideslizante. Ideales para el uso diario y ocasiones especiales, garantizan confort y seguridad en cada paso.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203578/distribuidorababyworld/zapatos/ZCS-006-MR-1.png', v_categoria_id, true,
      false, false, 'tenis-casuales-elegantes-beige-y-azul-zcs-006-mr', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203578/distribuidorababyworld/zapatos/ZCS-006-MR-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203579/distribuidorababyworld/zapatos/ZCS-006-MR-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203580/distribuidorababyworld/zapatos/ZCS-006-MR-3.png"],"detalles":["Diseño ergonómico y acolchado para mayor comodidad en el talón","Suela de goma antideslizante que brinda estabilidad","Materiales suaves y resistentes ideales para el uso diario","Cuello acolchado para proteger el tobillo del niño"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-003-RS - Tenis Brillantes Glam Rosa
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-003-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Brillantes Glam Rosa',
      descripcion = 'Tenis infantiles rosas con detalles brillantes y cierre de velcro para niñas.',
      "descripcionWeb" = 'Hermosos tenis para niñas con un diseño brillante y llamativo. Cuentan con detalles en purpurina, acabados metalizados en tono rosa y cordones elásticos decorativos acompañados de una práctica correa de velcro para un ajuste rápido y seguro. Su suela de goma blanca ofrece gran tracción y comodidad, ideales para el uso diario y ocasiones especiales.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203589/distribuidorababyworld/zapatos/ZDP-003-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203589/distribuidorababyworld/zapatos/ZDP-003-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203591/distribuidorababyworld/zapatos/ZDP-003-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203592/distribuidorababyworld/zapatos/ZDP-003-RS-3.png"],"detalles":["Diseño brillante con purpurina y acabado metalizado en tonos rosa","Práctico sistema de cierre con velcro y cordones elásticos","Suela de goma antideslizante para mayor seguridad al caminar","Interior acolchado para garantizar la máxima comodidad todo el día"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-003-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-003-RS', 'Tenis Brillantes Glam Rosa', 'Tenis infantiles rosas con detalles brillantes y cierre de velcro para niñas.', 'Hermosos tenis para niñas con un diseño brillante y llamativo. Cuentan con detalles en purpurina, acabados metalizados en tono rosa y cordones elásticos decorativos acompañados de una práctica correa de velcro para un ajuste rápido y seguro. Su suela de goma blanca ofrece gran tracción y comodidad, ideales para el uso diario y ocasiones especiales.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203589/distribuidorababyworld/zapatos/ZDP-003-RS-1.png', v_categoria_id, true,
      false, false, 'tenis-brillantes-glam-rosa-zdp-003-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203589/distribuidorababyworld/zapatos/ZDP-003-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203591/distribuidorababyworld/zapatos/ZDP-003-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203592/distribuidorababyworld/zapatos/ZDP-003-RS-3.png"],"detalles":["Diseño brillante con purpurina y acabado metalizado en tonos rosa","Práctico sistema de cierre con velcro y cordones elásticos","Suela de goma antideslizante para mayor seguridad al caminar","Interior acolchado para garantizar la máxima comodidad todo el día"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-004-SU - Tenis Pastel Infantil Confort
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-004-SU') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Pastel Infantil Confort',
      descripcion = 'Tenis deportivos color pastel con diseño ergonómico y suela antideslizante para los primeros pasos.',
      "descripcionWeb" = 'Hermosos tenis deportivos infantiles diseñados para brindar la máxima comodidad y soporte en cada paso. Fabricados con materiales suaves y transpirables, cuentan con una plantilla acolchada que cuida los pies delicados de los más pequeños. Su diseño en tonos pastel con cordones elásticos combina estilo y practicidad para el uso diario.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203601/distribuidorababyworld/zapatos/ZDP-004-SU-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203601/distribuidorababyworld/zapatos/ZDP-004-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203602/distribuidorababyworld/zapatos/ZDP-004-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203603/distribuidorababyworld/zapatos/ZDP-004-SU-3.png"],"detalles":["Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada para máxima comodidad y soporte","Materiales suaves y transpirables que cuidan la piel","Diseño ligero ideal para el uso diario y primeros pasos"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Elástico","material":"Malla transpirable","genero":"Niña","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-004-SU';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-004-SU', 'Tenis Pastel Infantil Confort', 'Tenis deportivos color pastel con diseño ergonómico y suela antideslizante para los primeros pasos.', 'Hermosos tenis deportivos infantiles diseñados para brindar la máxima comodidad y soporte en cada paso. Fabricados con materiales suaves y transpirables, cuentan con una plantilla acolchada que cuida los pies delicados de los más pequeños. Su diseño en tonos pastel con cordones elásticos combina estilo y practicidad para el uso diario.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203601/distribuidorababyworld/zapatos/ZDP-004-SU-1.png', v_categoria_id, true,
      false, false, 'tenis-pastel-infantil-confort-zdp-004-su', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203601/distribuidorababyworld/zapatos/ZDP-004-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203602/distribuidorababyworld/zapatos/ZDP-004-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203603/distribuidorababyworld/zapatos/ZDP-004-SU-3.png"],"detalles":["Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada para máxima comodidad y soporte","Materiales suaves y transpirables que cuidan la piel","Diseño ligero ideal para el uso diario y primeros pasos"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Elástico","material":"Malla transpirable","genero":"Niña","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-007-AZ - Tenis Casuales Infantiles Azul Marino
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-007-AZ') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Casuales Infantiles Azul Marino',
      descripcion = 'Tenis cómodos y modernos para los más pequeños, con diseño bicolor y suela antideslizante.',
      "descripcionWeb" = 'Brinda el máximo confort y estilo a los primeros pasos de tu bebé con estos tenis casuales. Fabricados con materiales suaves y resistentes, cuentan con una plantilla acolchada para mayor ergonomía, cuello acolchado que cuida el tobillo y una suela de alta tracción para prevenir resbalones. Ideales para el uso diario y ocasiones especiales.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203613/distribuidorababyworld/zapatos/ZCS-007-AZ-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203613/distribuidorababyworld/zapatos/ZCS-007-AZ-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203615/distribuidorababyworld/zapatos/ZCS-007-AZ-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203616/distribuidorababyworld/zapatos/ZCS-007-AZ-3.png"],"detalles":["Suela antideslizante que aporta mayor estabilidad y seguridad al caminar","Plantilla interior acolchada para una pisada suave y ergonómica","Cuello y lengüeta acolchados que brindan máximo confort en el tobillo","Materiales duraderos y de fácil limpieza para el uso diario"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-007-AZ';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-007-AZ', 'Tenis Casuales Infantiles Azul Marino', 'Tenis cómodos y modernos para los más pequeños, con diseño bicolor y suela antideslizante.', 'Brinda el máximo confort y estilo a los primeros pasos de tu bebé con estos tenis casuales. Fabricados con materiales suaves y resistentes, cuentan con una plantilla acolchada para mayor ergonomía, cuello acolchado que cuida el tobillo y una suela de alta tracción para prevenir resbalones. Ideales para el uso diario y ocasiones especiales.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203613/distribuidorababyworld/zapatos/ZCS-007-AZ-1.png', v_categoria_id, true,
      false, false, 'tenis-casuales-infantiles-azul-marino-zcs-007-az', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203613/distribuidorababyworld/zapatos/ZCS-007-AZ-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203615/distribuidorababyworld/zapatos/ZCS-007-AZ-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203616/distribuidorababyworld/zapatos/ZCS-007-AZ-3.png"],"detalles":["Suela antideslizante que aporta mayor estabilidad y seguridad al caminar","Plantilla interior acolchada para una pisada suave y ergonómica","Cuello y lengüeta acolchados que brindan máximo confort en el tobillo","Materiales duraderos y de fácil limpieza para el uso diario"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-008-BL - Zapatos Casuales Infantiles Blancos con Rosa
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-008-BL') THEN
    UPDATE "Producto" SET
      nombre = 'Zapatos Casuales Infantiles Blancos con Rosa',
      descripcion = 'Zapatos casuales para niña con detalles en rosa, diseño cómodo y seguro para los primeros pasos.',
      "descripcionWeb" = 'Encantadores zapatos de estilo casual diseñados especialmente para el uso diario de las más pequeñas. Combinan un tono blanco perlado con detalles en rosa suave que aportan un toque tierno. Cuentan con un interior acolchado para mayor confort, suela de goma antideslizante para brindar estabilidad en cada paso y un práctico sistema de ajuste lateral con hebilla y velcro que facilita su colocación.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203626/distribuidorababyworld/zapatos/ZCS-008-BL-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203626/distribuidorababyworld/zapatos/ZCS-008-BL-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203627/distribuidorababyworld/zapatos/ZCS-008-BL-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203628/distribuidorababyworld/zapatos/ZCS-008-BL-3.png"],"detalles":["Suela de goma antideslizante para mayor seguridad al caminar","Interior totalmente acolchado y cómodo para el pie del bebé","Sistema de cierre lateral ajustable para un ajuste perfecto","Diseño ligero y flexible ideal para los primeros pasos"],"tallas":["18","19","20","21","22"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-008-BL';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-008-BL', 'Zapatos Casuales Infantiles Blancos con Rosa', 'Zapatos casuales para niña con detalles en rosa, diseño cómodo y seguro para los primeros pasos.', 'Encantadores zapatos de estilo casual diseñados especialmente para el uso diario de las más pequeñas. Combinan un tono blanco perlado con detalles en rosa suave que aportan un toque tierno. Cuentan con un interior acolchado para mayor confort, suela de goma antideslizante para brindar estabilidad en cada paso y un práctico sistema de ajuste lateral con hebilla y velcro que facilita su colocación.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203626/distribuidorababyworld/zapatos/ZCS-008-BL-1.png', v_categoria_id, true,
      false, false, 'zapatos-casuales-infantiles-blancos-con-rosa-zcs-008-bl', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203626/distribuidorababyworld/zapatos/ZCS-008-BL-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203627/distribuidorababyworld/zapatos/ZCS-008-BL-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203628/distribuidorababyworld/zapatos/ZCS-008-BL-3.png"],"detalles":["Suela de goma antideslizante para mayor seguridad al caminar","Interior totalmente acolchado y cómodo para el pie del bebé","Sistema de cierre lateral ajustable para un ajuste perfecto","Diseño ligero y flexible ideal para los primeros pasos"],"tallas":["18","19","20","21","22"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-005-BL - Tenis Casuales Deportivos Blancos con Verde
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-005-BL') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Casuales Deportivos Blancos con Verde',
      descripcion = 'Tenis deportivos infantiles en color blanco con detalles verdes y grises.',
      "descripcionWeb" = 'Estos tenis deportivos infantiles combinan estilo y comodidad para el uso diario. Fabricados con materiales duraderos y suaves, cuentan con un diseño ergonómico que se adapta perfectamente al pie de los más pequeños. Su suela de gran agarre y detalles acolchados brindan soporte y seguridad en cada paso, ideales para cualquier ocasión casual o de juego.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203638/distribuidorababyworld/zapatos/ZDP-005-BL-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203638/distribuidorababyworld/zapatos/ZDP-005-BL-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203639/distribuidorababyworld/zapatos/ZDP-005-BL-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203640/distribuidorababyworld/zapatos/ZDP-005-BL-3.png"],"detalles":["Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada que brinda confort prolongado","Diseño ergonómico que cuida el desarrollo del pie","Materiales duraderos y fáciles de limpiar","Detalles en contraste de color verde y gris"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-005-BL';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-005-BL', 'Tenis Casuales Deportivos Blancos con Verde', 'Tenis deportivos infantiles en color blanco con detalles verdes y grises.', 'Estos tenis deportivos infantiles combinan estilo y comodidad para el uso diario. Fabricados con materiales duraderos y suaves, cuentan con un diseño ergonómico que se adapta perfectamente al pie de los más pequeños. Su suela de gran agarre y detalles acolchados brindan soporte y seguridad en cada paso, ideales para cualquier ocasión casual o de juego.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203638/distribuidorababyworld/zapatos/ZDP-005-BL-1.png', v_categoria_id, true,
      false, false, 'tenis-casuales-deportivos-blancos-con-verde-zdp-005-bl', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203638/distribuidorababyworld/zapatos/ZDP-005-BL-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203639/distribuidorababyworld/zapatos/ZDP-005-BL-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203640/distribuidorababyworld/zapatos/ZDP-005-BL-3.png"],"detalles":["Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada que brinda confort prolongado","Diseño ergonómico que cuida el desarrollo del pie","Materiales duraderos y fáciles de limpiar","Detalles en contraste de color verde y gris"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-009-NG - Tenis Urbanos Con Cadena Y Puntera Blanca
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-009-NG') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Urbanos Con Cadena Y Puntera Blanca',
      descripcion = 'Tenis modernos con detalle de cadena dorada, diseño elegante y cómodo para el día a día.',
      "descripcionWeb" = 'Estos tenis urbanos combinan estilo y comodidad a la perfección. Cuentan con un diseño llamativo en color negro con detalles texturizados, una elegante cadena dorada decorativa en el lateral y una clásica puntera blanca texturizada. Su suela de goma flexible y plantilla acolchada aseguran la máxima comodidad y ergonomía durante todo el día. Ideales para ocasiones casuales y para destacar con un look moderno.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203650/distribuidorababyworld/zapatos/ZCS-009-NG-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203650/distribuidorababyworld/zapatos/ZCS-009-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203651/distribuidorababyworld/zapatos/ZCS-009-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203653/distribuidorababyworld/zapatos/ZCS-009-NG-3.png"],"detalles":["Detalle decorativo de cadena dorada con dijes en forma de corazón","Puntera de goma blanca texturizada para mayor durabilidad","Suela de goma antideslizante que brinda excelente tracción","Interior acolchado para mayor confort y soporte diario"],"tallas":["24","25","26","27","28","29"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-009-NG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-009-NG', 'Tenis Urbanos Con Cadena Y Puntera Blanca', 'Tenis modernos con detalle de cadena dorada, diseño elegante y cómodo para el día a día.', 'Estos tenis urbanos combinan estilo y comodidad a la perfección. Cuentan con un diseño llamativo en color negro con detalles texturizados, una elegante cadena dorada decorativa en el lateral y una clásica puntera blanca texturizada. Su suela de goma flexible y plantilla acolchada aseguran la máxima comodidad y ergonomía durante todo el día. Ideales para ocasiones casuales y para destacar con un look moderno.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203650/distribuidorababyworld/zapatos/ZCS-009-NG-1.png', v_categoria_id, true,
      false, false, 'tenis-urbanos-con-cadena-y-puntera-blanca-zcs-009-ng', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203650/distribuidorababyworld/zapatos/ZCS-009-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203651/distribuidorababyworld/zapatos/ZCS-009-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203653/distribuidorababyworld/zapatos/ZCS-009-NG-3.png"],"detalles":["Detalle decorativo de cadena dorada con dijes en forma de corazón","Puntera de goma blanca texturizada para mayor durabilidad","Suela de goma antideslizante que brinda excelente tracción","Interior acolchado para mayor confort y soporte diario"],"tallas":["24","25","26","27","28","29"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-010-AZ - Tenis Urbanos Blessd Azul Marino
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-010-AZ') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Urbanos Blessd Azul Marino',
      descripcion = 'Tenis casuales para niños con diseño moderno, cordones y detalle metálico en el empeine.',
      "descripcionWeb" = 'Brinda a tu pequeño el máximo estilo y comodidad con estos tenis urbanos en color azul marino. Diseñados con materiales sintéticos de alta durabilidad, presentan una plantilla acolchada para soporte ergonómico diario, suela de goma antideslizantes y un toque moderno con placa metálica frontal. Ideales para cualquier ocasión casual.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203664/distribuidorababyworld/zapatos/ZCS-010-AZ-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203664/distribuidorababyworld/zapatos/ZCS-010-AZ-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203665/distribuidorababyworld/zapatos/ZCS-010-AZ-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203666/distribuidorababyworld/zapatos/ZCS-010-AZ-3.png"],"detalles":["Suela de goma antideslizante para mayor seguridad al caminar","Plantilla interior acolchada que garantiza comodidad durante todo el día","Diseño moderno con aplique metálico decorativo en los cordones","Estructura resistente de cuero sintético y costuras reforzadas"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niño","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-010-AZ';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-010-AZ', 'Tenis Urbanos Blessd Azul Marino', 'Tenis casuales para niños con diseño moderno, cordones y detalle metálico en el empeine.', 'Brinda a tu pequeño el máximo estilo y comodidad con estos tenis urbanos en color azul marino. Diseñados con materiales sintéticos de alta durabilidad, presentan una plantilla acolchada para soporte ergonómico diario, suela de goma antideslizantes y un toque moderno con placa metálica frontal. Ideales para cualquier ocasión casual.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203664/distribuidorababyworld/zapatos/ZCS-010-AZ-1.png', v_categoria_id, true,
      false, false, 'tenis-urbanos-blessd-azul-marino-zcs-010-az', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203664/distribuidorababyworld/zapatos/ZCS-010-AZ-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203665/distribuidorababyworld/zapatos/ZCS-010-AZ-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203666/distribuidorababyworld/zapatos/ZCS-010-AZ-3.png"],"detalles":["Suela de goma antideslizante para mayor seguridad al caminar","Plantilla interior acolchada que garantiza comodidad durante todo el día","Diseño moderno con aplique metálico decorativo en los cordones","Estructura resistente de cuero sintético y costuras reforzadas"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niño","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZCS-011-RS - Tenis Rosa Fashion Osito y Corazón
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-011-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Rosa Fashion Osito y Corazón',
      descripcion = 'Tenis casuales para niña en color rosa con detalles dorados, dije de osito y aplique de corazón.',
      "descripcionWeb" = 'Hermosos y tiernos tenis casuales para niña diseñados para brindar la máxima comodidad y estilo en su día a día. Cuentan con un tierno dije de osito en los cordones, un delicado parche de corazón con detalles brillantes en el lateral y tachuelas doradas en la puntera. Elaborados con materiales sintéticos suaves y una suela flexible y antideslizante que asegura cada paso, siendo perfectos para paseos, fiestas o uso diario.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203676/distribuidorababyworld/zapatos/ZCS-011-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = true,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203676/distribuidorababyworld/zapatos/ZCS-011-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203676/distribuidorababyworld/zapatos/ZCS-011-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203677/distribuidorababyworld/zapatos/ZCS-011-RS-3.png"],"detalles":["Suela antideslizante de goma ligera para mayor seguridad al caminar","Plantilla acolchada que garantiza comodidad durante todo el día","Diseño encantador con dije de osito y detalles dorados","Material sintético de alta calidad fácil de limpiar"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZCS-011-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZCS-011-RS', 'Tenis Rosa Fashion Osito y Corazón', 'Tenis casuales para niña en color rosa con detalles dorados, dije de osito y aplique de corazón.', 'Hermosos y tiernos tenis casuales para niña diseñados para brindar la máxima comodidad y estilo en su día a día. Cuentan con un tierno dije de osito en los cordones, un delicado parche de corazón con detalles brillantes en el lateral y tachuelas doradas en la puntera. Elaborados con materiales sintéticos suaves y una suela flexible y antideslizante que asegura cada paso, siendo perfectos para paseos, fiestas o uso diario.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203676/distribuidorababyworld/zapatos/ZCS-011-RS-1.png', v_categoria_id, true,
      false, true, 'tenis-rosa-fashion-osito-y-corazon-zcs-011-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203676/distribuidorababyworld/zapatos/ZCS-011-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203676/distribuidorababyworld/zapatos/ZCS-011-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203677/distribuidorababyworld/zapatos/ZCS-011-RS-3.png"],"detalles":["Suela antideslizante de goma ligera para mayor seguridad al caminar","Plantilla acolchada que garantiza comodidad durante todo el día","Diseño encantador con dije de osito y detalles dorados","Material sintético de alta calidad fácil de limpiar"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Casuales"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-006-NG - Tenis Deportivos Infantiles Negro y Rosa
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-006-NG') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Deportivos Infantiles Negro y Rosa',
      descripcion = 'Tenis deportivos cómodos y modernos para niños con detalles en rosa y suela moteada.',
      "descripcionWeb" = 'Estos tenis deportivos combinan estilo y funcionalidad para los más pequeños. Con un diseño moderno en color negro y detalles en rosa, ofrecen una excelente comodidad gracias a su estructura acolchada y materiales transpirables. Ideales para el uso diario, juegos y actividades al aire libre, garantizan soporte y seguridad en cada paso.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203688/distribuidorababyworld/zapatos/ZDP-006-NG-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203688/distribuidorababyworld/zapatos/ZDP-006-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203689/distribuidorababyworld/zapatos/ZDP-006-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203690/distribuidorababyworld/zapatos/ZDP-006-NG-3.png"],"detalles":["Suela antideslizante con diseño moteado para mayor tracción","Plantilla acolchada para máxima comodidad durante todo el día","Cordones ajustables con sistema de bloqueo rápido","Materiales ligeros y transpirables para frescura constante"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Niña","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-006-NG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-006-NG', 'Tenis Deportivos Infantiles Negro y Rosa', 'Tenis deportivos cómodos y modernos para niños con detalles en rosa y suela moteada.', 'Estos tenis deportivos combinan estilo y funcionalidad para los más pequeños. Con un diseño moderno en color negro y detalles en rosa, ofrecen una excelente comodidad gracias a su estructura acolchada y materiales transpirables. Ideales para el uso diario, juegos y actividades al aire libre, garantizan soporte y seguridad en cada paso.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203688/distribuidorababyworld/zapatos/ZDP-006-NG-1.png', v_categoria_id, true,
      false, false, 'tenis-deportivos-infantiles-negro-y-rosa-zdp-006-ng', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203688/distribuidorababyworld/zapatos/ZDP-006-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203689/distribuidorababyworld/zapatos/ZDP-006-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203690/distribuidorababyworld/zapatos/ZDP-006-NG-3.png"],"detalles":["Suela antideslizante con diseño moteado para mayor tracción","Plantilla acolchada para máxima comodidad durante todo el día","Cordones ajustables con sistema de bloqueo rápido","Materiales ligeros y transpirables para frescura constante"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Niña","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-007-AZ - Tenis Infantiles Paw Patrol Azul y Amarillo
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-007-AZ') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Infantiles Paw Patrol Azul y Amarillo',
      descripcion = 'Tenis deportivos coloridos con temática de Paw Patrol y cordones.',
      "descripcionWeb" = 'Divertidos y cómodos tenis deportivos para niños inspirados en Paw Patrol. Su diseño combina tonos azul, amarillo y blanco, ofreciendo un estilo alegre y moderno. Cuentan con suela resistente, interior acolchado para mayor confort y detalles temáticos en el talón que encantarán a los pequeños. Ideales para uso diario y juegos al aire libre.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203700/distribuidorababyworld/zapatos/ZDP-007-AZ-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203700/distribuidorababyworld/zapatos/ZDP-007-AZ-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203700/distribuidorababyworld/zapatos/ZDP-007-AZ-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203701/distribuidorababyworld/zapatos/ZDP-007-AZ-3.png"],"detalles":["Diseño divertido inspirado en Paw Patrol","Suela de goma antideslizante para mayor seguridad","Interior acolchado y transpirable para máximo confort","Cordones gruesos para un ajuste seguro"],"tallas":["23","24","25","26","27"],"tipoCierre":"Cordón","material":"Cuero sintético / Malla transpirable","genero":"Niño","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-007-AZ';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-007-AZ', 'Tenis Infantiles Paw Patrol Azul y Amarillo', 'Tenis deportivos coloridos con temática de Paw Patrol y cordones.', 'Divertidos y cómodos tenis deportivos para niños inspirados en Paw Patrol. Su diseño combina tonos azul, amarillo y blanco, ofreciendo un estilo alegre y moderno. Cuentan con suela resistente, interior acolchado para mayor confort y detalles temáticos en el talón que encantarán a los pequeños. Ideales para uso diario y juegos al aire libre.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203700/distribuidorababyworld/zapatos/ZDP-007-AZ-1.png', v_categoria_id, true,
      false, false, 'tenis-infantiles-paw-patrol-azul-y-amarillo-zdp-007-az', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203700/distribuidorababyworld/zapatos/ZDP-007-AZ-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203700/distribuidorababyworld/zapatos/ZDP-007-AZ-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203701/distribuidorababyworld/zapatos/ZDP-007-AZ-3.png"],"detalles":["Diseño divertido inspirado en Paw Patrol","Suela de goma antideslizante para mayor seguridad","Interior acolchado y transpirable para máximo confort","Cordones gruesos para un ajuste seguro"],"tallas":["23","24","25","26","27"],"tipoCierre":"Cordón","material":"Cuero sintético / Malla transpirable","genero":"Niño","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-008-NG - Tenis Deportivos Neón Kids
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-008-NG') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Deportivos Neón Kids',
      descripcion = 'Tenis deportivos infantiles con detalles en verde neón y suela robusta antideslizante.',
      "descripcionWeb" = 'Brinda a tus pequeños la máxima comodidad y estilo con estos tenis deportivos. Fabricados con malla transpirable y refuerzos sintéticos, cuentan con una plantilla acolchada para soporte ergonómico durante todo el día. Su suela gruesa con detalles salpicados ofrece gran tracción, ideal para juegos y actividades diarias.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203712/distribuidorababyworld/zapatos/ZDP-008-NG-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = true,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203712/distribuidorababyworld/zapatos/ZDP-008-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203713/distribuidorababyworld/zapatos/ZDP-008-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203714/distribuidorababyworld/zapatos/ZDP-008-NG-3.png"],"detalles":["Suela gruesa y antideslizante para mayor seguridad en cada paso.","Plantilla acolchada que brinda soporte y confort ergonómico.","Detalles en color verde neón y tirador trasero para facilitar el calce.","Diseño moderno y transpirable ideal para uso diario o deportivo."],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Elástico","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-008-NG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-008-NG', 'Tenis Deportivos Neón Kids', 'Tenis deportivos infantiles con detalles en verde neón y suela robusta antideslizante.', 'Brinda a tus pequeños la máxima comodidad y estilo con estos tenis deportivos. Fabricados con malla transpirable y refuerzos sintéticos, cuentan con una plantilla acolchada para soporte ergonómico durante todo el día. Su suela gruesa con detalles salpicados ofrece gran tracción, ideal para juegos y actividades diarias.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203712/distribuidorababyworld/zapatos/ZDP-008-NG-1.png', v_categoria_id, true,
      false, true, 'tenis-deportivos-neon-kids-zdp-008-ng', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203712/distribuidorababyworld/zapatos/ZDP-008-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203713/distribuidorababyworld/zapatos/ZDP-008-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203714/distribuidorababyworld/zapatos/ZDP-008-NG-3.png"],"detalles":["Suela gruesa y antideslizante para mayor seguridad en cada paso.","Plantilla acolchada que brinda soporte y confort ergonómico.","Detalles en color verde neón y tirador trasero para facilitar el calce.","Diseño moderno y transpirable ideal para uso diario o deportivo."],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Elástico","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-009-SU - Tenis Deportivos Multicolor con Plataforma
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-009-SU') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Deportivos Multicolor con Plataforma',
      descripcion = 'Tenis infantiles deportivos con diseño moderno, mezcla de colores pastel y suela gruesa.',
      "descripcionWeb" = 'Estos tenis deportivos infantiles combinan estilo moderno y máximo confort. Su diseño multicolor en tonos pastel con detalles en azul y rosa los hace muy atractivos. Cuentan con una suela gruesa y acolchada que proporciona excelente amortiguación y soporte en cada paso, ideales para el uso diario y actividades recreativas.',
      "precioBase" = 65000,
      "precioWeb" = 65000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203725/distribuidorababyworld/zapatos/ZDP-009-SU-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = true,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203725/distribuidorababyworld/zapatos/ZDP-009-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203726/distribuidorababyworld/zapatos/ZDP-009-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203728/distribuidorababyworld/zapatos/ZDP-009-SU-3.png"],"detalles":["Suela gruesa de gran absorción de impactos","Diseño multicolor en tonos pastel muy llamativo","Cordones bicolores resistentes y ajustables","Talón acolchado para mayor comodidad y soporte"],"tallas":["26","27","28","29","30","31"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-009-SU';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-009-SU', 'Tenis Deportivos Multicolor con Plataforma', 'Tenis infantiles deportivos con diseño moderno, mezcla de colores pastel y suela gruesa.', 'Estos tenis deportivos infantiles combinan estilo moderno y máximo confort. Su diseño multicolor en tonos pastel con detalles en azul y rosa los hace muy atractivos. Cuentan con una suela gruesa y acolchada que proporciona excelente amortiguación y soporte en cada paso, ideales para el uso diario y actividades recreativas.',
      65000, 65000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203725/distribuidorababyworld/zapatos/ZDP-009-SU-1.png', v_categoria_id, true,
      false, true, 'tenis-deportivos-multicolor-con-plataforma-zdp-009-su', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203725/distribuidorababyworld/zapatos/ZDP-009-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203726/distribuidorababyworld/zapatos/ZDP-009-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203728/distribuidorababyworld/zapatos/ZDP-009-SU-3.png"],"detalles":["Suela gruesa de gran absorción de impactos","Diseño multicolor en tonos pastel muy llamativo","Cordones bicolores resistentes y ajustables","Talón acolchado para mayor comodidad y soporte"],"tallas":["26","27","28","29","30","31"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-010-RS - Tenis Deportivos Nike Rosa Pastel
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-010-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Deportivos Nike Rosa Pastel',
      descripcion = 'Tenis deportivos infantiles en tonos rosados con diseño cómodo y moderno.',
      "descripcionWeb" = 'Hermosos tenis deportivos diseñados especialmente para brindar la máxima comodidad y estilo a los más pequeños. Fabricados con materiales suaves y resistentes que cuuidan sus pies durante todo el día. Cuentan con soporte acolchado en el talón y suela antideslizante para mayor seguridad en cada paso. Ideales para uso diario, paseos y ocasiones casuales.',
      "precioBase" = 89000,
      "precioWeb" = 89000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203738/distribuidorababyworld/zapatos/ZDP-010-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203738/distribuidorababyworld/zapatos/ZDP-010-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203739/distribuidorababyworld/zapatos/ZDP-010-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203740/distribuidorababyworld/zapatos/ZDP-010-RS-3.png"],"detalles":["Suela antideslizante para mayor estabilidad y seguridad al caminar","Diseño acolchado en el talón y cuello para evitar fricción y brindar confort","Material sintético duradero y fácil de limpiar","Detalles bordados y acabados de alta calidad"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-010-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-010-RS', 'Tenis Deportivos Nike Rosa Pastel', 'Tenis deportivos infantiles en tonos rosados con diseño cómodo y moderno.', 'Hermosos tenis deportivos diseñados especialmente para brindar la máxima comodidad y estilo a los más pequeños. Fabricados con materiales suaves y resistentes que cuuidan sus pies durante todo el día. Cuentan con soporte acolchado en el talón y suela antideslizante para mayor seguridad en cada paso. Ideales para uso diario, paseos y ocasiones casuales.',
      89000, 89000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203738/distribuidorababyworld/zapatos/ZDP-010-RS-1.png', v_categoria_id, true,
      false, false, 'tenis-deportivos-nike-rosa-pastel-zdp-010-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203738/distribuidorababyworld/zapatos/ZDP-010-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203739/distribuidorababyworld/zapatos/ZDP-010-RS-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203740/distribuidorababyworld/zapatos/ZDP-010-RS-3.png"],"detalles":["Suela antideslizante para mayor estabilidad y seguridad al caminar","Diseño acolchado en el talón y cuello para evitar fricción y brindar confort","Material sintético duradero y fácil de limpiar","Detalles bordados y acabados de alta calidad"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-011-NG - Tenis Deportivos Urbanos Negros con Plataforma
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-011-NG') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Deportivos Urbanos Negros con Plataforma',
      descripcion = 'Tenis deportivos modernos en color negro con suela gruesa blanca y cordones estampados.',
      "descripcionWeb" = 'Estos modernos tenis deportivos combinan estilo urbano y confort absoluto. Diseñados con una suela alta y amortiguada que absorbe los impactos, ofrecen una pisada segura y ergonómica. Su capellada en malla transpirable y refuerzos sintéticos garantiza durabilidad y frescura durante todo el día. Perfectos para el uso diario, actividades escolares o salidas casuales, brindando un look moderno y vanguardista.',
      "precioBase" = 85000,
      "precioWeb" = 85000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203749/distribuidorababyworld/zapatos/ZDP-011-NG-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = true,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203749/distribuidorababyworld/zapatos/ZDP-011-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203750/distribuidorababyworld/zapatos/ZDP-011-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203751/distribuidorababyworld/zapatos/ZDP-011-NG-3.png"],"detalles":["Suela gruesa y antideslizante para mayor estabilidad y amortiguación","Material de malla transpirable que mantiene los pies frescos","Cordones bicolor con diseño estampado de puntos","Refuerzo en el talón para mayor soporte y durabilidad","Diseño ergonómico ideal para uso prolongado"],"tallas":["28","29","30","31","32","33"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-011-NG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-011-NG', 'Tenis Deportivos Urbanos Negros con Plataforma', 'Tenis deportivos modernos en color negro con suela gruesa blanca y cordones estampados.', 'Estos modernos tenis deportivos combinan estilo urbano y confort absoluto. Diseñados con una suela alta y amortiguada que absorbe los impactos, ofrecen una pisada segura y ergonómica. Su capellada en malla transpirable y refuerzos sintéticos garantiza durabilidad y frescura durante todo el día. Perfectos para el uso diario, actividades escolares o salidas casuales, brindando un look moderno y vanguardista.',
      85000, 85000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203749/distribuidorababyworld/zapatos/ZDP-011-NG-1.png', v_categoria_id, true,
      false, true, 'tenis-deportivos-urbanos-negros-con-plataforma-zdp-011-ng', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203749/distribuidorababyworld/zapatos/ZDP-011-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203750/distribuidorababyworld/zapatos/ZDP-011-NG-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203751/distribuidorababyworld/zapatos/ZDP-011-NG-3.png"],"detalles":["Suela gruesa y antideslizante para mayor estabilidad y amortiguación","Material de malla transpirable que mantiene los pies frescos","Cordones bicolor con diseño estampado de puntos","Refuerzo en el talón para mayor soporte y durabilidad","Diseño ergonómico ideal para uso prolongado"],"tallas":["28","29","30","31","32","33"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Unisex","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: ZDP-012-SU - Tenis Infantiles Coloridos con Accesorios
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-012-SU') THEN
    UPDATE "Producto" SET
      nombre = 'Tenis Infantiles Coloridos con Accesorios',
      descripcion = 'Tenis deportivos coloridos con detalles divertidos, ideales para el uso diario y juegos infantiles.',
      "descripcionWeb" = 'Estos tenis infantiles combinan estilo y diversión con una atractiva mezcla de tonos pastel y fucsia. Cuentan con un diseño ergonómico que asegura comodidad y soporte en cada paso. Fabricados con materiales resistentes y transpirables, incluyen cordones gruesos y divertidos accesorios decorativos. Perfectos para acompañar a las niñas en sus aventuras diarias con total seguridad y confort.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792203760/distribuidorababyworld/zapatos/ZDP-012-SU-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203760/distribuidorababyworld/zapatos/ZDP-012-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203761/distribuidorababyworld/zapatos/ZDP-012-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203762/distribuidorababyworld/zapatos/ZDP-012-SU-3.png"],"detalles":["Diseño colorido con detalles en tonos pastel y fucsia","Incluye accesorios decorativos divertidos en los cordones","Suela gruesa y acolchada para mayor amortiguación","Interior suave y transpirable que cuida los pies de los más pequeños","Presilla trasera para facilitar el calce"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Niña","subcategoria":"Deportivos"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'ZDP-012-SU';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'ZDP-012-SU', 'Tenis Infantiles Coloridos con Accesorios', 'Tenis deportivos coloridos con detalles divertidos, ideales para el uso diario y juegos infantiles.', 'Estos tenis infantiles combinan estilo y diversión con una atractiva mezcla de tonos pastel y fucsia. Cuentan con un diseño ergonómico que asegura comodidad y soporte en cada paso. Fabricados con materiales resistentes y transpirables, incluyen cordones gruesos y divertidos accesorios decorativos. Perfectos para acompañar a las niñas en sus aventuras diarias con total seguridad y confort.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792203760/distribuidorababyworld/zapatos/ZDP-012-SU-1.png', v_categoria_id, true,
      false, false, 'tenis-infantiles-coloridos-con-accesorios-zdp-012-su', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792203760/distribuidorababyworld/zapatos/ZDP-012-SU-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203761/distribuidorababyworld/zapatos/ZDP-012-SU-2.png","https://res.cloudinary.com/azun29xn/image/upload/v1792203762/distribuidorababyworld/zapatos/ZDP-012-SU-3.png"],"detalles":["Diseño colorido con detalles en tonos pastel y fucsia","Incluye accesorios decorativos divertidos en los cordones","Suela gruesa y acolchada para mayor amortiguación","Interior suave y transpirable que cuida los pies de los más pequeños","Presilla trasera para facilitar el calce"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Cordón","material":"Malla transpirable","genero":"Niña","subcategoria":"Deportivos"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-001-RS - Sandalias Rosadas Elegantes para Niña
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-001-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Rosadas Elegantes para Niña',
      descripcion = 'Hermosas sandalias estilo charol en color rosa con detalles dorados y hebilla ajustable.',
      "descripcionWeb" = 'Elegantes sandalias diseñadas especialmente para las más pequeñas. Fabricadas con material sintético brillante tipo charol en un delicado tono rosa, cuentan con una cómoda plantilla acolchada en color dorado y suela flexible. Su diseño incluye detalles perforados en la puntera y un tierno lazo decorativo con cierre de hebilla ajustable, garantizando soporte y estilo en ocasiones especiales y uso diario.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205408/distribuidorababyworld/zapatos/SAN-001-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205408/distribuidorababyworld/zapatos/SAN-001-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792205408/distribuidorababyworld/zapatos/SAN-001-RS-2.png"],"detalles":["Diseño exterior en charol rosa brillante con delicadas perforaciones decorativas","Plantilla interior acolchada de tono dorado para mayor comodidad durante todo el día","Cierre de correa con hebilla metálica ajustable para un soporte seguro en el tobillo","Suela plana y flexible con acabado antideslizante para los primeros pasos","Lindo detalle de lazo en la parte superior que aporta un toque tierno y elegante"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-001-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-001-RS', 'Sandalias Rosadas Elegantes para Niña', 'Hermosas sandalias estilo charol en color rosa con detalles dorados y hebilla ajustable.', 'Elegantes sandalias diseñadas especialmente para las más pequeñas. Fabricadas con material sintético brillante tipo charol en un delicado tono rosa, cuentan con una cómoda plantilla acolchada en color dorado y suela flexible. Su diseño incluye detalles perforados en la puntera y un tierno lazo decorativo con cierre de hebilla ajustable, garantizando soporte y estilo en ocasiones especiales y uso diario.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205408/distribuidorababyworld/zapatos/SAN-001-RS-1.png', v_categoria_id, true,
      false, false, 'sandalias-rosadas-elegantes-para-nina-san-001-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205408/distribuidorababyworld/zapatos/SAN-001-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792205408/distribuidorababyworld/zapatos/SAN-001-RS-2.png"],"detalles":["Diseño exterior en charol rosa brillante con delicadas perforaciones decorativas","Plantilla interior acolchada de tono dorado para mayor comodidad durante todo el día","Cierre de correa con hebilla metálica ajustable para un soporte seguro en el tobillo","Suela plana y flexible con acabado antideslizante para los primeros pasos","Lindo detalle de lazo en la parte superior que aporta un toque tierno y elegante"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-002-NG - Sandalias Infantiles de Cuero Negro
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-002-NG') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Infantiles de Cuero Negro',
      descripcion = 'Sandalias elegantes y cómodas para bebé con diseño seguro y ajuste de hebilla.',
      "descripcionWeb" = 'Estas hermosas sandalias en color negro combinan estilo y ergonomía para los primeros pasos de tu pequeño. Fabricadas con materiales suaves y resistentes, ofrecen una suela cómoda que cuida sus pies y un diseño de tiras cruzadas con cierre ajustable para mayor seguridad y soporte diario en cualquier ocasión.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205419/distribuidorababyworld/zapatos/SAN-002-NG-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205419/distribuidorababyworld/zapatos/SAN-002-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792205420/distribuidorababyworld/zapatos/SAN-002-NG-2.png"],"detalles":["Diseño ergonómico ideal para el desarrollo del pie del bebé","Correas cruzadas que brindan excelente sujeción","Suela flexible y antideslizante para mayor seguridad","Materiales suaves y transpirables de alta calidad"],"tallas":["18","19","20","21","22"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Unisex","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-002-NG';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-002-NG', 'Sandalias Infantiles de Cuero Negro', 'Sandalias elegantes y cómodas para bebé con diseño seguro y ajuste de hebilla.', 'Estas hermosas sandalias en color negro combinan estilo y ergonomía para los primeros pasos de tu pequeño. Fabricadas con materiales suaves y resistentes, ofrecen una suela cómoda que cuida sus pies y un diseño de tiras cruzadas con cierre ajustable para mayor seguridad y soporte diario en cualquier ocasión.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205419/distribuidorababyworld/zapatos/SAN-002-NG-1.png', v_categoria_id, true,
      false, false, 'sandalias-infantiles-de-cuero-negro-san-002-ng', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205419/distribuidorababyworld/zapatos/SAN-002-NG-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792205420/distribuidorababyworld/zapatos/SAN-002-NG-2.png"],"detalles":["Diseño ergonómico ideal para el desarrollo del pie del bebé","Correas cruzadas que brindan excelente sujeción","Suela flexible y antideslizante para mayor seguridad","Materiales suaves y transpirables de alta calidad"],"tallas":["18","19","20","21","22"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Unisex","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-003-RS - Sandalias Rosadas Brillantes Nicolle Kids
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-003-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Rosadas Brillantes Nicolle Kids',
      descripcion = 'Hermosas sandalias rosadas con tiras brillantes y plantilla ergonómica para niñas.',
      "descripcionWeb" = 'Haz que cada paso de tu pequeña brille con estas encantadoras sandalias en tono rosa. Diseñadas pensando en su comodidad y estilo, cuentan con una plantilla ergonómica con textura tipo panal que amortigua cada pisada, y una suela antideslizante para mayor seguridad. Sus tiras cruzadas decoradas con pedrería multicolor y un delicado nudo central aportan un toque chic y moderno. Ideales para ocasiones especiales o paseos diarios bajo el sol.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205429/distribuidorababyworld/zapatos/SAN-003-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205429/distribuidorababyworld/zapatos/SAN-003-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792205431/distribuidorababyworld/zapatos/SAN-003-RS-2.png"],"detalles":["Plantilla acolchada y texturizada con diseño ergonómico","Tiras cruzadas decoradas con pedrería brillante multicolor","Suela antideslizante que garantiza estabilidad al caminar","Cierre ajustable con hebilla en el talón para un ajuste perfecto"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-003-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-003-RS', 'Sandalias Rosadas Brillantes Nicolle Kids', 'Hermosas sandalias rosadas con tiras brillantes y plantilla ergonómica para niñas.', 'Haz que cada paso de tu pequeña brille con estas encantadoras sandalias en tono rosa. Diseñadas pensando en su comodidad y estilo, cuentan con una plantilla ergonómica con textura tipo panal que amortigua cada pisada, y una suela antideslizante para mayor seguridad. Sus tiras cruzadas decoradas con pedrería multicolor y un delicado nudo central aportan un toque chic y moderno. Ideales para ocasiones especiales o paseos diarios bajo el sol.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205429/distribuidorababyworld/zapatos/SAN-003-RS-1.png', v_categoria_id, true,
      false, false, 'sandalias-rosadas-brillantes-nicolle-kids-san-003-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205429/distribuidorababyworld/zapatos/SAN-003-RS-1.png","https://res.cloudinary.com/azun29xn/image/upload/v1792205431/distribuidorababyworld/zapatos/SAN-003-RS-2.png"],"detalles":["Plantilla acolchada y texturizada con diseño ergonómico","Tiras cruzadas decoradas con pedrería brillante multicolor","Suela antideslizante que garantiza estabilidad al caminar","Cierre ajustable con hebilla en el talón para un ajuste perfecto"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-004-BL - Sandalia Elegante Blanca con Brillo para Niña
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-004-BL') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalia Elegante Blanca con Brillo para Niña',
      descripcion = 'Hermosa sandalia blanca con detalles trenzados y brillos, ideal para ocasiones especiales y paseos.',
      "descripcionWeb" = 'Haz que los pasos de tu pequeña brillen con estas encantadoras sandalias blancas. Diseñadas pensando en la comodidad y la elegancia, cuentan con una plantilla acolchada para soporte prolongado, una tira trenzada y una franja brillante que aporta un toque chic. Su suela antideslizante ofrece estabilidad en cada paso, mientras que el cierre con hebilla asegura un ajuste perfecto. Perfectas para fiestas, bautizos o días soleados.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205440/distribuidorababyworld/zapatos/SAN-004-BL-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205440/distribuidorababyworld/zapatos/SAN-004-BL-1.png"],"detalles":["Diseño elegante con detalles trenzados y franja brillante","Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada que garantiza comodidad durante todo el día","Cierre de correa ajustable con hebilla lateral"],"tallas":["19","20","21","22","23","24"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-004-BL';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-004-BL', 'Sandalia Elegante Blanca con Brillo para Niña', 'Hermosa sandalia blanca con detalles trenzados y brillos, ideal para ocasiones especiales y paseos.', 'Haz que los pasos de tu pequeña brillen con estas encantadoras sandalias blancas. Diseñadas pensando en la comodidad y la elegancia, cuentan con una plantilla acolchada para soporte prolongado, una tira trenzada y una franja brillante que aporta un toque chic. Su suela antideslizante ofrece estabilidad en cada paso, mientras que el cierre con hebilla asegura un ajuste perfecto. Perfectas para fiestas, bautizos o días soleados.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205440/distribuidorababyworld/zapatos/SAN-004-BL-1.png', v_categoria_id, true,
      false, false, 'sandalia-elegante-blanca-con-brillo-para-nina-san-004-bl', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205440/distribuidorababyworld/zapatos/SAN-004-BL-1.png"],"detalles":["Diseño elegante con detalles trenzados y franja brillante","Suela antideslizante para mayor seguridad al caminar","Plantilla acolchada que garantiza comodidad durante todo el día","Cierre de correa ajustable con hebilla lateral"],"tallas":["19","20","21","22","23","24"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-005-BL - Sandalias Blancas Elegantes con Brillantes
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-005-BL') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Blancas Elegantes con Brillantes',
      descripcion = 'Hermosas sandalias blancas con detalles brillantes y hebilla dorada para niñas.',
      "descripcionWeb" = 'Elegantes sandalias diseñadas especialmente para las más pequeñas. Cuentan con tiras cruzadas decoradas con pedrería brillante que aportan un toque chic, y una cómoda correa en el tobillo con hebilla ajustable para mayor seguridad. Su plantilla suave y suela antideslizante garantizan estabilidad y confort durante todo el día, ideales para ocasiones especiales o paseos.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205451/distribuidorababyworld/zapatos/SAN-005-BL-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205451/distribuidorababyworld/zapatos/SAN-005-BL-1.png"],"detalles":["Diseño elegante con tiras cruzadas y pedrería brillante","Correa ajustable en el tobillo con hebilla metálica dorada","Plantilla suave y acolchada para mayor comodidad","Suela antideslizante de alta adherencia para pasos seguros","Materiales sintéticos de alta calidad y fácil limpieza"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro / Cordón / Elástico / Sin cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-005-BL';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-005-BL', 'Sandalias Blancas Elegantes con Brillantes', 'Hermosas sandalias blancas con detalles brillantes y hebilla dorada para niñas.', 'Elegantes sandalias diseñadas especialmente para las más pequeñas. Cuentan con tiras cruzadas decoradas con pedrería brillante que aportan un toque chic, y una cómoda correa en el tobillo con hebilla ajustable para mayor seguridad. Su plantilla suave y suela antideslizante garantizan estabilidad y confort durante todo el día, ideales para ocasiones especiales o paseos.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205451/distribuidorababyworld/zapatos/SAN-005-BL-1.png', v_categoria_id, true,
      false, false, 'sandalias-blancas-elegantes-con-brillantes-san-005-bl', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205451/distribuidorababyworld/zapatos/SAN-005-BL-1.png"],"detalles":["Diseño elegante con tiras cruzadas y pedrería brillante","Correa ajustable en el tobillo con hebilla metálica dorada","Plantilla suave y acolchada para mayor comodidad","Suela antideslizante de alta adherencia para pasos seguros","Materiales sintéticos de alta calidad y fácil limpieza"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro / Cordón / Elástico / Sin cordón","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-006-GR - Sandalias Infantiles Ranas Divertidas
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-006-GR') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Infantiles Ranas Divertidas',
      descripcion = 'Sandalias grises de baño con diseño de rana verde en relieve, cómodas y ligeras.',
      "descripcionWeb" = 'Estas divertidas sandalias para niños combinan un diseño alegre con la máxima comodidad. Fabricadas en Goma EVA ligera y flexible, cuentan con una plantilla texturizada antideslizante que garantiza estabilidad en cada paso. Su llamativo detalle de rana verde en 3D aporta un toque lúdico, ideal para la playa, la piscina o el uso diario en casa. Son fáciles de poner y quitar gracias a su diseño sin cordones.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205460/distribuidorababyworld/zapatos/SAN-006-GR-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205460/distribuidorababyworld/zapatos/SAN-006-GR-1.png"],"detalles":["Diseño divertido de ranita verde en relieve 3D","Suela y plantilla con textura antideslizante para mayor seguridad","Material de Goma EVA ultra ligero y de secado rápido","Estructura ergonómica que brinda comodidad durante todo el día"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Goma EVA","genero":"Unisex","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-006-GR';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-006-GR', 'Sandalias Infantiles Ranas Divertidas', 'Sandalias grises de baño con diseño de rana verde en relieve, cómodas y ligeras.', 'Estas divertidas sandalias para niños combinan un diseño alegre con la máxima comodidad. Fabricadas en Goma EVA ligera y flexible, cuentan con una plantilla texturizada antideslizante que garantiza estabilidad en cada paso. Su llamativo detalle de rana verde en 3D aporta un toque lúdico, ideal para la playa, la piscina o el uso diario en casa. Son fáciles de poner y quitar gracias a su diseño sin cordones.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205460/distribuidorababyworld/zapatos/SAN-006-GR-1.png', v_categoria_id, true,
      false, false, 'sandalias-infantiles-ranas-divertidas-san-006-gr', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205460/distribuidorababyworld/zapatos/SAN-006-GR-1.png"],"detalles":["Diseño divertido de ranita verde en relieve 3D","Suela y plantilla con textura antideslizante para mayor seguridad","Material de Goma EVA ultra ligero y de secado rápido","Estructura ergonómica que brinda comodidad durante todo el día"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Goma EVA","genero":"Unisex","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-007-GR - Sandalias Deportivas Infantiles Diseño Carros
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-007-GR') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Deportivas Infantiles Diseño Carros',
      descripcion = 'Sandalias grises con detalles rojos y diseño de carros para niños, cómodas y seguras.',
      "descripcionWeb" = 'Estas divertidas sandalias para niños combinan un estilo deportivo y moderno con la máxima comodidad. Diseñadas en color gris con llamativos estampados rojos de carros y llamas, cuentan con una suela ergonómica y antideslizante ideal para las aventuras diarias. Su sistema de cierre asegura un ajuste perfecto y fácil de poner.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205473/distribuidorababyworld/zapatos/SAN-007-GR-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205473/distribuidorababyworld/zapatos/SAN-007-GR-1.png"],"detalles":["Suela antideslizante para mayor seguridad en cada paso","Diseño divertido con estampado de carros y llamas en color rojo","Cierre ajustable tipo hebilla con soporte seguro en el talón","Plantilla ergonómica que brinda comodidad durante todo el día"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Goma EVA","genero":"Niño","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-007-GR';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-007-GR', 'Sandalias Deportivas Infantiles Diseño Carros', 'Sandalias grises con detalles rojos y diseño de carros para niños, cómodas y seguras.', 'Estas divertidas sandalias para niños combinan un estilo deportivo y moderno con la máxima comodidad. Diseñadas en color gris con llamativos estampados rojos de carros y llamas, cuentan con una suela ergonómica y antideslizante ideal para las aventuras diarias. Su sistema de cierre asegura un ajuste perfecto y fácil de poner.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205473/distribuidorababyworld/zapatos/SAN-007-GR-1.png', v_categoria_id, true,
      false, false, 'sandalias-deportivas-infantiles-diseno-carros-san-007-gr', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205473/distribuidorababyworld/zapatos/SAN-007-GR-1.png"],"detalles":["Suela antideslizante para mayor seguridad en cada paso","Diseño divertido con estampado de carros y llamas en color rojo","Cierre ajustable tipo hebilla con soporte seguro en el talón","Plantilla ergonómica que brinda comodidad durante todo el día"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Goma EVA","genero":"Niño","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-008-RS - Sandalias Fucsia con Lazo y Estampado
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-008-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Fucsia con Lazo y Estampado',
      descripcion = 'Hermosas sandalias infantiles en color fucsia con gran lazo decorativo y correa ajustable.',
      "descripcionWeb" = 'Estas encantadoras sandalias para niña combinan estilo y comodidad. Cuentan con una plantilla suave decorada con adorables detalles, una suela firme y flexible para pasos seguros, y un llamativo lazo frontal con estampado. Su correa con hebilla ajustable en el talón asegura un ajuste perfecto, ideales para paseos y ocasiones especiales durante los días cálidos.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205484/distribuidorababyworld/zapatos/SAN-008-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205484/distribuidorababyworld/zapatos/SAN-008-RS-1.png"],"detalles":["Diseño abierto fresco y cómodo ideal para climas cálidos","Gran lazo decorativo frontal con estampado distintivo","Correa ajustable con hebilla en el talón para mayor sujeción","Suela texturizada antideslizante que aporta estabilidad en cada paso"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Goma EVA","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-008-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-008-RS', 'Sandalias Fucsia con Lazo y Estampado', 'Hermosas sandalias infantiles en color fucsia con gran lazo decorativo y correa ajustable.', 'Estas encantadoras sandalias para niña combinan estilo y comodidad. Cuentan con una plantilla suave decorada con adorables detalles, una suela firme y flexible para pasos seguros, y un llamativo lazo frontal con estampado. Su correa con hebilla ajustable en el talón asegura un ajuste perfecto, ideales para paseos y ocasiones especiales durante los días cálidos.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205484/distribuidorababyworld/zapatos/SAN-008-RS-1.png', v_categoria_id, true,
      false, false, 'sandalias-fucsia-con-lazo-y-estampado-san-008-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205484/distribuidorababyworld/zapatos/SAN-008-RS-1.png"],"detalles":["Diseño abierto fresco y cómodo ideal para climas cálidos","Gran lazo decorativo frontal con estampado distintivo","Correa ajustable con hebilla en el talón para mayor sujeción","Suela texturizada antideslizante que aporta estabilidad en cada paso"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Goma EVA","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-009-RS - Zuecos Infantiles Costa Fucsia y Turquesa
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-009-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Zuecos Infantiles Costa Fucsia y Turquesa',
      descripcion = 'Zuecos de goma EVA ultraligeros y transpirables para niños, con diseño bicolor y tiras ajustables.',
      "descripcionWeb" = 'Estos encantadores zuecos infantiles combinan comodidad y diversión para el día a día. Fabricados en Goma EVA de alta calidad, son extremadamente ligeros, flexibles y fáciles de limpiar. Cuentan con múltiples perforaciones para una óptima ventilación, una suela antideslizante que aporta seguridad en cada paso y una tira trasera ajustable para mayor sujeción. Ideales para la playa, la piscina o uso casual en casa.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205496/distribuidorababyworld/zapatos/SAN-009-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205496/distribuidorababyworld/zapatos/SAN-009-RS-1.png"],"detalles":["Diseño ultraligero y flexible en Goma EVA de secado rápido","Perforaciones superiores para una excelente transpirabilidad","Suela texturizada antideslizante que previene resbalones","Correa trasera ajustable para un calce seguro y firme","Detalles decorativos divertidos en los laterales"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Goma EVA","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-009-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-009-RS', 'Zuecos Infantiles Costa Fucsia y Turquesa', 'Zuecos de goma EVA ultraligeros y transpirables para niños, con diseño bicolor y tiras ajustables.', 'Estos encantadores zuecos infantiles combinan comodidad y diversión para el día a día. Fabricados en Goma EVA de alta calidad, son extremadamente ligeros, flexibles y fáciles de limpiar. Cuentan con múltiples perforaciones para una óptima ventilación, una suela antideslizante que aporta seguridad en cada paso y una tira trasera ajustable para mayor sujeción. Ideales para la playa, la piscina o uso casual en casa.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205496/distribuidorababyworld/zapatos/SAN-009-RS-1.png', v_categoria_id, true,
      false, false, 'zuecos-infantiles-costa-fucsia-y-turquesa-san-009-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205496/distribuidorababyworld/zapatos/SAN-009-RS-1.png"],"detalles":["Diseño ultraligero y flexible en Goma EVA de secado rápido","Perforaciones superiores para una excelente transpirabilidad","Suela texturizada antideslizante que previene resbalones","Correa trasera ajustable para un calce seguro y firme","Detalles decorativos divertidos en los laterales"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Goma EVA","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-010-RS - Sandalias Rosadas Brillantes Nicolle Kids
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-010-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Rosadas Brillantes Nicolle Kids',
      descripcion = 'Hermosas sandalias infantiles con tiras brillantes y diseño ergonómico para mayor comodidad.',
      "descripcionWeb" = 'Estas encantadoras sandalias para niña de la marca Nicolle Kids combinan estilo y confort a la perfección. Cuentan con una plantilla texturizada tipo panal que brinda amortiguación y ergonomía en cada paso. Sus múltiples tiras frontales con pedrería brillante aportan un toque delicado y moderno, mientras que su correa posterior asegura un ajuste cómodo. Ideal para ocasiones casuales y paseos bajo el sol.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205509/distribuidorababyworld/zapatos/SAN-010-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205509/distribuidorababyworld/zapatos/SAN-010-RS-1.png"],"detalles":["Plantilla texturizada tipo panal que ofrece excelente amortiguación","Tiras delanteras decoradas con pedrería brillante de alta fijación","Correa trasera flexible para un ajuste seguro y cómodo","Suela ligera y antideslizante para mayor estabilidad al caminar"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Goma EVA","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-010-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-010-RS', 'Sandalias Rosadas Brillantes Nicolle Kids', 'Hermosas sandalias infantiles con tiras brillantes y diseño ergonómico para mayor comodidad.', 'Estas encantadoras sandalias para niña de la marca Nicolle Kids combinan estilo y confort a la perfección. Cuentan con una plantilla texturizada tipo panal que brinda amortiguación y ergonomía en cada paso. Sus múltiples tiras frontales con pedrería brillante aportan un toque delicado y moderno, mientras que su correa posterior asegura un ajuste cómodo. Ideal para ocasiones casuales y paseos bajo el sol.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205509/distribuidorababyworld/zapatos/SAN-010-RS-1.png', v_categoria_id, true,
      false, false, 'sandalias-rosadas-brillantes-nicolle-kids-san-010-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205509/distribuidorababyworld/zapatos/SAN-010-RS-1.png"],"detalles":["Plantilla texturizada tipo panal que ofrece excelente amortiguación","Tiras delanteras decoradas con pedrería brillante de alta fijación","Correa trasera flexible para un ajuste seguro y cómodo","Suela ligera y antideslizante para mayor estabilidad al caminar"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Sin cordón","material":"Goma EVA","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-011-RS - Sandalia Elegante Metalizada Rosé
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-011-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalia Elegante Metalizada Rosé',
      descripcion = 'Hermosa sandalia infantil en tono rosé con múltiples tiras y hebilla ajustable.',
      "descripcionWeb" = 'Elegantes sandalias infantiles diseñadas para ocasiones especiales o uso diario formal. Cuentan con un atractivo acabado metalizado color rosé, múltiples tiras frontales acolchadas para mayor confort y una práctica correa con hebilla en el tobillo que asegura un ajuste firme. Su suela texturizada ofrece estabilidad, combinando estilo, frescura y ergonomía para los pies de los más pequeños.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205521/distribuidorababyworld/zapatos/SAN-011-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205521/distribuidorababyworld/zapatos/SAN-011-RS-1.png"],"detalles":["Diseño fresco de múltiples tiras frontales metalizadas en tono rosé.","Correa ajustable con hebilla dorada en el tobillo para mayor sujeción.","Plantilla texturizada y cómoda para uso prolongado.","Suela antideslizante con bordes texturizados para mayor seguridad al caminar."],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-011-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-011-RS', 'Sandalia Elegante Metalizada Rosé', 'Hermosa sandalia infantil en tono rosé con múltiples tiras y hebilla ajustable.', 'Elegantes sandalias infantiles diseñadas para ocasiones especiales o uso diario formal. Cuentan con un atractivo acabado metalizado color rosé, múltiples tiras frontales acolchadas para mayor confort y una práctica correa con hebilla en el tobillo que asegura un ajuste firme. Su suela texturizada ofrece estabilidad, combinando estilo, frescura y ergonomía para los pies de los más pequeños.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205521/distribuidorababyworld/zapatos/SAN-011-RS-1.png', v_categoria_id, true,
      false, false, 'sandalia-elegante-metalizada-rose-san-011-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205521/distribuidorababyworld/zapatos/SAN-011-RS-1.png"],"detalles":["Diseño fresco de múltiples tiras frontales metalizadas en tono rosé.","Correa ajustable con hebilla dorada en el tobillo para mayor sujeción.","Plantilla texturizada y cómoda para uso prolongado.","Suela antideslizante con bordes texturizados para mayor seguridad al caminar."],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-012-SU - Sandalias Elegantes Grazzia Nude
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-012-SU') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Elegantes Grazzia Nude',
      descripcion = 'Sandalias infantiles con diseño de tiras en tonos nude y marrón, cómodas y elegantes.',
      "descripcionWeb" = 'Hermosas sandalias para niña con diseño ergonómico y moderno. Cuentan con una plantilla texturizada antideslizante, múltiples tiras frontales acolchadas en tonos tierra y una correa ajustable al tobillo con hebilla dorada. Perfectas para ocasiones especiales o uso diario, brindando soporte y estilo.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205528/distribuidorababyworld/zapatos/SAN-012-SU-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205528/distribuidorababyworld/zapatos/SAN-012-SU-1.png"],"detalles":["Correa ajustable al tobillo con hebilla metálica segura","Plantilla texturizada y acolchada para mayor comodidad","Suela antideslizante ideal para primeros pasos y caminatas","Diseño de tiras frontales acolchadas en tonos combinados"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-012-SU';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-012-SU', 'Sandalias Elegantes Grazzia Nude', 'Sandalias infantiles con diseño de tiras en tonos nude y marrón, cómodas y elegantes.', 'Hermosas sandalias para niña con diseño ergonómico y moderno. Cuentan con una plantilla texturizada antideslizante, múltiples tiras frontales acolchadas en tonos tierra y una correa ajustable al tobillo con hebilla dorada. Perfectas para ocasiones especiales o uso diario, brindando soporte y estilo.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205528/distribuidorababyworld/zapatos/SAN-012-SU-1.png', v_categoria_id, true,
      false, false, 'sandalias-elegantes-grazzia-nude-san-012-su', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205528/distribuidorababyworld/zapatos/SAN-012-SU-1.png"],"detalles":["Correa ajustable al tobillo con hebilla metálica segura","Plantilla texturizada y acolchada para mayor comodidad","Suela antideslizante ideal para primeros pasos y caminatas","Diseño de tiras frontales acolchadas en tonos combinados"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-013-BL - Sandalia Infantil Elegante Blanca y Plateada
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-013-BL') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalia Infantil Elegante Blanca y Plateada',
      descripcion = 'Hermosa sandalia infantil con correas cruzadas y ajuste de hebilla, ideal para ocasiones especiales.',
      "descripcionWeb" = 'Elegantes sandalias para niñas diseñadas para brindar comodidad y estilo en cualquier ocasión especial. Fabricadas con materiales sintéticos de alta calidad, cuentan con una suela expanso flexible y antideslizante, plantilla suave acolchada y un hermoso diseño de correas plateadas cruzadas combinadas con blanco. Su sistema de cierre con hebilla asegura un ajuste perfecto al pie.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205542/distribuidorababyworld/zapatos/SAN-013-BL-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205542/distribuidorababyworld/zapatos/SAN-013-BL-1.png"],"detalles":["Diseño sofisticado con correas cruzadas metalizadas en tono plateado","Suela expanso antideslizante para mayor seguridad al caminar","Plantilla sintética suave y cómoda para uso prolongado","Cierre de correa ajustable con hebilla metálica lateral"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-013-BL';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-013-BL', 'Sandalia Infantil Elegante Blanca y Plateada', 'Hermosa sandalia infantil con correas cruzadas y ajuste de hebilla, ideal para ocasiones especiales.', 'Elegantes sandalias para niñas diseñadas para brindar comodidad y estilo en cualquier ocasión especial. Fabricadas con materiales sintéticos de alta calidad, cuentan con una suela expanso flexible y antideslizante, plantilla suave acolchada y un hermoso diseño de correas plateadas cruzadas combinadas con blanco. Su sistema de cierre con hebilla asegura un ajuste perfecto al pie.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205542/distribuidorababyworld/zapatos/SAN-013-BL-1.png', v_categoria_id, true,
      false, false, 'sandalia-infantil-elegante-blanca-y-plateada-san-013-bl', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205542/distribuidorababyworld/zapatos/SAN-013-BL-1.png"],"detalles":["Diseño sofisticado con correas cruzadas metalizadas en tono plateado","Suela expanso antideslizante para mayor seguridad al caminar","Plantilla sintética suave y cómoda para uso prolongado","Cierre de correa ajustable con hebilla metálica lateral"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-014-RS - Sandalias Rosadas con Pedrería para Niña
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-014-RS') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Rosadas con Pedrería para Niña',
      descripcion = 'Hermosas sandalias infantiles en tono rosa con detalles dorados y brillantes.',
      "descripcionWeb" = 'Estas encantadoras sandalias combinan estilo y confort para los días cálidos de las más pequeñas. Cuentan con una plantilla ergonómica acolchada con diseño texturizado para mayor comodidad y tracción. Sus tiras frontales adornadas con piezas doradas y pedrería brillante aportan un toque elegante. Ideales para ocasiones especiales o paseos, con correa ajustable al talón para un soporte seguro.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205550/distribuidorababyworld/zapatos/SAN-014-RS-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205550/distribuidorababyworld/zapatos/SAN-014-RS-1.png"],"detalles":["Diseño elegante con pedrería y detalles metálicos dorados en el empeine","Plantilla texturizada y acolchada que garantiza máxima comodidad","Correa trasera ajustable para un ajuste seguro y firme","Suela ligera y flexible ideal para el uso diario infantil"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-014-RS';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-014-RS', 'Sandalias Rosadas con Pedrería para Niña', 'Hermosas sandalias infantiles en tono rosa con detalles dorados y brillantes.', 'Estas encantadoras sandalias combinan estilo y confort para los días cálidos de las más pequeñas. Cuentan con una plantilla ergonómica acolchada con diseño texturizado para mayor comodidad y tracción. Sus tiras frontales adornadas con piezas doradas y pedrería brillante aportan un toque elegante. Ideales para ocasiones especiales o paseos, con correa ajustable al talón para un soporte seguro.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205550/distribuidorababyworld/zapatos/SAN-014-RS-1.png', v_categoria_id, true,
      false, false, 'sandalias-rosadas-con-pedreria-para-nina-san-014-rs', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205550/distribuidorababyworld/zapatos/SAN-014-RS-1.png"],"detalles":["Diseño elegante con pedrería y detalles metálicos dorados en el empeine","Plantilla texturizada y acolchada que garantiza máxima comodidad","Correa trasera ajustable para un ajuste seguro y firme","Suela ligera y flexible ideal para el uso diario infantil"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  -- Producto: SAN-015-AM - Sandalias Infantiles Soleadas Blanco y Amarillo
  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = 'SAN-015-AM') THEN
    UPDATE "Producto" SET
      nombre = 'Sandalias Infantiles Soleadas Blanco y Amarillo',
      descripcion = 'Hermosas sandalias infantiles con diseño fresco, hebillas ajustables y suela cómoda con detalles florales.',
      "descripcionWeb" = 'Estas encantadoras sandalias combinan estilo y comodidad para los más pequeños. Confeccionadas con materiales sintéticos de alta calidad en tonos blanco y amarillo suave, cuentan con una plantilla ergonómica texturizada que previene resbalones y cuida cada paso. El sistema de ajuste con hebilla metálica en el empeine y el talón asegura una sujeción perfecta. Ideales para paseos al aire libre, días de verano y ocasiones casuales.',
      "precioBase" = 55000,
      "precioWeb" = 55000,
      imagen = 'https://res.cloudinary.com/azun29xn/image/upload/v1792205558/distribuidorababyworld/zapatos/SAN-015-AM-1.png',
      "categoriaId" = v_categoria_id,
      "publicadoWeb" = false,
      "esDestacado" = false,
      "metadataWeb" = '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205558/distribuidorababyworld/zapatos/SAN-015-AM-1.png"],"detalles":["Plantilla anatómica con diseño floral antideslizante","Doble sistema de ajuste con hebilla metálica en talón y empeine","Material sintético duradero y fácil de limpiar","Suela flexible que acompaña el movimiento natural del pie"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb,
      "updatedAt" = NOW()
    WHERE "empresaId" = v_empresa_id AND sku = 'SAN-015-AM';
  ELSE
    INSERT INTO "Producto" (
      "empresaId", sku, nombre, descripcion, "descripcionWeb",
      "precioBase", "precioWeb", imagen, "categoriaId", activo,
      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",
      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",
      "createdAt", "updatedAt"
    ) VALUES (
      v_empresa_id, 'SAN-015-AM', 'Sandalias Infantiles Soleadas Blanco y Amarillo', 'Hermosas sandalias infantiles con diseño fresco, hebillas ajustables y suela cómoda con detalles florales.', 'Estas encantadoras sandalias combinan estilo y comodidad para los más pequeños. Confeccionadas con materiales sintéticos de alta calidad en tonos blanco y amarillo suave, cuentan con una plantilla ergonómica texturizada que previene resbalones y cuida cada paso. El sistema de ajuste con hebilla metálica en el empeine y el talón asegura una sujeción perfecta. Ideales para paseos al aire libre, días de verano y ocasiones casuales.',
      55000, 55000, 'https://res.cloudinary.com/azun29xn/image/upload/v1792205558/distribuidorababyworld/zapatos/SAN-015-AM-1.png', v_categoria_id, true,
      false, false, 'sandalias-infantiles-soleadas-blanco-y-amarillo-san-015-am', 'EXENTO', true,
      '{"imagenes":["https://res.cloudinary.com/azun29xn/image/upload/v1792205558/distribuidorababyworld/zapatos/SAN-015-AM-1.png"],"detalles":["Plantilla anatómica con diseño floral antideslizante","Doble sistema de ajuste con hebilla metálica en talón y empeine","Material sintético duradero y fácil de limpiar","Suela flexible que acompaña el movimiento natural del pie"],"tallas":["21","22","23","24","25","26"],"tipoCierre":"Velcro","material":"Cuero sintético","genero":"Niña","subcategoria":"Sandalias"}'::jsonb, 0, 0, 0,
      NOW(), NOW()
    );
  END IF;

  RAISE NOTICE '✅ Importación finalizada: % productos procesados (publicadoWeb = %).', 39, false;
END $$;
