import React from "react";

export function cn(...xs: Array<string | undefined | false>) {
  return xs.filter(Boolean).join(" ");
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" }
) {
  const { className, variant = "solid", ...rest } = props;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-blue-400/30 disabled:opacity-60 disabled:cursor-not-allowed",
        variant === "solid"
          ? "bg-white text-slate-950 hover:bg-slate-100"
          : "border border-white/15 text-slate-100 hover:bg-blue-950/30",
        className
      )}
      {...rest}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-blue-950/30 backdrop-blur-xl shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;

  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-blue-950/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400/60",
        "focus:outline-none focus:ring-2 focus:ring-blue-400/30",
        className
      )}
      {...rest}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm text-slate-200/80", className)} {...props} />;
}

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/10 bg-blue-950/30 px-3 py-1 text-xs text-slate-200/80 backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}
