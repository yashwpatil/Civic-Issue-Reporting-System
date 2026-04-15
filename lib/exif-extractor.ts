/**
 * EXIF data extraction utilities
 * Converts EXIF GPS data to latitude and longitude coordinates
 */

interface ExifGPSData {
  latitude: number | null;
  longitude: number | null;
  altitude?: number | null;
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to decimal format
 * Used for converting EXIF GPS data
 */
function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: string
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  // South and West are negative
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

/**
 * Extract GPS coordinates from EXIF data
 * This is a helper function to parse EXIF data when available
 */
export function extractGPSFromExif(exifData: Record<string, any>): ExifGPSData {
  try {
    const gps = exifData?.Exif?.Gps;
    
    if (!gps) {
      return { latitude: null, longitude: null };
    }

    const { GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef, GPSAltitude } = gps;

    if (!GPSLatitude || !GPSLongitude) {
      return { latitude: null, longitude: null };
    }

    const latitude = dmsToDecimal(
      GPSLatitude[0],
      GPSLatitude[1],
      GPSLatitude[2],
      GPSLatitudeRef
    );

    const longitude = dmsToDecimal(
      GPSLongitude[0],
      GPSLongitude[1],
      GPSLongitude[2],
      GPSLongitudeRef
    );

    const altitude = GPSAltitude ? GPSAltitude[0] / GPSAltitude[1] : undefined;

    return { latitude, longitude, altitude };
  } catch (error) {
    console.error('Error extracting GPS from EXIF:', error);
    return { latitude: null, longitude: null };
  }
}

/**
 * Convert image file to base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Try to extract EXIF data from an image file using a server endpoint
 * Falls back gracefully if EXIF data is not available
 */
export async function extractExifDataFromImage(imageBase64: string): Promise<ExifGPSData> {
  try {
    const response = await fetch('/api/extract-exif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: imageBase64 }),
    });

    if (!response.ok) {
      return { latitude: null, longitude: null };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return { latitude: null, longitude: null };
  }
}
