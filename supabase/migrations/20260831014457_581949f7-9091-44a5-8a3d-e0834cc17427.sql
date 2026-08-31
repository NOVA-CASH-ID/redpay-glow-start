-- 1. Withdrawal status flow: pending -> processing -> completed, plus failed
CREATE OR REPLACE FUNCTION public.admin_review_withdrawal(_withdrawal_id uuid, _status text, _note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); w withdrawals%ROWTYPE;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('ok',false,'error','Forbidden'); END IF;
  IF _status NOT IN ('pending','processing','completed','rejected','failed') THEN
    RETURN jsonb_build_object('ok',false,'error','Invalid status'); END IF;
  SELECT * INTO w FROM withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Withdrawal not found'); END IF;
  IF w.status = _status THEN RETURN jsonb_build_object('ok',false,'error','Already ' || _status); END IF;
  IF w.status IN ('rejected','completed','failed') THEN RETURN jsonb_build_object('ok',false,'error','Withdrawal already finalised'); END IF;

  UPDATE withdrawals SET status=_status, admin_note=_note, reviewed_by=uid, reviewed_at=now() WHERE id=_withdrawal_id;

  IF _status IN ('rejected','failed') THEN
    UPDATE profiles SET balance = balance + w.amount, updated_at=now() WHERE id = w.user_id;
    INSERT INTO transactions(user_id,type,description,amount,status)
      VALUES (w.user_id,'refund','Withdrawal ' || _status || ' - refund', w.amount,'completed');
  END IF;

  UPDATE transactions SET status = CASE
      WHEN _status = 'completed' THEN 'completed'
      WHEN _status IN ('rejected','failed') THEN 'failed'
      ELSE 'pending' END
   WHERE user_id = w.user_id AND type = 'withdrawal' AND status = 'pending'
     AND amount = -w.amount AND created_at <= w.created_at + interval '5 seconds'
     AND created_at >= w.created_at - interval '5 seconds';

  INSERT INTO notifications(user_id,title,body)
    VALUES (w.user_id,'Withdrawal ' || _status, 'Your withdrawal of ' || w.amount::text || ' is now ' || _status || '.');
  INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,details)
    VALUES (uid,'withdrawal_' || _status,'withdrawal',_withdrawal_id::text, jsonb_build_object('previous_status',w.status,'new_status',_status,'note',_note));
  RETURN jsonb_build_object('ok',true);
END;
$function$;

-- 2. Admin list of purchases (RPC/airtime/data)
CREATE OR REPLACE FUNCTION public.admin_list_purchases(_search text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); q text := '%' || coalesce(trim(_search),'') || '%';
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  RETURN jsonb_build_object('rows', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
    SELECT pu.id, pu.network, pu.card_type, pu.plan_label, pu.phone, pu.denomination,
           pu.quantity, pu.total, pu.rpc_code, pu.status, pu.created_at,
           p.id AS user_id, p.account_id, p.email,
           trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS full_name
    FROM purchases pu LEFT JOIN profiles p ON p.id = pu.user_id
    WHERE (coalesce(trim(_search),'') = '' OR p.email ILIKE q OR p.first_name ILIKE q
           OR p.last_name ILIKE q OR p.account_id ILIKE q OR pu.network ILIKE q OR pu.phone ILIKE q)
    ORDER BY pu.created_at DESC LIMIT 200
  ) t), '[]'::jsonb));
END; $function$;

-- 3. Stats with review-queue + recent-activity badge counts
CREATE OR REPLACE FUNCTION public.admin_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'active_7d', (SELECT count(*) FROM profiles WHERE last_seen_at > now() - interval '7 days'),
    'pending', (SELECT count(*) FROM payments WHERE status='pending'),
    'paid_naira', (SELECT COALESCE(sum(amount),0) FROM payments WHERE status='approved'),
    'approved', (SELECT count(*) FROM payments WHERE status='approved'),
    'rejected', (SELECT count(*) FROM payments WHERE status='rejected'),
    'banned', (SELECT count(*) FROM profiles WHERE status='banned'),
    'upgrades', (SELECT count(*) FROM purchases),
    'pending_withdrawals', (SELECT count(*) FROM withdrawals WHERE status IN ('pending','processing')),
    'new_payments_24h', (SELECT count(*) FROM payments WHERE created_at > now() - interval '24 hours'),
    'new_withdrawals_24h', (SELECT count(*) FROM withdrawals WHERE created_at > now() - interval '24 hours'),
    'new_purchases_24h', (SELECT count(*) FROM purchases WHERE created_at > now() - interval '24 hours'),
    'new_users_24h', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '24 hours')
  );
END;
$function$;

-- 4. Realtime for admin + user status sync
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.purchases REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;