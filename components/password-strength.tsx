interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (): { strength: number; label: string; color: string } => {
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: 'Too weak', color: 'bg-destructive' },
      { strength: 1, label: 'Weak', color: 'bg-orange-500' },
      { strength: 2, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 3, label: 'Good', color: 'bg-blue-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[Math.min(strength, 5)];
  };

  if (!password) return null;

  const { strength, label, color } = getStrength();

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-foreground/70">Password Strength</label>
        <span className="text-xs font-medium text-foreground/70">{label}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      <div className="mt-2 space-y-1 text-xs text-foreground/60">
        <p>{password.length < 6 ? '✗' : '✓'} At least 6 characters</p>
        <p>{/[A-Z]/.test(password) && /[a-z]/.test(password) ? '✓' : '✗'} Uppercase and lowercase letters</p>
        <p>{/[0-9]/.test(password) ? '✓' : '✗'} At least one number</p>
      </div>
    </div>
  );
}
