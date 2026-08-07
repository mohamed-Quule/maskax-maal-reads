import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";
import { toFieldErrors, type FieldErrors } from "@/lib/validation";

/**
 * Real-time form validation: errors surface once a field is touched (blur)
 * or after a submit attempt, and clear as soon as the value becomes valid.
 */
export function useFormValidation<S extends z.ZodTypeAny>(schema: S, values: unknown) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => schema.safeParse(values), [schema, values]);
  const allErrors = useMemo(() => toFieldErrors(result) as FieldErrors<Record<string, unknown>>, [result]);

  const errors = useMemo(() => {
    if (submitted) return allErrors;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(allErrors)) if (touched[k] && v) out[k] = v as string;
    return out as FieldErrors<Record<string, unknown>>;
  }, [allErrors, touched, submitted]);

  const touch = useCallback((name: string) => setTouched((t) => ({ ...t, [name]: true })), []);
  const blurProps = useCallback((name: string) => ({ onBlur: () => touch(name), name }), [touch]);

  const reset = useCallback(() => {
    setTouched({});
    setSubmitted(false);
  }, []);

  /** Marks everything as submitted; returns parsed data when valid, else null. */
  const validateAll = useCallback(() => {
    setSubmitted(true);
    const r = schema.safeParse(values);
    return r.success ? (r.data as z.infer<S>) : null;
  }, [schema, values]);

  return {
    errors,
    allErrors,
    isValid: result.success,
    data: result.success ? (result.data as z.infer<S>) : null,
    touch,
    blurProps,
    validateAll,
    reset,
    submitted,
  };
}
