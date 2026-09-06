"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Mail, CheckCircle, Spark } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send reset link. Please try again.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      // For security, even if failed or user not found, we can show generic message or notice
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border-border/40 shadow-2xl shadow-primary/5">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2 shadow-inner">
          <Spark className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Reset Password
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Enter your registered email and we'll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="w-10 h-10 text-primary mx-auto" />
            <h3 className="font-semibold text-foreground">Reset Link Sent</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an account with that email exists, we've dispatched a password reset link to your inbox. Please check your spam folder too.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 bg-background/50 border-input/60 focus:bg-background/80 transition-all rounded-xl"
                  {...register("email")}
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spark className="w-4 h-4 mr-2 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/20 pt-4 pb-6">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
