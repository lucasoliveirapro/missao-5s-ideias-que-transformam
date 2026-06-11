import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonProps["variant"];
};

const variants = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  secondary: "bg-slate-900 text-white hover:bg-slate-800",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
};

const baseClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClass} ${variants[variant]} ${className}`}
      type={props.type ?? "button"}
      {...props}
    />
  );
}

export function ButtonLink({
  className = "",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={`${baseClass} ${variants[variant]} ${className}`} {...props} />
  );
}
