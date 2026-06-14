"use client";

import { useState, useTransition } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function PhotoUploader({ operatorId }: { operatorId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOk(false);

    const file = new FormData(event.currentTarget).get("photo");
    if (!(file instanceof File) || file.size === 0) {
      setError("Selecione uma foto.");
      return;
    }

    startTransition(async () => {
      const signedResponse = await fetch("/api/storage/operator-photo-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size
        })
      });
      const signedPayload = await signedResponse.json();

      if (!signedResponse.ok) {
        setError(signedPayload.error || "Nao foi possivel preparar o upload.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from("operator-photos")
        .uploadToSignedUrl(signedPayload.path, signedPayload.token, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        setError("Falha ao enviar a foto para o Storage.");
        return;
      }

      await fetch(`/api/operators/${operatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoPath: signedPayload.path })
      });

      setOk(true);
      event.currentTarget.reset();
    });
  }

  return (
    <form className="grid gap-2" onSubmit={onSubmit}>
      {error ? <ErrorState message={error} /> : null}
      {ok ? <p className="text-sm font-medium text-emerald-700">Foto atualizada.</p> : null}
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <input accept="image/jpeg,image/png,image/webp" name="photo" type="file" />
        <Button disabled={isPending} type="submit" variant="secondary">
          <ImageUp className="size-4" aria-hidden="true" />
          {isPending ? "Enviando" : "Foto"}
        </Button>
      </label>
    </form>
  );
}
