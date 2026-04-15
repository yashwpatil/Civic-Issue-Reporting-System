import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract EXIF data (particularly GPS) from an image
 * This endpoint attempts to extract GPS coordinates from image EXIF data
 */
export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { latitude: null, longitude: null },
        { status: 400 }
      );
    }

    // Try to use piexifjs if available, otherwise return null
    let exifData = { latitude: null, longitude: null };

    try {
      // Dynamic import of piexifjs (if installed)
      const piexif = await import('piexifjs');
      
      // Remove data URL prefix if present
      const base64Data = imageData.split(',')[1] || imageData;
      const binary = Buffer.from(base64Data, 'base64').toString('binary');

      try {
        const exif = piexif.load(binary);
        const gps = exif.GPS;

        if (gps) {
          const parseGPS = (gpsArray: any[], ref: string): number => {
            const deg = gpsArray[0][0] / gpsArray[0][1];
            const min = gpsArray[1][0] / gpsArray[1][1];
            const sec = gpsArray[2][0] / gpsArray[2][1];

            let result = deg + min / 60 + sec / 3600;

            if (ref === 'S' || ref === 'W') {
              result = -result;
            }

            return result;
          };

          const latitude = gps[2]
            ? parseGPS(gps[2], piexif.TAGS.GPS["GPSLatitudeRef"].values[gps[1]][0])
            : null;

          const longitude = gps[4]
            ? parseGPS(gps[4], piexif.TAGS.GPS["GPSLongitudeRef"].values[gps[3]][0])
            : null;

          if (latitude && longitude) {
            exifData = { latitude, longitude };
          }
        }
      } catch (exifError) {
        console.log('Could not extract EXIF data from image:', exifError);
        // Continue without EXIF data
      }
    } catch (importError) {
      // piexifjs not available, which is fine
      console.log('piexifjs library not available, skipping EXIF extraction');
    }

    return NextResponse.json(exifData);
  } catch (error) {
    console.error('Error in extract-exif endpoint:', error);
    return NextResponse.json(
      { latitude: null, longitude: null },
      { status: 500 }
    );
  }
}
