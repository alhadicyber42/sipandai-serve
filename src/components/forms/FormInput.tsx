import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    formatter?: (value: string) => string;
    validator?: (value: string) => boolean;
    onValidChange?: (isValid: boolean) => void;
}

export function FormInput({
    label,
    error,
    hint,
    required,
    formatter,
    validator,
    onValidChange,
    className,
    onChange,
    value,
    ...props
}: FormInputProps) {
    const [internalValue, setInternalValue] = useState(value?.toString() || "");
    const [touched, setTouched] = useState(false);
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value.toString());
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        // Apply formatter if provided
        if (formatter) {
            newValue = formatter(newValue);
        }

        setInternalValue(newValue);

        // Validate if validator provided
        if (validator) {
            const valid = validator(newValue);
            setIsValid(valid);
            onValidChange?.(valid);
        }

        // Call original onChange
        if (onChange) {
            const syntheticEvent = {
                ...e,
                target: { ...e.target, value: newValue },
            };
            onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const handleBlur = () => {
        setTouched(true);
    };

    const showError = touched && (error || (validator && !isValid));

    return (
        <div className="space-y-2">
            {label && (
                <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
                    {label}
                </Label>
            )}
            <Input
                value={internalValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                    showError && "border-destructive focus-visible:ring-destructive",
                    className
                )}
                {...props}
            />
            {hint && !showError && (
                <p className="text-sm text-muted-foreground">{hint}</p>
            )}
            {showError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="text-base">⚠</span>
                    {error || "Input tidak valid"}
                </p>
            )}
        </div>
    );
}
