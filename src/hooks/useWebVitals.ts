/**
 * Web Vitals Hook
 * Track Core Web Vitals untuk performance monitoring
 * Metrics: LCP, FID, CLS, FCP, TTFB
 * 
 * Note: Untuk implementasi lengkap, install web-vitals package:
 * npm install web-vitals
 */

import { useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

export function useWebVitals() {
  const analytics = useAnalytics();

  useEffect(() => {
    // Only track in production
    if (process.env.NODE_ENV !== 'production') return;

    // Basic performance tracking using Performance API
    const trackBasicMetrics = () => {
      if (typeof window === 'undefined' || !window.performance) return;

      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // Time to First Byte (TTFB)
          const ttfb = navigation.responseStart - navigation.requestStart;
          if (ttfb > 0) {
            analytics.trackPerformance({
              name: 'TTFB',
              value: Math.round(ttfb),
              unit: 'ms',
            });
          }

          // First Contentful Paint (FCP) - approximate
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            analytics.trackPerformance({
              name: 'FCP',
              value: Math.round(fcp.startTime),
              unit: 'ms',
            });
          }
        }

        // Track page load time
        window.addEventListener('load', () => {
          const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
          if (loadTime > 0) {
            analytics.trackPerformance({
              name: 'PageLoad',
              value: Math.round(loadTime),
              unit: 'ms',
            });
          }
        });
      } catch (error) {
        console.warn('Failed to track performance metrics:', error);
      }
    };

    // Try to load web-vitals library if available (optional)
    const loadWebVitals = async () => {
      try {
        // Dynamic import - will only work if web-vitals is installed
        const webVitals = await import('web-vitals');
        
        webVitals.onLCP((metric) => {
          analytics.trackPerformance({
            name: 'LCP',
            value: Math.round(metric.value),
            unit: 'ms',
          });
        });

        webVitals.onCLS((metric) => {
          analytics.trackPerformance({
            name: 'CLS',
            value: metric.value,
          });
        });

        webVitals.onFCP((metric) => {
          analytics.trackPerformance({
            name: 'FCP',
            value: Math.round(metric.value),
            unit: 'ms',
          });
        });

        webVitals.onTTFB((metric) => {
          analytics.trackPerformance({
            name: 'TTFB',
            value: Math.round(metric.value),
            unit: 'ms',
          });
        });

        // INP (Interaction to Next Paint) - newer metric
        if (webVitals.onINP) {
          webVitals.onINP((metric) => {
            analytics.trackPerformance({
              name: 'INP',
              value: Math.round(metric.value),
              unit: 'ms',
            });
          });
        }
      } catch (error) {
        // web-vitals not installed, fallback to basic metrics
        trackBasicMetrics();
      }
    };

    loadWebVitals();
  }, [analytics]);
}

