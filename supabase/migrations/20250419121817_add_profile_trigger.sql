-- Function to create a profile entry for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to insert into public.profiles
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile record for the new user
  -- Default role is 'participant' as defined in the profiles table schema (or explicitly set here if needed)
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'participant'); -- Assuming 'participant' is the default or setting explicitly
  RETURN new;
END;
$$;

-- Trigger to call the function after a new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();