import { Button as HeroButton } from "@heroui/react";
import type { ComponentProps } from "react";

/**
 * Thin pass-through over HeroUI v3 Button so the app imports one Button.
 * HeroUI already supplies the pressed-scale transform, focus ring, and pending
 * state; globals.css maps its variant colors onto the Linear palette. We only
 * narrow the prop type and keep `@/components/ui/Button` as the single import.
 */
export type ButtonProps = ComponentProps<typeof HeroButton>;

export function Button(props: ButtonProps) {
  return <HeroButton {...props} />;
}
