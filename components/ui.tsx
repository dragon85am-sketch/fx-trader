import React from "react";

export function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid"|"outline" }) {
  const { className, variant="solid", ...rest } = props;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed",
        variant === "solid"
          ? "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
          : "border border-zinc-700 text-zinc-100 hover:bg-zinc-900",
        className
      )}
      {...rest}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600",
        "focus:outline-none focus:ring-2 focus:ring-zinc-700",
        className
      )}
      {...rest}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm text-zinc-300", className)} {...props} />;
}

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300", className)} {...props} />;
}
