export interface RateLimitEventPayload {
  retryAfter: number;
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}

const EVENT_NAME = "ai-rate-limit";

export const triggerRateLimit = (retryAfter: number, message: string, onRetry: () => void, onCancel: () => void) => {
  if (typeof window !== "undefined") {
    const event = new CustomEvent<RateLimitEventPayload>(EVENT_NAME, {
      detail: { retryAfter, message, onRetry, onCancel }
    });
    window.dispatchEvent(event);
  }
};

export const subscribeToRateLimit = (callback: (payload: RateLimitEventPayload) => void) => {
  if (typeof window !== "undefined") {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<RateLimitEventPayload>;
      callback(customEvent.detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }
  return () => {};
};
