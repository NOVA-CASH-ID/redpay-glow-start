DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, first_name, last_name, phone, country, account_id, referral_code, balance)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'first_name',''),
       COALESCE(u.raw_user_meta_data->>'last_name',''),
       u.raw_user_meta_data->>'phone',
       u.raw_user_meta_data->>'country',
       'RP' || lpad((floor(random()*900000000)+100000000)::bigint::text, 9, '0'),
       'REF' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6)),
       160000
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;