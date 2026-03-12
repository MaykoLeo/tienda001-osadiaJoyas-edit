-- ===============================================================
-- SCRIPT PARA EJECUTAR EN NEON (PostgreSQL)
-- Previene nombres duplicados en categorías
-- ===============================================================

-- Este script crea índices únicos que previenen duplicados.
-- IMPORTANTE: Ejecuta esto en tu consola SQL de Neon.

-- 1. Eliminar constraint antiguo que no funciona con NULL
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_parent_id_key;

-- 2. Crear índice único para categorías principales (sin padre)
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_null_parent_unique_idx 
ON categories (name) 
WHERE parent_id IS NULL;

-- 3. Crear índice único para subcategorías (con padre)
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_parent_id_unique_idx 
ON categories (name, parent_id) 
WHERE parent_id IS NOT NULL;

-- ✅ Después de ejecutar esto:
-- - No podrás crear dos categorías principales con el mismo nombre
-- - No podrás crear dos subcategorías con el mismo nombre bajo el mismo padre
-- - La base de datos bloqueará duplicados automáticamente

-- Verificar que los índices se crearon correctamente:
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'categories' 
ORDER BY indexname;
