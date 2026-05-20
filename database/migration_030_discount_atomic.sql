-- migration_030_discount_atomic.sql
-- Atomares Inkrement für Gutschein-Verwendungszähler
-- Verhindert Race Condition wenn mehrere Checkouts gleichzeitig den gleichen Code nutzen

CREATE OR REPLACE FUNCTION increment_discount_uses(
  p_discount_id UUID,
  p_max_uses    INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE discount_codes
  SET    uses = uses + 1
  WHERE  id = p_discount_id
    AND  (p_max_uses IS NULL OR uses < p_max_uses);

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_discount_uses(UUID, INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION increment_discount_uses(UUID, INTEGER) TO service_role;
