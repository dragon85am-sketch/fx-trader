import React from "react";

export function cn(...xs: Array<string | undefined | null | false | 0>) {
  return xs.filter(Boolean).join(" ");
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "outline";
  }
) {
  const { className, variant = "solid", type, ...rest } = props;

  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-sky-300/40 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "solid"
          ? "border border-sky-300/20 bg-gradient-to-br from-sky-300 via-sky-500 to-blue-700 text-white shadow-[0_0_28px_rgba(56,189,248,.28)] hover:brightness-110"
          : "border border-sky-300/20 bg-[#1A4F90] text-sky-100 hover:bg-[#123765]",
        className
      )}
      {...rest}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-sky-300/30 bg-[#1B4D8F]/90 backdrop-blur-2xl",
        "shadow-[0_20px_45px_rgba(0,0,0,.28),0_0_25px_rgba(56,189,248,.08),inset_0_1px_0_rgba(255,255,255,.08)]",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;

  return (
    <input
      className={cn(
        "w-full rounded-xl border border-sky-300/ bg-[#194B86] px-3 py-2 text-sm text-sky-50 placeholder:text-slate-400/70",
        "focus:outline-none focus:ring-2 focus:ring-sky-300/35 focus:border-sky-300/30",
        className
      )}
      {...rest}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-sky-100/80", className)}
      {...props}
    />
  );
}

export function Pill({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100 backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}