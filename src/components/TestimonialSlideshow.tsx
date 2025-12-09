import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface TestimonialItem {
  id: string | number;
  raterName: string;
  raterAvatar?: string;
  text: string;
}

interface TestimonialSlideshowProps {
  testimonials: TestimonialItem[];
  autoPlay?: boolean;
  interval?: number;
  variant?: "yellow" | "emerald";
}

export function TestimonialSlideshow({
  testimonials,
  autoPlay = true,
  interval = 5000,
  variant = "yellow"
}: TestimonialSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length, isPaused]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (!testimonials.length) return null;

  const currentTestimonial = testimonials[currentIndex];
  const colorClasses = variant === "yellow" 
    ? "text-yellow-600 dark:text-yellow-400" 
    : "text-emerald-600 dark:text-emerald-400";
  const dotActiveClass = variant === "yellow" 
    ? "bg-yellow-500" 
    : "bg-emerald-500";

  return (
    <div 
      className="mt-3 pt-3 border-t"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Quote className="h-3 w-3" /> Kata Rekan Kerja
        </p>
        {testimonials.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {currentIndex + 1}/{testimonials.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden min-h-[60px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-2"
          >
            {/* Rater Info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 border">
                <AvatarImage
                  src={currentTestimonial.raterAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentTestimonial.raterName}`}
                  alt={currentTestimonial.raterName}
                />
                <AvatarFallback className="text-[8px]">
                  {getInitials(currentTestimonial.raterName)}
                </AvatarFallback>
              </Avatar>
              <span className={`text-[10px] font-medium ${colorClasses}`}>
                {currentTestimonial.raterName}
              </span>
            </div>
            
            {/* Testimonial Text */}
            <p className="text-xs italic line-clamp-3">"{currentTestimonial.text}"</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? `${dotActiveClass} scale-125`
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}