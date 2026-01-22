import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Listen for auth state changes FIRST (Supabase will process the URL tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ResetPassword] Auth event:', event, 'Session:', !!session);

      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        console.log('[ResetPassword] PASSWORD_RECOVERY event received');
        setIsValidSession(true);
        setCheckingSession(false);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('[ResetPassword] SIGNED_IN event with session');
        setIsValidSession(true);
        setCheckingSession(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[ResetPassword] TOKEN_REFRESHED event with session');
        setIsValidSession(true);
        setCheckingSession(false);
      }
    });

    // Check for existing session after a small delay to let Supabase process URL tokens
    const checkSession = async () => {
      // Wait a bit for Supabase to process any tokens in the URL
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!isMounted) return;

      try {
        console.log('[ResetPassword] Checking session...');
        console.log('[ResetPassword] URL hash:', window.location.hash);

        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('[ResetPassword] Session error:', error);
        } else if (session) {
          console.log('[ResetPassword] Valid session found');
          setIsValidSession(true);
          setCheckingSession(false);
          return;
        } else {
          console.log('[ResetPassword] No session found yet');
        }
      } catch (err) {
        console.error('[ResetPassword] Error checking session:', err);
      }

      // If still checking after delay, wait a bit more then give up
      if (isMounted && checkingSession) {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('[ResetPassword] Timeout reached, marking as invalid');
            setCheckingSession(false);
          }
        }, 3000); // Give 3 more seconds for recovery event
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Your password has been reset. You can now log in with your new password.',
        });

        // Sign out and redirect to login
        await supabase.auth.signOut();
        navigate('/');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Logo Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
          <img src="/logofr.png" alt="Padel League Logo" className="h-8 sm:h-12 w-auto" />
          <span className="text-2xl sm:text-4xl font-normal tracking-tight whitespace-nowrap" style={{ fontFamily: 'Lora, Georgia, serif' }}>Padel League</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Reset Password'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
