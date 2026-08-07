import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

/**
 * Reusable validated-field wrapper: label, control, inline error message.
 * Invalid controls are highlighted through the `[&_input]` / `[&_textarea]` rules.
 */
export function FormField({
  label,
  error,
  required,
  hint,
  className,
  children,
}: {
  label?: ReactNode;
  error?: string | undefined;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const invalid = Boolean(error);
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className={cn("text-sm", invalid && "text-destructive")}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      <div
        aria-invalid={invalid || undefined}
        className={cn(
          invalid &&
            "[&_input]:border-destructive [&_input]:focus-visible:ring-destructive/30 [&_textarea]:border-destructive [&_select]:border-destructive",
        )}
      >
        {children}
      </div>
      {invalid ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
