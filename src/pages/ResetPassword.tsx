import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovery links create a session via the URL hash.
    // Wait for an auth state, then allow the user to set a new password.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated. Signing you in…");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-6">
          <span className="font-display text-3xl font-semibold text-primary">Canterra</span>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Reset password</p>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              {ready
                ? "You're signed in via your reset link. Enter a new password below to finish — if you leave this page without saving, the link will expire and you'll need to request a new one."
                : "Validating your reset link…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!ready}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!ready || submitting}>
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link to="/auth" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
