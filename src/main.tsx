// --- Anti-Telemetry / Analytics Blocker ---
// Blocks and mocks outgoing telemetry, tracking, and logging requests to keep connections stable and private.
(function blockTelemetry() {
  const telemetryKeywords = [
    'telemetry', 'analytics', 'mixpanel', 'amplitude', 'sentry', 
    'doubleclick', 'google-analytics', 'statcounter', 'bugsnag', 
    'log-delivery', 'browser-telemetry', 'tracking', 'metrics'
  ];

  const isTelemetryUrl = (url: string | URL | undefined | null) => {
    if (!url) return false;
    const lowerUrl = url.toString().toLowerCase();
    return telemetryKeywords.some(keyword => lowerUrl.includes(keyword));
  };

  // 1. Patch window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
    if (isTelemetryUrl(url)) {
      console.warn(`[Anti-Telemetry] Safely intercepted and blocked outgoing telemetry request to: ${url}`);
      return new Response(JSON.stringify({ status: 'ok', blocked: true, message: 'Telemetry disabled for performance and privacy.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return originalFetch.apply(this, arguments as any);
  };

  // 2. Patch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    (this as any)._isTelemetry = isTelemetryUrl(typeof url === 'string' ? url : (url as any).toString());
    if ((this as any)._isTelemetry) {
      console.warn(`[Anti-Telemetry] Safely intercepted and blocked outgoing XHR request to: ${url}`);
    }
    return originalOpen.apply(this, arguments as any);
  } as any;

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body) {
    if ((this as any)._isTelemetry) {
      // Mock successful load instantly without hitting the network
      const xhr = this;
      setTimeout(() => {
        Object.defineProperty(xhr, 'readyState', { value: 4, writable: true });
        Object.defineProperty(xhr, 'status', { value: 200, writable: true });
        Object.defineProperty(xhr, 'responseText', { value: '{"status":"ok","blocked":true}', writable: true });
        if (xhr.onload) xhr.onload({} as any);
        if (xhr.onreadystatechange) xhr.onreadystatechange({} as any);
      }, 5);
      return;
    }
    return originalSend.apply(this, arguments as any);
  };

  // 3. Patch navigator.sendBeacon
  if (navigator.sendBeacon) {
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
      if (isTelemetryUrl(url)) {
        console.warn(`[Anti-Telemetry] Safely blocked outgoing Beacon tracking request to: ${url}`);
        return true; // Simulate success
      }
      return originalSendBeacon.apply(this, arguments as any);
    };
  }

  console.log('🛡️ [Anti-Telemetry] Globally initialized. All tracking, analytics, and telemetry requests are blocked and safely mocked.');
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
