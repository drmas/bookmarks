import { json, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { supabase } from '~/utils/supabase.server';
import { createUserSession } from '~/utils/auth.server';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { PasswordInput } from '~/components/ui/PasswordInput';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const action = formData.get('action');
  const remember = formData.get('remember') === 'on';

  if (!email || !password) {
    return json(
      { error: 'Please provide both email and password' },
      { status: 400 }
    );
  }

  try {
    if (action === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!data.session) {
        return json({ message: 'Please check your email to continue sign up' });
      }

      return createUserSession(request, data.session);
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      return createUserSession(request, data.session);
    }
  } catch (error) {
    return json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <img
            src="/logo-dark.png"
            alt="Logo"
            className="mx-auto h-12 w-auto dark:hidden"
          />
          <img
            src="/logo-light.png"
            alt="Logo"
            className="mx-auto h-12 w-auto hidden dark:block"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <button
              type="submit"
              form="loginForm"
              name="action"
              value="signup"
              className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
            >
              create a new account
            </button>
          </p>
        </div>
        <Form id="loginForm" method="post" className="mt-8 space-y-6">
          {actionData?.error && (
            <div className="text-red-600 text-center">{actionData.error}</div>
          )}
          {actionData?.message && (
            <div className="text-green-600 text-center">{actionData.message}</div>
          )}
          <div className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email address"
              aria-label="Email address"
              error={actionData?.error}
            />
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="Password"
              aria-label="Password"
              error={actionData?.error}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            name="action"
            value="login"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </Form>
      </div>
    </div>
  );
}