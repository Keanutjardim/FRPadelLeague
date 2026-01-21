import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  onSuccess: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [playtomicLevel, setPlaytomicLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[AuthForm] Form submitted, isLogin:', isLogin, 'isForgotPassword:', isForgotPassword);

    try {
      if (isForgotPassword) {
        console.log('[AuthForm] Attempting password reset...');
        const result = await resetPassword(email);
        if (result.success) {
          toast({ title: 'Check your email', description: 'We sent you a password reset link.' });
          setIsForgotPassword(false);
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to send reset email.', variant: 'destructive' });
        }
      } else if (isLogin) {
        console.log('[AuthForm] Attempting login...');
        const result = await login(email, password);
        console.log('[AuthForm] Login result:', result);
        if (result.success) {
          toast({ title: 'Welcome back!', description: 'You have logged in successfully.' });
          onSuccess();
        } else {
          toast({ title: 'Login failed', description: result.error || 'Invalid email or password.', variant: 'destructive' });
        }
      } else {
        if (!gender) {
          toast({ title: 'Error', description: 'Please select your gender.', variant: 'destructive' });
          return;
        }

        const level = parseFloat(playtomicLevel);
        if (isNaN(level) || level < 0 || level > 6) {
          toast({ title: 'Error', description: 'Playtomic level must be between 0 and 6.', variant: 'destructive' });
          return;
        }

        if (password !== confirmPassword) {
          toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
          return;
        }

        console.log('[AuthForm] Attempting registration...');
        const result = await register({
          email,
          phone,
          name,
          gender,
          playtomicLevel: level,
        }, password);
        console.log('[AuthForm] Registration result:', result);

        if (result.success) {
          toast({ title: 'Welcome!', description: 'Your account has been created.' });
          onSuccess();
        } else {
          toast({ title: 'Registration failed', description: result.error || 'An error occurred.', variant: 'destructive' });
        }
      }
    } catch (err) {
      console.error('[AuthForm] Unexpected error:', err);
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    } finally {
      console.log('[AuthForm] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsLogin(true);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo Header - responsive sizing */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
        <img src="/logofr.png" alt="Padel League Logo" className="h-8 sm:h-12 w-auto" />
        <span className="text-2xl sm:text-4xl font-normal tracking-tight whitespace-nowrap" style={{ fontFamily: 'Lora, Georgia, serif' }}>Padel League</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Login' : 'Sign Up')}
          </CardTitle>
          <CardDescription>
            {isForgotPassword
              ? 'Enter your email to receive a reset link'
              : (isLogin ? 'Enter your credentials to access your account' : 'Create your account to join the league')}
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isLogin && !isForgotPassword && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Playtomic Level (0-6)</Label>
                <Input
                  id="level"
                  type="number"
                  step="0.01"
                  min="0"
                  max="6"
                  value={playtomicLevel}
                  onChange={(e) => setPlaytomicLevel(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {!isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? 'Please wait...'
              : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Login' : 'Create Account'))}
          </Button>

          {isLogin && !isForgotPassword && (
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={() => setIsForgotPassword(true)}
            >
              Forgot password?
            </Button>
          )}

          {isForgotPassword ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
            >
              Back to login
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </Button>
          )}
        </form>
      </CardContent>
      </Card>
    </div>
  );
}
