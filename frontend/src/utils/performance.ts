/**
 * Performance monitoring utilities
 */

// Define metrics to track
interface PerformanceMetrics {
  navigationStart?: number;
  loadComplete?: number;
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  largestContentfulPaint?: number;
  apiCallMetrics: Map<string, {
    total: number;
    count: number;
    min: number;
    max: number;
  }>;
}

// Store metrics
const metrics: PerformanceMetrics = {
  apiCallMetrics: new Map()
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = (): void => {
  // Only run in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_ENABLE_MONITORING !== 'true') {
    return;
  }

  try {
    // Record navigation start time
    metrics.navigationStart = performance.now();

    // Listen for page load complete
    window.addEventListener('load', () => {
      metrics.loadComplete = performance.now();
      
      // Report initial page load metrics
      if (metrics.navigationStart) {
        const loadTime = metrics.loadComplete! - metrics.navigationStart;
        console.log(`📊 Page load complete: ${Math.round(loadTime)}ms`);
      }
    });

    // Use Performance Observer for paint metrics if available
    if ('PerformanceObserver' in window) {
      try {
        // Observe First Contentful Paint
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const fcp = entries[0];
            metrics.firstContentfulPaint = fcp.startTime;
            console.log(`📊 First Contentful Paint: ${Math.round(fcp.startTime)}ms`);
          }
          fcpObserver.disconnect();
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        
        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const lcp = entries[entries.length - 1];
            metrics.largestContentfulPaint = lcp.startTime;
            console.log(`📊 Largest Contentful Paint: ${Math.round(lcp.startTime)}ms`);
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (err) {
        console.error('Error setting up PerformanceObserver:', err);
      }
    }
  } catch (error) {
    // Don't let monitoring errors affect the app
    console.error('Performance monitoring initialization error:', error);
  }
};

/**
 * Track API call performance
 * @param url The API endpoint URL
 * @param startTime Performance.now() value when call started
 */
export const trackApiCall = (url: string, startTime: number): void => {
  // Only run in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_ENABLE_MONITORING !== 'true') {
    return;
  }

  try {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Extract endpoint path for grouping (remove query params)
    const urlObj = new URL(url, window.location.origin);
    const endpoint = urlObj.pathname;
    
    // Get or create metrics for this endpoint
    const existingMetrics = metrics.apiCallMetrics.get(endpoint) || {
      total: 0,
      count: 0,
      min: Number.MAX_VALUE,
      max: 0
    };
    
    // Update metrics
    existingMetrics.total += duration;
    existingMetrics.count += 1;
    existingMetrics.min = Math.min(existingMetrics.min, duration);
    existingMetrics.max = Math.max(existingMetrics.max, duration);
    
    // Save updated metrics
    metrics.apiCallMetrics.set(endpoint, existingMetrics);
    
    // If this took over 1 second, log it as potentially problematic
    if (duration > 1000) {
      console.warn(`⚠️ Slow API call to ${endpoint}: ${Math.round(duration)}ms`);
    }
  } catch (error) {
    // Don't let monitoring errors affect the app
    console.error('API performance tracking error:', error);
  }
};

/**
 * Get performance report data
 */
export const getPerformanceReport = (): object => {
  // Process API metrics into a more readable format
  const apiMetrics: Record<string, { avg: number, calls: number, min: number, max: number }> = {};
  
  metrics.apiCallMetrics.forEach((data, endpoint) => {
    apiMetrics[endpoint] = {
      avg: Math.round(data.total / data.count),
      calls: data.count,
      min: Math.round(data.min),
      max: Math.round(data.max)
    };
  });
  
  return {
    pageLoad: metrics.loadComplete && metrics.navigationStart 
      ? Math.round(metrics.loadComplete - metrics.navigationStart)
      : null,
    firstContentfulPaint: metrics.firstContentfulPaint 
      ? Math.round(metrics.firstContentfulPaint)
      : null,
    largestContentfulPaint: metrics.largestContentfulPaint
      ? Math.round(metrics.largestContentfulPaint)
      : null,
    apiCalls: apiMetrics
  };
};