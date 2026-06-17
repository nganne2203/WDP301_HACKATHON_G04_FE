"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import type { ComponentProps } from "react";

const Toaster = ({ ...props }: ComponentProps<typeof Sonner>) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:border-l-4",
          title: "group-[.toast]:!text-foreground font-semibold",
          description: "group-[.toast]:!text-black dark:group-[.toast]:!text-white",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-background group-[.toast]:text-foreground hover:group-[.toast]:bg-muted",
          success: "group-[.toast]:border-l-emerald-500",
          info: "group-[.toast]:border-l-sky-500",
          warning: "group-[.toast]:border-l-amber-500",
          error: "group-[.toast]:border-l-rose-500",
          loading: "group-[.toast]:border-l-primary",
          default: "group-[.toast]:border-l-primary/50",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
