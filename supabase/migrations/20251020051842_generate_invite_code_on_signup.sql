create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
DECLARE
  generated_code TEXT;
  base_slug TEXT;
  random_suffix TEXT;
  is_unique BOOLEAN;
  -- Maximum length for the base slug to prevent overly long invite codes
  max_base_slug_length INT := 20;
  -- Length of the random suffix
  suffix_length INT := 6;
BEGIN
  -- 1. Determine the base for the slug from user metadata or email
  base_slug := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  -- 2. Sanitize the base slug: lowercase, remove non-alphanumeric, and truncate
  base_slug := lower(regexp_replace(base_slug, '[^a-zA-Z0-9]', '', 'g'));
  
  IF length(base_slug) > max_base_slug_length THEN
    base_slug := substr(base_slug, 1, max_base_slug_length);
  END IF;

  -- 3. Loop to find a unique invite_code
  LOOP
    -- Generate a random alphanumeric suffix
    random_suffix := substr(md5(random()::text), 0, suffix_length + 1);
    generated_code := base_slug || random_suffix;

    -- Check if the generated code already exists in the users table
    SELECT NOT EXISTS (SELECT 1 FROM public.users WHERE invite_code = generated_code)
    INTO is_unique;

    -- Exit the loop if the code is unique
    EXIT WHEN is_unique;
  END LOOP;

  -- 4. Insert the new user with the sanitized full_name and the unique invite_code
  insert into public.users (id, email, full_name, invite_code, updated_at)
  values (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    generated_code,
    now()
  );

  return new;
end;
$$;