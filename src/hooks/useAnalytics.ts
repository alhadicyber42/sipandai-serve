/**
 * Analytics Hook
 * Centralized analytics tracking untuk aplikasi
 * Siap untuk integrasi dengan Google Analytics, Mixpanel, dll
 */

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

interface PageView {
  path: string;
  title?: string;
}

class Analytics {
  private isEnabled: boolean;
  private userId?: string;

  constructor() {
    // Enable analytics hanya di production atau jika environment variable di-set
    this.isEnabled = 
      process.env.NODE_ENV === 'production' || 
      import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  trackEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event);
    }

    // TODO: Integrate with analytics service
    // Example: Google Analytics
    // if (window.gtag) {
    //   window.gtag('event', event.action, {
    //     event_category: event.category,
    //     event_label: event.label,
    //     value: event.value,
    //   });
    // }

    // Example: Mixpanel
    // if (window.mixpanel) {
    //   window.mixpanel.track(event.action, {
    //     category: event.category,
    //     label: event.label,
    //     value: event.value,
    //     userId: this.userId,
    //   });
    // }
  }

  trackPageView(pageView: PageView) {
    if (!this.isEnabled) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics PageView]', pageView);
    }

    // TODO: Integrate with analytics service
    // Example: Google Analytics
    // if (window.gtag) {
    //   window.gtag('config', 'GA_MEASUREMENT_ID', {
    //     page_path: pageView.path,
    //     page_title: pageView.title,
    //   });
    // }
  }

  trackError(error: Error, errorInfo?: any) {
    if (!this.isEnabled) return;

    this.trackEvent({
      action: 'error',
      category: 'exception',
      label: error.message,
    });

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       errorInfo,
    //     },
    //   });
    // }
  }

  trackPerformance(metric: { name: string; value: number; unit?: string }) {
    if (!this.isEnabled) return;

    this.trackEvent({
      action: 'performance',
      category: 'web-vitals',
      label: metric.name,
      value: metric.value,
    });
  }
}

// Singleton instance
const analytics = new Analytics();

/**
 * Hook untuk menggunakan analytics
 */
export function useAnalytics() {
  return analytics;
}

/**
 * Track custom event
 */
export function trackEvent(event: AnalyticsEvent) {
  analytics.trackEvent(event);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  analytics.trackPageView({ path, title });
}

/**
 * Track error
 */
export function trackError(error: Error, errorInfo?: any) {
  analytics.trackError(error, errorInfo);
}

