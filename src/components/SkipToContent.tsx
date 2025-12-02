/**
 * Skip to Content Link
 * Accessibility feature untuk keyboard navigation
 * Memungkinkan user untuk skip navigation dan langsung ke konten utama
 */
import { useEffect, useState } from 'react';

export function SkipToContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show skip link when user presses Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleClick = () => {
      setIsVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [isVisible]);

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.querySelector('main') || document.querySelector('#main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

