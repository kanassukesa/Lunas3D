import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-display text-[15px] font-semibold tracking-wide transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        // sombra sólida embaixo = efeito "botão 3D", como as letras infladas da logo
        default: "bg-primary text-primary-foreground shadow-[0_3px_0_0_var(--primary-shadow)] hover:bg-primary-hover active:shadow-[0_1px_0_0_var(--primary-shadow)]",
        accent: "bg-accent text-accent-foreground shadow-[0_3px_0_0_var(--accent-shadow)] hover:bg-accent-hover active:shadow-[0_1px_0_0_var(--accent-shadow)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline: "border-2 border-input bg-background hover:border-brand-blue hover:bg-secondary",
        ghost: "hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        whatsapp: "bg-[#25D366] text-[#0b2e17] shadow-[0_3px_0_0_#159447] hover:bg-[#1fbd5a] active:shadow-[0_1px_0_0_#159447]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
