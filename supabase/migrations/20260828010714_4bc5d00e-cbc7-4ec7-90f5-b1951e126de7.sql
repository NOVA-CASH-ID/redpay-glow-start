-- grant admin role to the admin account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'chiboy82300@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- keep admin role in sync for that email on future signups
CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'chiboy82300@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();

-- admins can read payment proof files
DROP POLICY IF EXISTS "Admins read payment proofs" ON storage.objects;
CREATE POLICY "Admins read payment proofs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- users can read their own role rows
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- everyone signed in can read public app settings (bank/support/community)
DROP POLICY IF EXISTS "Read app config" ON public.app_config;
CREATE POLICY "Read app config" ON public.app_config
FOR SELECT TO authenticated USING (key IN ('bank','support','community'));

-- admin listing helpers
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _status text DEFAULT 'all', _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rows jsonb; total bigint; q text := '%' || coalesce(trim(_search),'') || '%';
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  SELECT count(*) INTO total FROM profiles p
   WHERE (_status = 'all' OR coalesce(p.status,'active') = _status)
     AND (coalesce(trim(_search),'') = '' OR p.first_name ILIKE q OR p.last_name ILIKE q OR p.email ILIKE q OR p.phone ILIKE q OR p.account_id ILIKE q OR p.id::text ILIKE q);
  SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) INTO rows FROM (
    SELECT p.id, p.account_id, p.first_name, p.last_name, p.email, p.phone, p.country,
           p.balance, coalesce(p.status,'active') AS status, p.ban_reason, p.created_at, p.last_seen_at
    FROM profiles p
    WHERE (_status = 'all' OR coalesce(p.status,'active') = _status)
      AND (coalesce(trim(_search),'') = '' OR p.first_name ILIKE q OR p.last_name ILIKE q OR p.email ILIKE q OR p.phone ILIKE q OR p.account_id ILIKE q OR p.id::text ILIKE q)
    ORDER BY p.created_at DESC LIMIT greatest(1, least(_limit,100)) OFFSET greatest(0,_offset)
  ) t;
  RETURN jsonb_build_object('total', total, 'rows', rows);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_payments(_search text DEFAULT NULL, _status text DEFAULT 'all')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); q text := '%' || coalesce(trim(_search),'') || '%';
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  RETURN jsonb_build_object('rows', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
    SELECT pay.id, pay.amount, pay.reference, pay.screenshot_path, pay.status, pay.purpose,
           pay.created_at, pay.admin_note, p.id AS user_id, p.account_id, p.email,
           trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS full_name
    FROM payments pay LEFT JOIN profiles p ON p.id = pay.user_id
    WHERE (_status = 'all' OR pay.status = _status)
      AND (coalesce(trim(_search),'') = '' OR p.email ILIKE q OR p.first_name ILIKE q OR p.last_name ILIKE q OR p.account_id ILIKE q)
    ORDER BY pay.created_at DESC LIMIT 200
  ) t), '[]'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_withdrawals(_status text DEFAULT 'all')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  RETURN jsonb_build_object('rows', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
    SELECT w.id, w.amount, w.bank_name, w.account_number, w.account_name, w.status, w.created_at,
           w.admin_note, p.id AS user_id, p.account_id, p.email,
           trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS full_name
    FROM withdrawals w LEFT JOIN profiles p ON p.id = w.user_id
    WHERE (_status = 'all' OR w.status = _status)
    ORDER BY w.created_at DESC LIMIT 200
  ) t), '[]'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_get_settings()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  RETURN coalesce((SELECT jsonb_object_agg(key, value) FROM app_config), '{}'::jsonb);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_user_detail(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN jsonb_build_object('error','Forbidden'); END IF;
  RETURN jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM profiles p WHERE p.id = _user_id),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM payments WHERE user_id=_user_id ORDER BY created_at DESC LIMIT 50) x),'[]'::jsonb),
    'withdrawals', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM withdrawals WHERE user_id=_user_id ORDER BY created_at DESC LIMIT 50) x),'[]'::jsonb),
    'transactions', coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM transactions WHERE user_id=_user_id ORDER BY created_at DESC LIMIT 50) x),'[]'::jsonb)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.admin_signed_proof_path(_payment_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); p text;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid,'admin') THEN RETURN NULL; END IF;
  SELECT screenshot_path INTO p FROM payments WHERE id = _payment_id;
  RETURN p;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(text,text,int,int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_payments(text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_withdrawals(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_settings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_user_detail(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_signed_proof_path(uuid) FROM anon;