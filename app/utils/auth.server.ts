import { createServerClient } from '@supabase/auth-helpers-remix';
import { redirect } from '@remix-run/node';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase.server';
import { getSession, commitSession, destroySession } from './session.server';

export async function createUserSession(request: Request, session: Session) {
  const cookieSession = await getSession(request.headers.get('Cookie'));
  cookieSession.set('access_token', session.access_token);
  cookieSession.set('refresh_token', session.refresh_token);

  return redirect('/', {
    headers: {
      'Set-Cookie': await commitSession(cookieSession),
    },
  });
}

export async function requireUser(request: Request) {
  const cookieSession = await getSession(request.headers.get('Cookie'));
  const accessToken = cookieSession.get('access_token');

  if (!accessToken) {
    throw redirect('/login');
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw redirect('/login');
  }

  return user;
}

export async function createSupabaseClient(request: Request) {
  const response = new Response();
  
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  );

  return { supabaseClient, response };
}

export async function logout(request: Request) {
  const cookieSession = await getSession(request.headers.get('Cookie'));
  return redirect('/login', {
    headers: {
      'Set-Cookie': await destroySession(cookieSession),
    },
  });
}