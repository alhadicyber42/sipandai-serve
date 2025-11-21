import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholderSrc?: string;
    className?: string;
}

export function LazyImage({
    src,
    alt,
    placeholderSrc,
    className,
    ...props
}: LazyImageProps) {
    const [imageSrc, setImageSrc] = useState(placeholderSrc || "");
    const [isLoading, setIsLoading] = useState(true);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: "50px", // Start loading 50px before image enters viewport
            }
        );

        observer.observe(imgRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isInView) return;

        const img = new Image();
        img.src = src;

        img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
        };

        img.onerror = () => {
            setIsLoading(false);
        };
    }, [isInView, src]);

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={cn(
                "transition-opacity duration-300",
                isLoading ? "opacity-50 blur-sm" : "opacity-100",
                className
            )}
            {...props}
        />
    );
}
