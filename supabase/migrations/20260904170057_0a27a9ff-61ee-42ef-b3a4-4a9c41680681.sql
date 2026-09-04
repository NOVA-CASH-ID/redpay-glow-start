ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rpc_code text;

CREATE OR REPLACE FUNCTION public.get_payment_rpc_code(_payment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.payments;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  SELECT * INTO p FROM public.payments WHERE id = _payment_id;
  IF p.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found');
  END IF;
  IF p.user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not allowed');
  END IF;
  IF p.status <> 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not approved');
  END IF;
  IF p.rpc_code IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'code', p.rpc_code);
  END IF;

  LOOP
    candidate := 'RPC-';
    FOR i IN 1..4 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    candidate := candidate || '-';
    FOR i IN 1..4 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.payments WHERE rpc_code = candidate);
  END LOOP;

  UPDATE public.payments SET rpc_code = candidate, updated_at = now()
  WHERE id = _payment_id AND rpc_code IS NULL;

  SELECT rpc_code INTO candidate FROM public.payments WHERE id = _payment_id;
  RETURN jsonb_build_object('ok', true, 'code', candidate);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_rpc_code(uuid) TO authenticated;