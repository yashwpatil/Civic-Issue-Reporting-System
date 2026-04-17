'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PasswordStrength } from '@/components/password-strength';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';

export default function LoginView() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'user' | 'admin' | 'department'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs before submission
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (role === 'admin' && !adminCode.trim()) {
      setError('Admin code is required for admin login');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login(email, password, role, adminCode);
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'department' && user.departmentCode) {
        router.push(`/departments/${user.departmentCode}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs before submission
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeToggle = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setRole('user');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAdminCode('');
  };

  const handleRoleChange = (selectedRole: 'user' | 'admin' | 'department') => {
    setRole(selectedRole);
    setError('');
    setAdminCode('');
  };

  const roleImageMap: Record<'user' | 'admin' | 'department', string> = {
    user: '/login-user-illustration.jpg',
    department: '/login-admin-illustration.jpg',
    admin: '/login-admin-illustration.jpg',
  };

  const imageAltMap: Record<'user' | 'admin' | 'department', string> = {
    user: 'Citizen reporting civic issue',
    department: 'Department team reviewing issue dashboard',
    admin: 'Admin managing civic issues and reports',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-8 items-center">
          {/* Left side - Role-based image */}
          <div className="relative w-full max-w-[520px] h-[520px] rounded-3xl overflow-hidden shadow-xl shadow-black/10">
            <Image
              src={roleImageMap[role]}
              alt={imageAltMap[role]}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Right side - Form */}
          <div className="flex flex-col space-y-8">
            {/* Logo and Title */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">CivicHub</h1>
              <p className="text-muted-foreground text-sm">
                {mode === 'signin'
                  ? role === 'admin'
                    ? 'Manage and resolve civic issues'
                    : role === 'department'
                    ? 'Access your department issue dashboard'
                    : 'Report and track civic issues'
                  : 'Create your account and start reporting'}
              </p>
            </div>

            {/* Sign In / Sign Up Toggle */}
            <div className="flex gap-3 p-1 bg-muted rounded-lg">
              <button
                onClick={handleModeToggle}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ease-in-out ${
                  mode === 'signin'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={handleModeToggle}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ease-in-out ${
                  mode === 'signup'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {/* Name Field - Sign Up Only */}
              {mode === 'signup' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required={mode === 'signup'}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-background text-foreground placeholder:text-muted-foreground"
                />
                {mode === 'signup' && <PasswordStrength password={password} />}
              </div>

              {/* Confirm Password Field - Sign Up Only */}
              {mode === 'signup' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required={mode === 'signup'}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
              )}

              {/* Role Selector - Sign In Only */}
              {mode === 'signin' && (
                <div className="space-y-3">
                  <div className="flex gap-3 p-1 bg-muted rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('user')}
                      disabled={isSubmitting}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                        role === 'user'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('department')}
                      disabled={isSubmitting}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                        role === 'department'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Department
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('admin')}
                      disabled={isSubmitting}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-300 ease-in-out ${
                        role === 'admin'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Admin
                    </button>
                  </div>

                  {role === 'admin' && (
                    <div className="space-y-2">
                      <label htmlFor="adminCode" className="block text-sm font-medium text-foreground">
                        Admin Code
                      </label>
                      <input
                        id="adminCode"
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Enter admin code"
                        required={role === 'admin'}
                        className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-background text-foreground placeholder:text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">Demo code: ADMIN2024</p>
                    </div>
                  )}

                  {/* Hidden placeholder to maintain consistent form height */}
                  {role !== 'admin' && (
                    <div className="space-y-2 invisible">
                      <label className="block text-sm font-medium text-foreground">
                        Admin Code
                      </label>
                      <input
                        type="password"
                        placeholder="Enter admin code"
                        className="w-full px-4 py-3 border border-input rounded-lg bg-background"
                      />
                      <p className="text-xs text-muted-foreground">Demo code: ADMIN2024</p>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden placeholders for sign-up mode to maintain consistent height */}
              {mode === 'signup' && (
                <div className="space-y-3 invisible">
                  <div className="flex gap-3 p-1 bg-muted rounded-lg">
                    <button className="flex-1 py-2 px-3 rounded-md text-sm font-medium">
                      Citizen
                    </button>
                    <button className="flex-1 py-2 px-3 rounded-md text-sm font-medium">
                      Department
                    </button>
                    <button className="flex-1 py-2 px-3 rounded-md text-sm font-medium">
                      Admin
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">
                      Admin Code
                    </label>
                    <input
                      type="password"
                      placeholder="Enter admin code"
                      className="w-full px-4 py-3 border border-input rounded-lg bg-background"
                    />
                    <p className="text-xs text-muted-foreground">Demo code: ADMIN2024</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (mode === 'signup' && password !== confirmPassword)}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>

              {/* Demo Info */}
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Demo Credentials:</p>
                {mode === 'signin' ? (
                  <>
                    <p>Citizen: admin@civichub.com / Admin@123</p>
                    <p>Admin: admin@civichub.com / Admin@123 + ADMIN2024</p>
                    <p>Water Dept: water@civichub.com / DeptWater2024</p>
                    <p>Road Dept: roads@civichub.com / DeptRoads2024</p>
                    <p>Electricity Dept: electricity@civichub.com / DeptElectricity2024</p>
                    <p>Garbage Dept: garbage@civichub.com / DeptGarbage2024</p>
                  </>
                ) : (
                  <p>Sign up with any email and password (min. 6 characters)</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
