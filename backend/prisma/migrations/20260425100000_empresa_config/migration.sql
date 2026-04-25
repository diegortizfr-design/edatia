-- Migration: 20260425100000_empresa_config
-- Ampliar modelo Empresa con datos legales, tributarios y de contacto completos

ALTER TABLE "Empresa"
  ADD COLUMN IF NOT EXISTS "nombreComercial"           TEXT,
  ADD COLUMN IF NOT EXISTS "representanteLegal"        TEXT,
  ADD COLUMN IF NOT EXISTS "representanteLegalDoc"     TEXT,
  ADD COLUMN IF NOT EXISTS "matriculaMercantil"        TEXT,
  ADD COLUMN IF NOT EXISTS "fechaMatriculaMercantil"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ciudadMatricula"            TEXT,
  ADD COLUMN IF NOT EXISTS "granContribuyente"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "autoretenedor"             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "agenteRetencion"           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pais"                      TEXT DEFAULT 'CO',
  ADD COLUMN IF NOT EXISTS "correoFacturacion"         TEXT,
  ADD COLUMN IF NOT EXISTS "web"                       TEXT,
  ADD COLUMN IF NOT EXISTS "colorPrimario"             TEXT DEFAULT '#4F46E5',
  ADD COLUMN IF NOT EXISTS "slogan"                    TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
