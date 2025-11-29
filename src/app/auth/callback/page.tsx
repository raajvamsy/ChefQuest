"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse hash params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (!accessToken) {
          setError('No authorization token received');
          return;
        }
        
        // Set session from hash params
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (data.session && data.user) {
          // Save user to database
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || 
                  data.user.user_metadata?.full_name || 
                  data.user.email!.split('@')[0],
            picture_url: data.user.user_metadata?.picture || 
                        data.user.user_metadata?.avatar_url,
            google_id: data.user.user_metadata?.sub,
            last_login_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

          setTimeout(() => {
            router.push('/home');
          }, 500);
        } else {
          setError('Failed to create session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center px-6">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-text-dark">Authentication Failed</h2>
          <p className="text-sm text-text-medium">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-dark transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 size={48} className="animate-spin text-primary mx-auto" />
        <p className="text-text-medium">Completing sign in...</p>
        <p className="text-xs text-text-medium">Please wait</p>
      </div>
    </div>
  );
}
