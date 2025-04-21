-- Update handle_new_user function to correctly populate profiles with first/last name and email

-- Drop the existing trigger first (from original or debug migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function to pull names from metadata and email from the user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Required to insert into public.profiles
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile record for the new user
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email, -- Get email directly from auth.users record
    new.raw_user_meta_data ->> 'first_name', -- Get first_name from metadata
    new.raw_user_meta_data ->> 'last_name',  -- Get last_name from metadata
    'participant' -- Set default role
  );
  RETURN new;
END;
$$;

-- Recreate the trigger to call the updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();