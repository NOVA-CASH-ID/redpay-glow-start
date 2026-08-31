CREATE OR REPLACE FUNCTION public.check_rpc_code(_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE cfg jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('valid',false,'error','Not authenticated'); END IF;
  SELECT value INTO cfg FROM app_config WHERE key='withdrawal';
  IF upper(trim(COALESCE(_code,''))) = upper(COALESCE(cfg->>'rpc_code','RPC200420')) THEN
    RETURN jsonb_build_object('valid',true,'benefit_type','discount','benefit_value',0,'label','RPC code accepted');
  END IF;
  RETURN jsonb_build_object('valid',false,'error','Wrong code');
END;
$function$;

CREATE OR REPLACE FUNCTION public.purchase_card(_network text, _card_type text, _plan_label text, _phone text, _denomination numeric, _quantity integer, _code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  cfg jsonb;
  subtotal numeric;
  total numeric;
  bal numeric;
  pid uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not authenticated'); END IF;
  IF public.is_banned(uid) THEN RETURN jsonb_build_object('ok',false,'error','Account suspended'); END IF;
  SELECT value INTO cfg FROM app_config WHERE key='withdrawal';
  IF upper(trim(COALESCE(_code,''))) <> upper(COALESCE(cfg->>'rpc_code','RPC200420')) THEN
    RETURN jsonb_build_object('ok',false,'error','Wrong code');
  END IF;
  IF _quantity < 1 OR _quantity > 20 THEN RETURN jsonb_build_object('ok',false,'error','Invalid quantity'); END IF;
  IF _denomination <= 0 THEN RETURN jsonb_build_object('ok',false,'error','Invalid amount'); END IF;
  subtotal := _denomination * _quantity;
  total := subtotal;
  SELECT balance INTO bal FROM profiles WHERE id = uid FOR UPDATE;
  IF bal < total THEN RETURN jsonb_build_object('ok',false,'error','Insufficient wallet balance'); END IF;
  UPDATE profiles SET balance = balance - total, updated_at = now() WHERE id = uid RETURNING balance INTO bal;
  INSERT INTO purchases(user_id, network, card_type, plan_label, phone, denomination, quantity, discount, total, rpc_code, status)
    VALUES (uid,_network,_card_type,COALESCE(_plan_label,''),_phone,_denomination,_quantity,0,total,upper(trim(_code)),'successful')
    RETURNING id INTO pid;
  INSERT INTO transactions(user_id, type, description, amount, status)
    VALUES (uid,'purchase', _network || ' ' || _card_type || ' purchase', -total, 'completed');
  RETURN jsonb_build_object('ok',true,'purchase_id',pid,'total',total,'discount',0,'balance',bal,'status','successful');
END;
$function$;