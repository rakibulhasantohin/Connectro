import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';
import { cn } from '../lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  placeholderClassName?: string;
  fallbackIcon?: React.ReactNode;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName,
  placeholderClassName,
  fallbackIcon,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  // Separate motion props from standard img props to avoid conflict
  const { 
    initial, animate, transition, exit,
    style, // motion style can be different
    ...imgProps 
  } = props as any;

  return (
    <div className={cn("relative overflow-hidden", containerClassName || className)}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("absolute inset-0 bg-zinc-100 animate-pulse", placeholderClassName)}
          />
        )}
      </AnimatePresence>

      {error ? (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-zinc-100", placeholderClassName)}>
          {fallbackIcon || <User className="w-5 h-5 text-zinc-400" />}
        </div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className={cn("w-full h-full object-cover", className)}
          loading="lazy"
          referrerPolicy="no-referrer"
          {...imgProps}
        />
      )}
    </div>
  );
};
