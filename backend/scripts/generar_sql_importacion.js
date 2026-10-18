const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'productos_zapatos.json');
if (!fs.existsSync(jsonPath)) {
  console.error('❌ No se encontró productos_zapatos.json');
  process.exit(1);
}

const productos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Función para sanitizar strings en SQL y evitar inyección
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function generarSql(publicadoWeb, nombreArchivo) {
  let sql = `-- ====================================================================\n`;
  sql += `-- IMPORTACIÓN DE CALZADO (${publicadoWeb ? 'PRUEBAS: VISIBLE EN TIENDA' : 'PRODUCCIÓN: OCULTO EN TIENDA / SOLO INVENTARIO'})\n`;
  sql += `-- Total productos: ${productos.length}\n`;
  sql += `-- Fecha de generación: ${new Date().toISOString()}\n`;
  sql += `-- ====================================================================\n\n`;

  sql += `DO $$\n`;
  sql += `DECLARE\n`;
  sql += `  v_empresa_id INT;\n`;
  sql += `  v_categoria_id INT;\n`;
  sql += `BEGIN\n`;
  sql += `  -- 1. Obtener ID de la empresa vinculada a la tienda distribuidorababyworld (o fallback a primera empresa activa)\n`;
  sql += `  SELECT "empresaId" INTO v_empresa_id FROM "ConfiguracionTienda" WHERE "slugTienda" = 'distribuidorababyworld' LIMIT 1;\n`;
  sql += `  IF v_empresa_id IS NULL THEN\n`;
  sql += `    SELECT id INTO v_empresa_id FROM "Empresa" LIMIT 1;\n`;
  sql += `  END IF;\n\n`;

  sql += `  -- 2. Asegurar que exista la categoría 'Calzado'\n`;
  sql += `  SELECT id INTO v_categoria_id FROM "Categoria" WHERE "empresaId" = v_empresa_id AND LOWER(nombre) = 'calzado' LIMIT 1;\n`;
  sql += `  IF v_categoria_id IS NULL THEN\n`;
  sql += `    INSERT INTO "Categoria" ("empresaId", "nombre", "slug", "activo", "createdAt", "updatedAt")\n`;
  sql += `    VALUES (v_empresa_id, 'Calzado', 'calzado', true, NOW(), NOW())\n`;
  sql += `    RETURNING id INTO v_categoria_id;\n`;
  sql += `  END IF;\n\n`;
  sql += `  -- 2.5 Limpiar registros viejos de Calzado para evitar duplicados o datos viejos de pruebas\n`;
  sql += `  DELETE FROM "Producto" WHERE "empresaId" = v_empresa_id AND "categoriaId" = v_categoria_id;\n\n`;
  sql += `  -- 3. Insertar cada producto con su SKU único\n`;

  productos.forEach((p) => {
    const slug = `${p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}-${p.sku.toLowerCase()}`;
    const metadata = JSON.stringify({
      imagenes: p.imagenes,
      detalles: p.detalles,
      tallas: p.tallas,
      tipoCierre: p.tipoCierre,
      material: p.material,
      genero: p.genero,
      subcategoria: p.subcategoria
    });

    sql += `  -- Producto: ${p.sku} - ${p.nombre.replace(/'/g, '')}\n`;
    sql += `  IF EXISTS (SELECT 1 FROM "Producto" WHERE "empresaId" = v_empresa_id AND sku = ${escapeSql(p.sku)}) THEN\n`;
    sql += `    UPDATE "Producto" SET\n`;
    sql += `      nombre = ${escapeSql(p.nombre)},\n`;
    sql += `      descripcion = ${escapeSql(p.descripcion)},\n`;
    sql += `      "descripcionWeb" = ${escapeSql(p.descripcionLarga)},\n`;
    sql += `      "precioBase" = ${p.precio},\n`;
    sql += `      "precioWeb" = ${p.precio},\n`;
    sql += `      imagen = ${escapeSql(p.imagen)},\n`;
    sql += `      "categoriaId" = v_categoria_id,\n`;
    sql += `      "publicadoWeb" = ${publicadoWeb},\n`;
    sql += `      "esDestacado" = ${p.esDestacado ? 'true' : 'false'},\n`;
    sql += `      "metadataWeb" = ${escapeSql(metadata)}::jsonb,\n`;
    sql += `      "updatedAt" = NOW()\n`;
    sql += `    WHERE "empresaId" = v_empresa_id AND sku = ${escapeSql(p.sku)};\n`;
    sql += `  ELSE\n`;
    sql += `    INSERT INTO "Producto" (\n`;
    sql += `      "empresaId", sku, nombre, descripcion, "descripcionWeb",\n`;
    sql += `      "precioBase", "precioWeb", imagen, "categoriaId", activo,\n`;
    sql += `      "publicadoWeb", "esDestacado", slug, "tipoIva", "manejaBodega",\n`;
    sql += `      "metadataWeb", "costoPromedio", "stockMinimo", "puntoReorden",\n`;
    sql += `      "createdAt", "updatedAt"\n`;
    sql += `    ) VALUES (\n`;
    sql += `      v_empresa_id, ${escapeSql(p.sku)}, ${escapeSql(p.nombre)}, ${escapeSql(p.descripcion)}, ${escapeSql(p.descripcionLarga)},\n`;
    sql += `      ${p.precio}, ${p.precio}, ${escapeSql(p.imagen)}, v_categoria_id, true,\n`;
    sql += `      ${publicadoWeb}, ${p.esDestacado ? 'true' : 'false'}, ${escapeSql(slug)}, 'EXENTO', true,\n`;
    sql += `      ${escapeSql(metadata)}::jsonb, 0, 0, 0,\n`;
    sql += `      NOW(), NOW()\n`;
    sql += `    );\n`;
    sql += `  END IF;\n\n`;
  });

  sql += `  RAISE NOTICE '✅ Importación finalizada: % productos procesados (publicadoWeb = %).', ${productos.length}, ${publicadoWeb};\n`;
  sql += `END $$;\n`;

  const outputPath = path.join(__dirname, nombreArchivo);
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`📄 SQL generado: ${outputPath} (${productos.length} productos)`);
}

generarSql(true, 'importar_zapatos_pruebas.sql');
generarSql(false, 'importar_zapatos_produccion.sql');
