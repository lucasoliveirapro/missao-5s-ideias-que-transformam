"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError("Email ou senha invalidos.");
        return;
      }

      router.replace(searchParams.get("redirectedFrom") || "/ranking/top3");
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      {error ? <ErrorState message={error} /> : null}
      <Field label="Email">
        <Input autoComplete="email" name="email" required type="email" />
      </Field>
      <Field label="Senha">
        <Input autoComplete="current-password" name="password" required type="password" />
      </Field>
      <Button disabled={isPending} type="submit">
        <KeyRound className="size-4" aria-hidden="true" />
        {isPending ? "Entrando" : "Entrar"}
      </Button>
    </form>
  );
}
