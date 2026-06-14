import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Ranking AM
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Acesso seguro</h1>
          <p className="mt-2 text-sm text-slate-600">
            Entre com sua conta Supabase Auth para acessar os dados de SS.
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
