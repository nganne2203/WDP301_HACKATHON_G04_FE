import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { setTokens } from '../../lib/api/client';
import { authApi } from '../../lib/api/auth';
import { toast } from 'sonner';

/**
 * Handles the redirect from the backend's Google OAuth callback.
 * The backend sends tokens as query params: ?success=true&accessToken=...&refreshToken=...
 * Or on error: ?success=false&error=...
 */
export function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get('success');
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (success === 'false' || error) {
        setStatus('error');
        setErrorMessage(error || 'Google login failed. Please try again.');
        toast.error('Google login failed', { description: error || 'Please try again.' });
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      if (success === 'true' && accessToken && refreshToken) {
        try {
          setTokens(accessToken, refreshToken);
          // Fetch the full user profile
          const meResponse = await authApi.getMe();
          const user = meResponse.data;

          setAuth(user, accessToken, refreshToken);
          setStatus('success');
          toast.success('Login successful!', {
            description: `Welcome, ${user.fullName}`,
          });

          // Determine where to navigate based on role
          const roleNames = user.roles.map((r) => r.name?.toUpperCase()).filter(Boolean);
          let redirectTo = '/participant';
          if (roleNames.includes('ADMIN')) redirectTo = '/admin';
          else if (roleNames.includes('EVENT_COORDINATOR') || roleNames.includes('COORDINATOR'))
            redirectTo = '/coordinator';
          else if (roleNames.includes('JUDGE')) redirectTo = '/judge';
          else if (roleNames.includes('MENTOR')) redirectTo = '/mentor';

          setTimeout(() => navigate(redirectTo, { replace: true }), 500);
        } catch (err) {
          setStatus('error');
          setErrorMessage('Failed to fetch user profile.');
          toast.error('Login failed', { description: 'Could not retrieve user profile.' });
          setTimeout(() => navigate('/login', { replace: true }), 2500);
        }
      } else {
        setStatus('error');
        setErrorMessage('Invalid callback parameters.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-gray-600">Completing Google login...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-green-600" />
            <p className="text-gray-800 font-medium">Login successful!</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-500" />
            <p className="text-gray-800 font-medium">Login failed</p>
            <p className="text-sm text-gray-500">{errorMessage}</p>
            <p className="text-xs text-gray-400">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
