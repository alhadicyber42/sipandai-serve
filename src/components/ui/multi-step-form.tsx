import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

const multiStepFormVariants = cva(
    "flex flex-col",
    {
        variants: {
            size: {
                default: "md:w-[700px]",
                sm: "md:w-[550px]",
                lg: "md:w-[850px]",
            },
        },
        defaultVariants: {
            size: "default",
        },
    }
);

interface MultiStepFormProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof multiStepFormVariants> {
    currentStep: number;
    totalSteps: number;
    title: string;
    description: string;
    onBack: () => void;
    onNext: () => void;
    onClose?: () => void;
    backButtonText?: string;
    nextButtonText?: string;
    footerContent?: React.ReactNode;
    isLoading?: boolean;
}

const MultiStepForm = React.forwardRef<HTMLDivElement, MultiStepFormProps>(
    ({
        className,
        size,
        currentStep,
        totalSteps,
        title,
        description,
        onBack,
        onNext,
        onClose,
        backButtonText = "Kembali",
        nextButtonText = "Lanjut",
        footerContent,
        isLoading = false,
        children,
        ...props
    }, ref) => {
        const progress = Math.round((currentStep / totalSteps) * 100);

        const variants = {
            hidden: { opacity: 0, x: 100 },
            enter: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -100 },
        };

        return (
            <Card ref={ref} className={cn(multiStepFormVariants({ size }), "border-2 border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl", className)} {...props}>
                <CardHeader className="pb-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-base">{description}</CardDescription>
                        </div>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                        <Progress value={progress} className="w-full h-2" />
                        <p className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                            {currentStep}/{totalSteps}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="min-h-[400px] overflow-hidden px-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            variants={variants}
                            initial="hidden"
                            animate="enter"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>

                <CardFooter className="flex justify-between px-6 pb-6">
                    <div>{footerContent}</div>
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={onBack}
                                disabled={isLoading}
                                className="border-2"
                            >
                                {backButtonText}
                            </Button>
                        )}
                        <Button
                            onClick={onNext}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 font-bold"
                        >
                            {nextButtonText}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        );
    }
);

MultiStepForm.displayName = "MultiStepForm";

export { MultiStepForm };
