import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { resolveHomePathForUser } from '@/entities/session/lib/navigation';
import { useGoogleSignInMutation } from '@/hooks/mutations/useAuthMutations';
import { ApiError } from '@/shared/api/client';

interface GoogleCredentialPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

function decodeGoogleCredential(credential: string): GoogleCredentialPayload {
  const payload = credential.split('.')[1];
  if (!payload) throw new Error('Google returned an invalid credential.');

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const claims = JSON.parse(new TextDecoder().decode(bytes)) as Partial<GoogleCredentialPayload>;

  if (!claims.sub || !claims.email || !claims.name) {
    throw new Error('Google profile is missing required information.');
  }

  return claims as GoogleCredentialPayload;
}

export function GoogleLoginButton() {
  const navigate = useNavigate();
  const googleSignInMutation = useGoogleSignInMutation();

  async function handleSuccess(response: CredentialResponse) {
    let profile: GoogleCredentialPayload | null = null;

    try {
      if (!response.credential) throw new Error('Google did not return a credential.');

      profile = decodeGoogleCredential(response.credential);
      const authResponse = await googleSignInMutation.mutateAsync({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture ?? null,
      });
      const { user } = authResponse.data;

      toast.success('Login successful!', {
        description: `Welcome, ${user.fullName}`,
      });
      navigate(resolveHomePathForUser(user));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'GOOGLE_ACCOUNT_NOT_FOUND') {
        toast.error('Account not found', { description: error.firstError });
        return;
      }

      if (error instanceof ApiError && error.code === 'FORBIDDEN') {
        toast.error('Account unavailable', { description: error.firstError });
        return;
      }

      const description = error instanceof ApiError
        ? error.firstError
        : error instanceof Error
          ? error.message
          : 'Please try again.';
      toast.error('Google login failed', { description });
    }
  }

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error('Google login failed', { description: 'Please try again.' })}
        text="signin_with"
        shape="rectangular"
        size="large"
        theme="outline"
        width="400"
        ux_mode="popup"
      />
    </div>
  );
}
