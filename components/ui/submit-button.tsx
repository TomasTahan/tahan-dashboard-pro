"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { type ComponentProps } from "react";

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  children: React.ReactNode;
  loadingText?: string;
}

/**
 * Botón de submit con loader automático para server actions
 *
 * Este componente debe usarse DENTRO de un <form> que llame a un server action.
 * Automáticamente muestra un loader y se deshabilita mientras el formulario se está enviando.
 *
 * @example
 * ```tsx
 * <form action={myServerAction}>
 *   <Input name="field" />
 *   <SubmitButton>Guardar</SubmitButton>
 * </form>
 * ```
 */
export function SubmitButton({
  children,
  loadingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
