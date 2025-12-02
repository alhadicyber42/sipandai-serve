import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Quote, Star, ArrowLeft, ArrowRight } from 'lucide-react';

export interface Testimonial {
    id: string | number;
    name: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
    text: string;
    results?: string[];
}

interface TestimonialCarouselProps {
    testimonials: Testimonial[];
    autoPlay?: boolean;
    interval?: number;
}

export function TestimonialCarousel({
    testimonials,
    autoPlay = true,
    interval = 6000
}: TestimonialCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!autoPlay || testimonials.length <= 1) return;

        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoPlay, interval, testimonials.length]);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction > 0 ? 45 : -45
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction < 0 ? 45 : -45
        })
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

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <div className="relative h-[550px] sm:h-[400px] perspective-1000">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.4 },
                            scale: { duration: 0.4 },
                            rotateY: { duration: 0.6 }
                        }}
                        className="absolute inset-0"
                    >
                        <div className="relative h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-4 sm:p-8 overflow-hidden group shadow-2xl dark:from-black/40 dark:to-black/20 dark:border-white/10">
                            {/* Animated background gradient */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-rose-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-rose-500/20 rounded-3xl"
                                animate={{
                                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                                }}
                                transition={{
                                    duration: 15,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                style={{
                                    backgroundSize: '300% 300%'
                                }}
                            />

                            {/* Quote icon */}
                            <motion.div
                                className="absolute top-6 right-6 opacity-20"
                                animate={{ rotate: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Quote className="w-12 h-12 text-foreground" />
                            </motion.div>

                            <div className="relative z-10 h-full flex flex-col md:flex-row items-center gap-6">
                                {/* User Info */}
                                <div className="flex-shrink-0 text-center md:text-left w-full md:w-auto flex flex-col items-center md:items-start">
                                    <motion.div
                                        className="relative mb-4"
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 relative shadow-lg">
                                            <img
                                                src={testimonials[currentIndex].avatar}
                                                alt={testimonials[currentIndex].name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Floating ring animation */}
                                        <motion.div
                                            className="absolute inset-0 border-2 border-indigo-400/30 rounded-full"
                                            animate={{
                                                scale: [1, 1.4, 1],
                                                opacity: [0.5, 0, 0.5]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    </motion.div>

                                    <h3 className="text-lg font-bold text-foreground mb-1">
                                        {testimonials[currentIndex].name}
                                    </h3>
                                    <p className="text-indigo-500 dark:text-indigo-400 text-sm font-medium">
                                        {testimonials[currentIndex].role}
                                    </p>
                                    <p className="text-muted-foreground text-xs mb-3">
                                        {testimonials[currentIndex].company}
                                    </p>

                                    {/* Star Rating */}
                                    <div className="flex justify-center md:justify-start gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1, duration: 0.3 }}
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${i < testimonials[currentIndex].rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col justify-center h-full overflow-y-auto pr-2 custom-scrollbar">
                                    <motion.blockquote
                                        className="text-lg md:text-xl text-foreground/90 leading-relaxed mb-6 font-light italic text-center md:text-left"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                    >
                                        "{testimonials[currentIndex].text}"
                                    </motion.blockquote>

                                    {/* Results */}
                                    {testimonials[currentIndex].results && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                            {testimonials[currentIndex].results.map((result, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="bg-white/10 dark:bg-black/20 rounded-lg p-2 border border-white/10 backdrop-blur-sm text-center md:text-left"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                                                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                                >
                                                    <span className="text-xs text-foreground/70 font-medium">
                                                        {result}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center items-center gap-4 mt-6">
                <motion.button
                    onClick={prevTestimonial}
                    className="p-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-foreground hover:bg-white/20 transition-all shadow-sm"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                </motion.button>

                {/* Dots Indicator */}
                <div className="flex gap-2">
                    {testimonials.map((_, index) => (
                        <motion.button
                            key={index}
                            onClick={() => {
                                setDirection(index > currentIndex ? 1 : -1);
                                setCurrentIndex(index);
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-indigo-500 scale-125'
                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                }`}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                        />
                    ))}
                </div>

                <motion.button
                    onClick={nextTestimonial}
                    className="p-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-foreground hover:bg-white/20 transition-all shadow-sm"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowRight className="w-4 h-4" />
                </motion.button>
            </div>
        </div>
    );
}
