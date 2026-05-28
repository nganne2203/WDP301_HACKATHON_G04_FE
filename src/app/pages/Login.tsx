import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useStore } from '../../store/useStore';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
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
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated, redirect to the right dashboard
  if (user) {
    const roleNames = user.roles.map((r) => r.name?.toUpperCase()).filter(Boolean);
    let redirectTo = '/participant';
    if (roleNames.includes('ADMIN')) redirectTo = '/admin';
    else if (roleNames.includes('EVENT_COORDINATOR') || roleNames.includes('COORDINATOR'))
      redirectTo = '/coordinator';
    else if (roleNames.includes('JUDGE')) redirectTo = '/judge';
    else if (roleNames.includes('MENTOR')) redirectTo = '/mentor';
    navigate(redirectTo, { replace: true });
  }

  function handleForgotSubmit() {
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    setForgotSent(true);
    toast.success('Reset link sent — check your inbox.');
  }

  function handleForgotClose() {
    setForgotOpen(false);
    setForgotEmail('');
    setForgotSent(false);
  }

  function handleGoogleLogin() {
    window.location.href = authApi.getGoogleLoginUrl();
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

      // Navigate based on role
      const roleNames = authUser.roles.map((r) => r.name?.toUpperCase()).filter(Boolean);
      let redirectTo = '/participant';
      if (roleNames.includes('ADMIN')) redirectTo = '/admin';
      else if (roleNames.includes('EVENT_COORDINATOR') || roleNames.includes('COORDINATOR'))
        redirectTo = '/coordinator';
      else if (roleNames.includes('JUDGE')) redirectTo = '/judge';
      else if (roleNames.includes('MENTOR')) redirectTo = '/mentor';

      navigate(redirectTo);
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

              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
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
      <Dialog open={forgotOpen} onOpenChange={handleForgotClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          {forgotSent ? (
            <div className="space-y-4 mt-1">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                A password reset link has been sent to <strong>{forgotEmail}</strong>. Please check your inbox.
              </div>
              <Button className="w-full" onClick={handleForgotClose}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              <div>
                <Label htmlFor="forgot-email">Email address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@university.edu"
                    className="pl-9"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotSubmit()}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleForgotClose}>Cancel</Button>
                <Button className="flex-1" onClick={handleForgotSubmit}>Send Reset Link</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
