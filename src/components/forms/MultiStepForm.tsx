import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
    id: string;
    title: string;
    description?: string;
}

interface MultiStepFormProps {
    steps: Step[];
    currentStep: number;
    onStepChange: (step: number) => void;
    children: React.ReactNode;
    onSubmit?: () => void;
    canGoNext?: boolean;
    canGoPrevious?: boolean;
    isSubmitting?: boolean;
}

export function MultiStepForm({
    steps,
    currentStep,
    onStepChange,
    children,
    onSubmit,
    canGoNext = true,
    canGoPrevious = true,
    isSubmitting = false,
}: MultiStepFormProps) {
    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1 && canGoNext) {
            onStepChange(currentStep + 1);
        } else if (currentStep === steps.length - 1 && onSubmit) {
            onSubmit();
        }
    }, [currentStep, steps.length, canGoNext, onStepChange, onSubmit]);

    const handlePrevious = useCallback(() => {
        if (currentStep > 0 && canGoPrevious) {
            onStepChange(currentStep - 1);
        }
    }, [currentStep, canGoPrevious, onStepChange]);

    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="space-y-6">
            {/* Progress Steps */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <button
                                        onClick={() => onStepChange(index)}
                                        disabled={index > currentStep}
                                        className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                                            index < currentStep && "bg-primary border-primary text-primary-foreground",
                                            index === currentStep && "border-primary text-primary",
                                            index > currentStep && "border-muted text-muted-foreground",
                                            index <= currentStep && "cursor-pointer hover:scale-110"
                                        )}
                                    >
                                        {index < currentStep ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                        ) : (
                                            <Circle className={cn("h-5 w-5", index === currentStep && "fill-current")} />
                                        )}
                                    </button>
                                    <div className="mt-2 text-center">
                                        <p className={cn(
                                            "text-sm font-medium",
                                            index === currentStep && "text-primary",
                                            index < currentStep && "text-foreground",
                                            index > currentStep && "text-muted-foreground"
                                        )}>
                                            {step.title}
                                        </p>
                                        {step.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {step.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "h-0.5 flex-1 mx-2 transition-all",
                                        index < currentStep ? "bg-primary" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Form Content */}
            <div>{children}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || !canGoPrevious || isSubmitting}
                >
                    Sebelumnya
                </Button>
                <Button
                    type="button"
                    onClick={handleNext}
                    disabled={(!canGoNext && !isLastStep) || isSubmitting}
                >
                    {isSubmitting ? "Memproses..." : isLastStep ? "Kirim" : "Selanjutnya"}
                </Button>
            </div>
        </div>
    );
}
