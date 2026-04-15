'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { categoryLabels } from '@/lib/utils-civic';
import { useToast } from '@/hooks/use-toast';
import { extractExifDataFromImage } from '@/lib/exif-extractor';
import { useAuth } from '@/lib/auth-context';

type FormState = {
  title: string;
  description: string;
  category: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  image: string;
  latitude: string;
  longitude: string;
  address: string;
  audio?: string;
};

// Map categories to departments
const categoryToDepartment: { [key: string]: string } = {
  'garbage': 'garbage',
  'roads': 'roads',
  'water': 'water',
  'electricity': 'electricity',
  'other': 'garbage', // Default to garbage for other
};

export function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [currentLocationMarkerAdded, setCurrentLocationMarkerAdded] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    category: searchParams.get('category') || 'garbage',
    location: '',
    contactEmail: '',
    contactPhone: '',
    image: '',
    latitude: '',
    longitude: '',
    address: '',
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const imageFileRef = useRef<File | null>(null);
  const audioFileRef = useRef<File | null>(null);

  // Auto-fetch user's live location on component mount
  useEffect(() => {
    attachCurrentLocation();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) {
      return;
    }

    let mounted = true;

    import('leaflet')
      .then((L) => {
        if (!mounted || !mapRef.current) {
          return;
        }

        const map = L.map(mapRef.current).setView([18.5204, 73.8567], 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        map.on('click', async (e: any) => {
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          markerRef.current = L.marker(e.latlng).addTo(map);
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;

          setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }));

          // Reset the auto marker flag when user manually selects a location
          setCurrentLocationMarkerAdded(false);

          await fetchAddress(lat, lng);
        });

        setMapLoaded(true);
      })
      .catch((error) => {
        console.error('Leaflet load error:', error);
        setMapError('Unable to load map. Please try again later.');
      });

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Add current location marker to map when both map and location are available
  useEffect(() => {
    if (mapLoaded && formData.latitude && formData.longitude && !currentLocationMarkerAdded && mapInstanceRef.current) {
      import('leaflet').then((L) => {
        const map = mapInstanceRef.current;
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);

        // Create a blue marker for current location (to distinguish from manually selected pin)
        const blueIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        // Add blue marker for current location
        const currentLocationMarker = L.marker([lat, lng], { icon: blueIcon })
          .addTo(map)
          .bindPopup('📍 Your Current Location');

        // Store reference to easily remove it later if needed
        markerRef.current = currentLocationMarker;

        // Center map to current location with a nice zoom level
        map.setView([lat, lng], 16);

        setCurrentLocationMarkerAdded(true);
      });
    }
  }, [mapLoaded, formData.latitude, formData.longitude, currentLocationMarkerAdded]);

  const fetchAddress = async (latitude: number, longitude: number) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn('Geocoding returned non-OK status:', response.status);
        return;
      }
      
      const data = await response.json();
      const address = data.display_name || '';

      if (address) {
        setFormData((prev) => ({
          ...prev,
          address: address,
          location: address, // Update location field with the fetched address
        }));
        console.log('Address fetched successfully:', address);
      }
    } catch (error) {
      // Silently fail - geocoding is optional
      console.warn('Reverse geocoding failed (this is optional):', error);
    }
  };

  const attachCurrentLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('Geolocation is not supported in this browser.');
      return;
    }

    setIsGeoLoading(true);
    setGeoStatus('Fetching live location from your device...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        // Reset marker flag so it gets added/updated in the map
        setCurrentLocationMarkerAdded(false);

        await fetchAddress(lat, lng);
        setGeoStatus('✓ Live device location has been automatically detected and set.');
        setIsGeoLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeoStatus('Unable to determine live location from your device.');
        setIsGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file for upload
      imageFileRef.current = file;

      const reader = new FileReader();
      reader.onloadend = async () => {
        setImagePreview(reader.result as string);
        setFormData((prev) => ({ ...prev, image: reader.result as string }));

        // Try to extract EXIF GPS data from the image
        if (!formData.latitude || !formData.longitude) {
          setIsGeoLoading(true);
          
          try {
            const exifData = await extractExifDataFromImage(reader.result as string);
            
            if (exifData.latitude && exifData.longitude) {
              // Use EXIF location if available
              setFormData((prev) => ({
                ...prev,
                latitude: exifData.latitude!.toString(),
                longitude: exifData.longitude!.toString(),
              }));
              // Reset marker flag so it gets added to the map
              setCurrentLocationMarkerAdded(false);
              await fetchAddress(exifData.latitude!, exifData.longitude!);
              setGeoStatus('✓ Location extracted from image EXIF data.');
              setIsGeoLoading(false);
            } else {
              // Fallback to device geolocation if EXIF data not available
              attachCurrentLocation();
            }
          } catch (error) {
            console.error('Error extracting EXIF:', error);
            // Fallback to device geolocation
            attachCurrentLocation();
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        variant: 'destructive',
        title: 'Audio not supported',
        description: 'Your browser does not support voice recording.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
      toast({
        variant: 'destructive',
        title: 'Audio recording error',
        description: 'Unable to start voice recording.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to submit a complaint.',
      });
      return;
    }

    if (!formData.title.trim() || !formData.category || !formData.location.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please provide a title, category, and location.',
      });
      return;
    }

    if (formData.title.length < 5) {
      toast({
        variant: 'destructive',
        title: 'Title Too Short',
        description: 'Title must be at least 5 characters long.',
      });
      return;
    }

    if (!formData.description.trim() && !audioBlob) {
      toast({
        variant: 'destructive',
        title: 'Missing Description',
        description: 'Please enter a description or record voice details.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate user data
      if (!user || !user.id) {
        throw new Error('User not logged in properly');
      }

      // Validate and get category
      if (!formData.category || typeof formData.category !== 'string') {
        throw new Error('Please select a valid category');
      }

      // Get department from category - ensure it's defined
      const categoryLower = String(formData.category).toLowerCase().trim();
      const department = categoryToDepartment[categoryLower] || categoryToDepartment[formData.category] || 'garbage';
      
      console.log('Form category:', formData.category, 'Lowercase:', categoryLower, 'Department:', department);

      console.log('Submitting complaint for department:', department);

      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', (formData.title || '').trim());
      formDataToSend.append('description', (formData.description || '').trim());
      formDataToSend.append('location', (formData.location || '').trim());
      formDataToSend.append('latitude', String(formData.latitude || '0'));
      formDataToSend.append('longitude', String(formData.longitude || '0'));
      formDataToSend.append('address', (formData.address || '').trim());
      formDataToSend.append('userId', user.id);
      formDataToSend.append('contactEmail', (formData.contactEmail || '').trim());
      formDataToSend.append('contactPhone', (formData.contactPhone || '').trim());
      formDataToSend.append('priority', 'medium');

      // Add image file if exists
      if (imageFileRef.current) {
        formDataToSend.append('image', imageFileRef.current);
      }

      // Add audio blob if exists
      if (audioBlob) {
        formDataToSend.append('audio', audioBlob, 'audio.wav');
      }

      // Send to department-specific endpoint
      const endpoint = `/api/complaints-supabase/${department}`;
      console.log('Sending request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage: string = 'Failed to submit complaint';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.log('Error data from API:', errorData);
            console.log('Error data type:', typeof errorData);
            console.log('Error data keys:', Object.keys(errorData || {}));
            
            if (errorData && typeof errorData === 'object') {
              const errorValue = errorData.error || errorData.message;
              console.log('Extracted error value:', errorValue, 'Type:', typeof errorValue);
              
              if (typeof errorValue === 'string') {
                errorMessage = errorValue;
              } else if (errorValue) {
                errorMessage = String(errorValue);
              } else {
                errorMessage = JSON.stringify(errorData);
              }
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            }
          } else {
            const text = await response.text();
            errorMessage = text && text.length > 0 ? text : `Server error (${response.status}): ${response.statusText || 'Unknown'}`;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText || 'Unknown error'}`;
        }
        
        // Ensure errorMessage is always a valid string - CRITICAL CHECK
        if (typeof errorMessage !== 'string' || errorMessage.length === 0) {
          console.warn('errorMessage was invalid:', errorMessage);
          errorMessage = `Server error (${response.status})`;
        }
        
        console.error('API Error (final):', errorMessage);
        throw new Error(String(errorMessage));
      }

      const data = await response.json();
      console.log('Complaint submitted successfully:', data);

      toast({
        title: 'Success!',
        description: 'Your complaint has been submitted successfully.',
      });
      router.push(`/dashboard?complaintId=${data.id}`);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit complaint. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Report a Civic Issue</CardTitle>
          <CardDescription>
            Help improve your community by reporting infrastructure problems. Fill in the details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as any }))}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief title of the issue"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <p className="text-xs text-foreground/60">Minimum 5 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="map">Drop-a-Pin Location</Label>
              <div className="rounded-lg border border-border overflow-hidden">
                <div ref={mapRef} className="h-72 w-full bg-slate-800" />
              </div>
              {mapError ? (
                <p className="text-sm text-destructive mt-2">{mapError}</p>
              ) : (
                <p className="text-sm text-foreground/60 mt-2">
                  Tap the map to choose the exact location. The form will use the address found by the pin.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Location & Coordinates *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={attachCurrentLocation}
                  disabled={isGeoLoading}
                  className="whitespace-nowrap"
                >
                  {isGeoLoading ? (
                    <>
                      <Spinner className="mr-2 h-3 w-3" />
                      Getting Location...
                    </>
                  ) : (
                    'Use Current Location'
                  )}
                </Button>
              </div>
              {geoStatus && (
                <p className={`text-sm ${geoStatus.includes('Unable') ? 'text-yellow-600' : 'text-green-600'}`}>
                  {geoStatus}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location/Address *</Label>
                <Input
                  id="location"
                  placeholder="Street address or location description"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Auto-Detected Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  readOnly
                  placeholder="Address will appear after location detection"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" value={formData.latitude} readOnly placeholder="Unset" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" value={formData.longitude} readOnly placeholder="Unset" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the issue. Include what makes it unsafe or problematic."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={5}
              />
              <p className="text-xs text-foreground/60">
                Description is required unless you record a voice note.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Record Voice Description</Label>
              <div className="flex flex-wrap gap-3 items-center">
                <Button type="button" size="sm" onClick={startRecording} disabled={isRecording} className="whitespace-nowrap">
                  Start Recording
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={stopRecording} disabled={!isRecording} className="whitespace-nowrap">
                  Stop Recording
                </Button>
                <span className={`inline-flex h-3 w-3 rounded-full flex-shrink-0 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
              </div>
              {audioUrl && (
                <div className="mt-3 space-y-2">
                  <div className="w-full max-w-full overflow-hidden rounded-md border border-border">
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={clearRecording} className="whitespace-nowrap">
                    Remove recording
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Upload Image (Optional)</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-4 space-y-2">
                  <div className="w-full max-w-full overflow-hidden rounded-lg border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  </div>
                  {formData.latitude && formData.longitude ? (
                    <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        ✓ Location captured: {formData.latitude.substring(0, 8)}, {formData.longitude.substring(0, 8)}
                      </p>
                    </div>
                  ) : null}
                  {isGeoLoading && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      🔍 Detecting location metadata from image...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="123-456-7890"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full whitespace-nowrap" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                'Submit Complaint'
              )}
            </Button>

            <p className="text-xs text-foreground/60 text-center">
              All fields marked with * are required
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
