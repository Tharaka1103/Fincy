"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed, LogIn, WarningTriangle, Spark } from "iconoir-react";

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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { authApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showForceLogoutDialog, setShowForceLogoutDialog] = React.useState(false);
  const [deviceInfo, setDeviceInfo] = React.useState<string | null>(null);
  const [pendingCredentials, setPendingCredentials] = React.useState<LoginInput | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Handle error from URL params (e.g. ActiveSession from OAuth)
  React.useEffect(() => {
    if (errorParam === "ActiveSession") {
      setShowForceLogoutDialog(true);
    }
  }, [errorParam]);

  async function onSubmit(data: LoginInput) {
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error === "ActiveSession") {
      setPendingCredentials(data);
      // Get device info
      try {
        const checkResult = await authApi.checkActiveSession();
        setDeviceInfo(checkResult.deviceInfo ?? null);
      } catch {
        setDeviceInfo(null);
      }
      setShowForceLogoutDialog(true);
      return;
    }

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    if (result?.ok) {
      window.location.href = callbackUrl;
    }
  }

  async function handleForceLogout() {
    setShowForceLogoutDialog(false);
    setError(null);

    try {
      await authApi.forceLogout();
    } catch {
      // Ignore — the user might not have an active session token yet
    }

    if (pendingCredentials) {
      const result = await signIn("credentials", {
        email: pendingCredentials.email,
        password: pendingCredentials.password,
        forceLogout: "true",
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = callbackUrl;
      } else {
        setError("Login failed after force logout. Please try again.");
      }
    } else {
      await signIn("google", { callbackUrl });
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="glass-card rounded-3xl p-8 animate-fade-in-up shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4 shadow-lg animate-float">
          <span className="text-primary-foreground font-black text-2xl">F</span>
        </div>
        <h1 className="text-2xl font-heading font-black gradient-text mb-1">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your FINCY account
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <Alert
          variant="destructive"
          className="mb-4 glass-subtle border-destructive/30 animate-fade-in"
          id="login-error-alert"
        >
          <WarningTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Google OAuth */}
      <Button
        id="google-signin-btn"
        type="button"
        variant="outline"
        className="w-full h-11 glass-subtle border-border/60 hover:border-primary/40 hover:glow-sm transition-all duration-200 font-medium"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Spark className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <GoogleIcon className="h-4 w-4 mr-2" />
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-5">
        <Separator className="flex-1 bg-border/40" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1 bg-border/40" />
      </div>

      {/* Email/Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            className="h-11 glass-subtle border-border/60 focus:border-primary/60 focus:glow-sm transition-all"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive animate-fade-in">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-sm font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              id="forgot-password-link"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 glass-subtle border-border/60 focus:border-primary/60 focus:glow-sm transition-all pr-10"
              {...register("password")}
            />
            <button
              type="button"
              id="toggle-password-visibility"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive animate-fade-in">{errors.password.message}</p>
          )}
        </div>

        <Button
          id="login-submit-btn"
          type="submit"
          className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 hover:glow-sm transition-all duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spark className="h-4 w-4 animate-spin mr-2" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Sign in
            </>
          )}
        </Button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          id="register-link"
          className="text-primary font-medium hover:text-primary/80 transition-colors"
        >
          Create one for free
        </Link>
      </p>

      {/* Force logout dialog */}
      <Dialog open={showForceLogoutDialog} onOpenChange={setShowForceLogoutDialog}>
        <DialogContent className="glass-card border-0 max-w-sm" id="force-logout-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WarningTriangle className="h-5 w-5 text-amber-500" />
              Active Session Detected
            </DialogTitle>
            <DialogDescription className="text-left">
              Your account is currently logged in on another device.
              {deviceInfo && (
                <span className="block mt-2 text-xs text-muted-foreground glass-subtle rounded-lg p-2">
                  {deviceInfo}
                </span>
              )}
              <span className="block mt-2">
                Log out from that device to sign in here, or force logout to sign in on this device.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              id="cancel-force-logout"
              variant="outline"
              onClick={() => setShowForceLogoutDialog(false)}
              className="glass-subtle border-border/60"
            >
              Cancel
            </Button>
            <Button
              id="confirm-force-logout"
              variant="destructive"
              onClick={handleForceLogout}
            >
              Force Logout & Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-md h-[450px] rounded-2xl glass-card animate-pulse" />}>
      <LoginForm />
    </React.Suspense>
  );
}
