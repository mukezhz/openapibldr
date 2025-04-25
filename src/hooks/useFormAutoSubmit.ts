import { useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

export function useFormAutoSubmit<T extends FieldValues>(
  form: UseFormReturn<T>,
  handleSubmit: (data: T) => void,
  delay: number = 300
) {
  useEffect(() => {
    const debounce = (func: Function, delay: number) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };

    const debouncedSubmit = debounce((data: T) => {
      handleSubmit(data);
    }, delay);

    const subscription = form.watch((data) => {
      debouncedSubmit(data as T);
    });

    return () => subscription.unsubscribe();
  }, [form, handleSubmit, delay]);
}
