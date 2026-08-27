-- 1. Profile status fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

-- keep email in sync on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  new_account_id text;
  new_ref_code text;
BEGIN
  new_account_id := 'RP' || lpad((floor(random()*900000000)+100000000)::bigint::text, 9, '0');
  new_ref_code := 'REF' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6));

  INSERT INTO public.profiles (id, first_name, last_name, phone, country, account_id, referral_code, balance, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name',''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    new_account_id,
    new_ref_code,
    160000,
    NEW.email
  );

  INSERT INTO public.transactions (user_id, type, description, amount, status)
  VALUES (NEW.id, 'bonus', 'Welcome bonus', 160000, 'completed');

  INSERT INTO public.notifications (user_id, title, body)
  VALUES (NEW.id, 'Welcome to RedPay 🎉', 'Your welcome bonus has been credited to your wallet.');

  RETURN NEW;
END;
$function$;

-- helper: is caller banned
CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE((SELECT status = 'banned' FROM public.profiles WHERE id = _user_id), false)
$$;

-- admins can read/update all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all transactions" ON public.transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  purpose text NOT NULL DEFAULT 'deposit',
  reference text,
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT public.is_banned(auth.uid()));
CREATE POLICY "Admins update payments" ON public.payments
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'bank',
  bank_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  account_name text NOT NULL DEFAULT '',
  rpc_code text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update withdrawals" ON public.withdrawals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL DEFAULT '',
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Settings seeds
INSERT INTO public.app_config(key, value) VALUES
  ('bank', '{"bank_name":"","account_name":"","account_number":"","branch":""}'::jsonb),
  ('support', '{"whatsapp_enabled":true,"whatsapp_link":"","whatsapp_text":"WhatsApp Support","telegram_enabled":true,"telegram_link":"","telegram_text":"Telegram Support"}'::jsonb),
  ('community', '{"whatsapp_enabled":true,"whatsapp_link":"","whatsapp_text":"Join WhatsApp Group","telegram_enabled":true,"telegram_link":"","telegram_text":"Join Telegram Group"}'::jsonb),
  ('withdrawal', '{"amount":160000,"rpc_code":"RPC200420"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Withdrawal code check honours the general code in settings
CREATE OR REPLACE FUNCTION public.check_withdrawal_code(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE cfg jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('valid', false, 'error', 'Not authenticated'); END IF;
  SELECT value INTO cfg FROM app_config WHERE key = 'withdrawal';
  IF upper(trim(_code)) = upper(COALESCE(cfg->>'rpc_code','RPC200420')) THEN
    RETURN jsonb_build_object('valid', true, 'label', 'Withdrawal code accepted');
  END IF;
  RETURN jsonb_build_object('valid', false, 'error', 'Invalid withdrawal code');
END;
$$;

-- 7. Request withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _bank_name text, _account_number text, _account_name text, _code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); cfg jsonb; bal numeric; wid uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not authenticated'); END IF;
  IF public.is_banned(uid) THEN RETURN jsonb_build_object('ok',false,'error','Account suspended'); END IF;
  SELECT value INTO cfg FROM app_config WHERE key='withdrawal';
  IF upper(trim(COALESCE(_code,''))) <> upper(COALESCE(cfg->>'rpc_code','RPC200420')) THEN
    RETURN jsonb_build_object('ok',false,'error','Invalid withdrawal code');
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RETURN jsonb_build_object('ok',false,'error','Invalid amount'); END IF;
  IF length(trim(COALESCE(_bank_name,''))) < 2 OR length(trim(COALESCE(_account_number,''))) < 10
     OR length(trim(COALESCE(_account_name,''))) < 3 THEN
    RETURN jsonb_build_object('ok',false,'error','Complete your bank details');
  END IF;
  SELECT balance INTO bal FROM profiles WHERE id = uid FOR UPDATE;
  IF bal < _amount THEN RETURN jsonb_build_object('ok',false,'error','Insufficient balance'); END IF;
  UPDATE profiles SET balance = balance - _amount, updated_at = now() WHERE id = uid;
  INSERT INTO withdrawals(user_id, amount, bank_name, account_number, account_name, rpc_code, status)
    VALUES (uid, _amount, trim(_bank_name), trim(_account_number), trim(_account_name), upper(trim(_code)), 'pending')
    RETURNING id INTO wid;
  INSERT INTO transactions(user_id, type, description, amount, status)
    VALUES (uid,'withdrawal','Withdrawal request - ' || trim(_bank_name), -_amount, 'pending');
  RETURN jsonb_build_object('ok',true,'withdrawal_id',wid);
END;
$$;

-- 8. Submit payment (record only; file already uploaded to storage)
CREATE OR REPLACE FUNCTION public.submit_payment(_amount numeric, _reference text, _screenshot_path text, _purpose text DEFAULT 'deposit')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); pid uuid;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Not authenticated'); END IF;
  IF public.is_banned(uid) THEN RETURN jsonb_build_object('ok',false,'error','Account suspended'); END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RETURN jsonb_build_object('ok',false,'error','Invalid amount'); END IF;
  INSERT INTO payments(user_id, amount, reference, screenshot_path, purpose, status)
    VALUES (uid, _amount, NULLIF(trim(COALESCE(_reference,'')),''), NULLIF(trim(COALESCE(_screenshot_path,'')),''), COALESCE(_purpose,'deposit'), 'pending')
    RETURNING id INTO pid;
  RETURN jsonb_build_object('ok',true,'payment_id',pid);
END;
$$;

-- 9. Admin actions
CREATE OR REPLACE FUNCTION public.admin_review_payment(_payment_id uuid, _status text, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); p payments%ROWTYPE;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('ok',false,'error','Forbidden'); END IF;
  IF _status NOT IN ('approved','rejected','pending') THEN RETURN jsonb_build_object('ok',false,'error','Invalid status'); END IF;
  SELECT * INTO p FROM payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Payment not found'); END IF;
  IF p.status = _status THEN RETURN jsonb_build_object('ok',false,'error','Already ' || _status); END IF;
  UPDATE payments SET status=_status, admin_note=_note, reviewed_by=uid, reviewed_at=now() WHERE id=_payment_id;
  IF _status = 'approved' AND p.status <> 'approved' THEN
    UPDATE profiles SET balance = balance + p.amount, updated_at=now() WHERE id = p.user_id;
    INSERT INTO transactions(user_id,type,description,amount,status)
      VALUES (p.user_id,'deposit','Payment approved', p.amount,'completed');
  END IF;
  INSERT INTO notifications(user_id,title,body)
    VALUES (p.user_id,'Payment ' || _status, 'Your payment of ' || p.amount::text || ' was ' || _status || '.');
  INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,details)
    VALUES (uid,'payment_' || _status,'payment',_payment_id::text, jsonb_build_object('previous_status',p.status,'new_status',_status,'note',_note));
  RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_withdrawal(_withdrawal_id uuid, _status text, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); w withdrawals%ROWTYPE;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('ok',false,'error','Forbidden'); END IF;
  IF _status NOT IN ('pending','processing','approved','rejected','completed') THEN
    RETURN jsonb_build_object('ok',false,'error','Invalid status'); END IF;
  SELECT * INTO w FROM withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Withdrawal not found'); END IF;
  IF w.status = _status THEN RETURN jsonb_build_object('ok',false,'error','Already ' || _status); END IF;
  IF w.status IN ('rejected','completed') THEN RETURN jsonb_build_object('ok',false,'error','Withdrawal already finalised'); END IF;
  UPDATE withdrawals SET status=_status, admin_note=_note, reviewed_by=uid, reviewed_at=now() WHERE id=_withdrawal_id;
  IF _status = 'rejected' THEN
    UPDATE profiles SET balance = balance + w.amount, updated_at=now() WHERE id = w.user_id;
    INSERT INTO transactions(user_id,type,description,amount,status)
      VALUES (w.user_id,'refund','Withdrawal rejected - refund', w.amount,'completed');
  END IF;
  INSERT INTO notifications(user_id,title,body)
    VALUES (w.user_id,'Withdrawal ' || _status, 'Your withdrawal of ' || w.amount::text || ' is now ' || _status || '.');
  INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,details)
    VALUES (uid,'withdrawal_' || _status,'withdrawal',_withdrawal_id::text, jsonb_build_object('previous_status',w.status,'new_status',_status,'note',_note));
  RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_ban(_user_id uuid, _banned boolean, _reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('ok',false,'error','Forbidden'); END IF;
  UPDATE profiles SET status = CASE WHEN _banned THEN 'banned' ELSE 'active' END,
    ban_reason = CASE WHEN _banned THEN _reason ELSE NULL END,
    banned_at = CASE WHEN _banned THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = _user_id;
  INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,details)
    VALUES (uid, CASE WHEN _banned THEN 'user_banned' ELSE 'user_unbanned' END,'user',_user_id::text, jsonb_build_object('reason',_reason));
  RETURN jsonb_build_object('ok',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_setting(_key text, _value jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); prev jsonb;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('ok',false,'error','Forbidden'); END IF;
  IF _key NOT IN ('bank','support','community','withdrawal','claim','referral') THEN
    RETURN jsonb_build_object('ok',false,'error','Unknown setting'); END IF;
  SELECT value INTO prev FROM app_config WHERE key=_key;
  INSERT INTO app_config(key,value) VALUES (_key,_value)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
  INSERT INTO admin_audit_log(admin_id,action,target_type,target_id,details)
    VALUES (uid,'setting_updated','app_config',_key, jsonb_build_object('previous',prev,'new',_value));
  RETURN jsonb_build_object('ok',true);
END;
$$;

-- 10. Dashboard stats
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
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
    'pending_withdrawals', (SELECT count(*) FROM withdrawals WHERE status='pending')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  UPDATE profiles SET last_seen_at = now() WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true);
END;
$$;