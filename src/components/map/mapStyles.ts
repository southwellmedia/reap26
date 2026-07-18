/**
 * Google Maps styling for the portfolio map — legacy JSON styles derived from
 * the Reap brand palette (styles/themes/reap.css). Kept in-repo (rather than a
 * Cloud-console Map ID) so the light/dark styles can be swapped at runtime
 * when the site theme toggles.
 */

// Brand values (CSS custom properties can't feed the Maps API, so the hex
// values from themes/reap.css are repeated here verbatim).
const GREEN_950 = '#252c21';
const GREEN_900 = '#394334';
const GREEN_700 = '#4f5b49';
const GOLD_500 = '#ccaf79';

/** Light editorial — paper geometry, olive-tinted water, muted labels. */
export const lightMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f4ef' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b63' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f4ef' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d8d6cc' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: GREEN_900 }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#efeee6' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e3d9' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a887d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#eae8dd' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d8d6cc' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d1c3' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: GREEN_700 }] },
];

/** Dark editorial — deep olive ink base, desaturated-gold labels. */
export const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: GREEN_950 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a9a58f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: GREEN_950 }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: GREEN_700 }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: GOLD_500 }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#2a3126' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: GREEN_900 }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: GREEN_950 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8f8b76' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: GREEN_700 }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1c211a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: GREEN_700 }] },
];

/** Shared map options — flat editorial chrome, minimal controls. */
export const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: 'cooperative',
  clickableIcons: false,
  backgroundColor: 'transparent',
};
