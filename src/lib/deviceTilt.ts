/**
 * Device-orientation tilt for touch devices.
 *
 * On a phone there is no cursor to lean the glass toward, so the phone itself
 * becomes the input: tilting the handset tilts every pane. Orientation is a
 * property of the device, not of any one element, so a single listener feeds
 * all subscribers rather than each pane attaching its own.
 *
 * iOS 13+ requires an explicit permission grant that must originate from a user
 * gesture, so the request is deferred to the visitor's first touch.
 */

type TiltListener = (x: number, y: number) => void;

/** Degrees of physical tilt that map to full deflection. */
const RANGE_DEG = 32;
/**
 * Neutral pitch. People hold a phone tilted back toward their face rather than
 * flat, so 40° of `beta` — not 0 — is the natural resting position.
 */
const NEUTRAL_BETA = 40;

const listeners = new Set<TiltListener>();
let listening = false;
let gestureHookAttached = false;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function handleOrientation(event: DeviceOrientationEvent) {
  // gamma: left/right tilt in degrees. beta: front/back tilt in degrees.
  const gamma = event.gamma ?? 0;
  const beta = event.beta ?? NEUTRAL_BETA;

  const x = clamp(gamma / RANGE_DEG);
  const y = clamp((beta - NEUTRAL_BETA) / RANGE_DEG);

  for (const listener of listeners) listener(x, y);
}

function attach() {
  if (listening) return;
  listening = true;
  window.addEventListener('deviceorientation', handleOrientation);
}

function detach() {
  if (!listening) return;
  listening = false;
  window.removeEventListener('deviceorientation', handleOrientation);
}

/** iOS gates the sensor behind a permission prompt that needs a real gesture. */
function requestPermissionOnFirstGesture() {
  if (gestureHookAttached) return;
  gestureHookAttached = true;

  const ask = () => {
    window.removeEventListener('touchend', ask);
    const ctor = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<PermissionState | 'granted' | 'denied'>;
    };
    void ctor
      .requestPermission?.()
      .then((result) => {
        if (result === 'granted') attach();
      })
      // Declined, or the prompt failed. Panes simply stay level.
      .catch(() => {});
  };

  window.addEventListener('touchend', ask, { once: true });
}

/**
 * Subscribes to device tilt, normalised to -1…1 on each axis.
 * Returns an unsubscribe function. Safe to call when unsupported — it just
 * never fires.
 */
export function subscribeToDeviceTilt(listener: TiltListener): () => void {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
    return () => {};
  }

  listeners.add(listener);

  const needsPermission =
    typeof (window.DeviceOrientationEvent as unknown as { requestPermission?: unknown })
      .requestPermission === 'function';

  if (needsPermission) requestPermissionOnFirstGesture();
  else attach();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) detach();
  };
}
