/**
 * Universal Navigation Helper
 * Opens the location in whichever navigation application the user has installed
 * (Neshan, Balad, Google Maps, Apple Maps, etc.) or web fallback.
 */
export function openUniversalLocation(opts: {
  lat?: number;
  lng?: number;
  locationUrl?: string;
  name?: string;
  address?: string;
}) {
  const { lat, lng, locationUrl, name = "دفتر", address = "" } = opts;

  // 1. If an explicit location link (e.g. balad, nshn, maps) is saved
  if (locationUrl && locationUrl.trim().startsWith("http")) {
    window.open(locationUrl.trim(), "_blank");
    return;
  }

  // 2. If coordinates are available
  if (lat && lng) {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile devices (Android / iOS), geo URI prompts user to choose their installed navigation app (نشان، بلد، نقشه گوگل)
      const geoUri = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
      try {
        window.location.href = geoUri;
        // Fallback in case the browser blocks protocol handlers
        setTimeout(() => {
          window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
        }, 800);
      } catch {
        window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
      }
    } else {
      // On desktop, open in maps tab
      window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
    }
    return;
  }

  // 3. Fallback to address/name search
  const query = encodeURIComponent(`${name} ${address}`.trim());
  window.open(`https://maps.google.com/?q=${query}`, "_blank");
}
