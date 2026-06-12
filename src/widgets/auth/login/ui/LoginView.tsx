import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Mail, Lock, Loader2 } from 'lucide-react';
import { ForgotPasswordDialog } from '@/features/auth/forgot-password/ui/ForgotPasswordDialog';
import { GoogleLoginButton } from '@/features/auth/google-login/ui/GoogleLoginButton';
import { resolveHomePathForUser } from '@/entities/session/lib/navigation';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useStore } from '@/entities/session/model/store';
import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { setAuth, user } = useStore();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // If already authenticated, redirect to the right dashboard
  if (user) {
    navigate(resolveHomePathForUser(user), { replace: true });
    return null;
  }

  function handleForgotClose() {
    setForgotOpen(false);
    setForgotEmail('');
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      const { user: authUser, tokens } = response.data;

      setAuth(authUser, tokens.accessToken, tokens.refreshToken);

      toast.success('Login successful!', {
        description: `Welcome back, ${authUser.fullName}`,
      });

      navigate(resolveHomePathForUser(authUser));
    } catch (error) {
      if (error instanceof ApiError) {
        const msg = error.firstError;
        if (error.code === 'UNAUTHORIZED') {
          setError('email', { message: msg });
          setError('password', { message: msg });
        } else if (error.code === 'FORBIDDEN' || error.code === 'ACCOUNT_DISABLED') {
          toast.error('Account not approved', { description: msg });
        } else if (error.code === 'VALIDATION_ERROR') {
          toast.error('Validation error', { description: msg });
        } else {
          toast.error('Login failed', { description: msg });
        }
      } else {
        toast.error('Login failed', {
          description: 'Could not connect to server. Please try again.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Welcome to SEAL</h1>
          <p className="text-gray-600 text-center mt-2">
            Hackathon Lifecycle Management Platform
          </p>
        </div>

        <Card className="shadow-xl border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@university.edu"
                    className="pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setForgotOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-9"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <GoogleLoginButton />
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to SEAL's Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        email={forgotEmail}
        open={forgotOpen}
        onEmailChange={setForgotEmail}
        onOpenChange={(open) => (open ? setForgotOpen(true) : handleForgotClose())}
      />
    </div>
  );
}
