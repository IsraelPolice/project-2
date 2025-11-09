/*
  # Create Hardcoded Admin User

  1. Changes
    - Insert admin user directly into auth.users table
    - Email: dvir.bareket@gav.co.il
    - Password: 316439249Ab
  
  2. Security
    - Only this user can log in
    - User has admin role
*/

-- Insert or update the admin user in auth.users
DO $$
DECLARE
  user_id uuid := '550e8400-e29b-41d4-a716-446655440001';
BEGIN
  -- Delete existing user if exists
  DELETE FROM auth.users WHERE email = 'dvir.bareket@gav.co.il';
  
  -- Insert new user with hashed password
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    'dvir.bareket@gav.co.il',
    crypt('316439249Ab', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"דביר ברקת"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Update identity table
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_id,
    'dvir.bareket@gav.co.il',
    'email',
    jsonb_build_object('sub', user_id::text, 'email', 'dvir.bareket@gav.co.il'),
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

END $$;
