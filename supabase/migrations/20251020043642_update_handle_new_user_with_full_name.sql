create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, updated_at)
  values (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), now());
  return new;
end;
$$;