/*
  # Fix Auth Trigger

  1. Changes
    - Drop incorrect trigger on public.users
    - Create correct trigger on auth.users
  
  2. Security
    - Trigger automatically creates user profile on signup
    - Only dvir.bareket@gav.co.il gets admin role
*/

-- Drop incorrect trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;

-- Create correct trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
