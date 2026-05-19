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
import { mockEvent } from '../../lib/data';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { setUser, setSelectedEvent } = useStore();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const roleMap: Record<string, 'coordinator' | 'judge' | 'participant' | 'mentor' | 'admin'> = {
        'coordinator@university.edu': 'coordinator',
        'judge@university.edu': 'judge',
        'participant@university.edu': 'participant',
        'mentor@university.edu': 'mentor',
        'admin@university.edu': 'admin',
      };

      const role = roleMap[data.email] || 'participant';

      const mockUser = {
        id: 'usr-demo',
        name: role === 'coordinator' ? 'Dr. Sarah Johnson' :
              role === 'judge' ? 'Prof. David Lee' :
              role === 'mentor' ? 'Dr. Emily Zhang' :
              role === 'admin' ? 'Admin User' :
              'Alice Chen',
        email: data.email,
        role,
      };

      setUser(mockUser);
      setSelectedEvent(mockEvent);

      toast.success('Login successful!', {
        description: `Welcome back, ${mockUser.name}`,
      });

      const routes = {
        admin: '/admin',
        coordinator: '/coordinator',
        judge: '/judge',
        participant: '/participant',
        mentor: '/mentor',
      };

      navigate(routes[role]);
    } catch (error) {
      toast.error('Login failed', {
        description: 'Invalid email or password. Please try again.',
      });
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
                  <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-700">Quick login:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Coordinator:</span>
                    <br />
                    coordinator@university.edu
                  </div>
                  <div>
                    <span className="font-medium">Judge:</span>
                    <br />
                    judge@university.edu
                  </div>
                  <div>
                    <span className="font-medium">Participant:</span>
                    <br />
                    participant@university.edu
                  </div>
                  <div>
                    <span className="font-medium">Admin:</span>
                    <br />
                    admin@university.edu
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Password: any 8+ characters</p>
              </div>
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
