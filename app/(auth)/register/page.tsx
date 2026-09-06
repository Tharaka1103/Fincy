"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed, UserPlus, Spark, CheckCircle } from "iconoir-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: (score / 6) * 100, label: "Weak", color: "bg-destructive" };
  if (score <= 4) return { score: (score / 6) * 100, label: "Fair", color: "bg-amber-500" };
  return { score: (score / 6) * 100, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");
  const strength = getPasswordStrength(passwordValue);

  async function onSubmit(data: RegisterInput) {
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error ?? "Registration failed. Please try again.");
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        // Redirect to login with success message
        router.push("/login?registered=true");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  if (success) {
    return (
      <div className="glass-card rounded-3xl p-8 animate-fade-in-up shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4 animate-scale-in">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">Account Created!</h2>
        <p className="text-muted-foreground text-sm">Taking you to your dashboard…</p>
        <div className="mt-4 animate-shimmer h-1 rounded-full" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8 animate-fade-in-up shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg">
          <span className="text-primary-foreground font-black text-2xl">F</span>
        </div>
        <h1 className="text-2xl font-heading font-black gradient-text mb-1">
          Create your account
        </h1>
        <p className="text-muted-foreground text-sm">
          Start managing your finances today
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 glass-subtle border-destructive/30 animate-fade-in" id="register-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Google OAuth */}
      <Button
        id="google-register-btn"
        type="button"
        variant="outline"
        className="w-full h-11 glass-subtle border-border/60 hover:border-primary/40 hover:glow-sm transition-all"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Spark className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <GoogleIcon className="h-4 w-4 mr-2" />
        )}
        Sign up with Google
      </Button>

      <div className="flex items-center gap-3 my-5">
        <Separator className="flex-1 bg-border/40" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1 bg-border/40" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="register-form">
        <div className="space-y-1.5">
          <Label htmlFor="register-name">Full name</Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            className="h-11 glass-subtle border-border/60 focus:border-primary/60 focus:glow-sm transition-all"
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email address</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            className="h-11 glass-subtle border-border/60 focus:border-primary/60 focus:glow-sm transition-all"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className="h-11 glass-subtle border-border/60 focus:border-primary/60 focus:glow-sm transition-all pr-10"
              {...register("password")}
            />
            <button
              type="button"
              id="toggle-password"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Password strength */}
          {passwordValue && (
            <div className="space-y-1 animate-fade-in">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${strength.score < 50 ? "text-destructive" : strength.score < 80 ? "text-amber-500" : "text-emerald-500"}`}>
                {strength.label} password
              </p>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="register-confirm-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="h-11 glass-subtle border-border/60 focus:border-primary/60 focus:glow-sm transition-all pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              id="toggle-confirm-password"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          id="register-submit-btn"
          type="submit"
          className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 hover:glow-sm transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spark className="h-4 w-4 animate-spin mr-2" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create account
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" id="login-link" className="text-primary font-medium hover:text-primary/80 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
