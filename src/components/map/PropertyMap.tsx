/**
 * PropertyMap — interactive Google Map of the portfolio (React island).
 *
 * Renders a brand-styled map with one gold pin per property; clicking a pin
 * opens a details card overlaid on the map (photo, meta, figure, case-study
 * link). Region chips handle the two outliers (San Antonio, Tampa) so the
 * default view can stay tight on DFW.
 *
 * Consent-aware: mirrors GoogleMap.astro — when the consent system is enabled
 * and marketing consent hasn't been granted, a placeholder renders instead and
 * no Google scripts load. "Load Map" force-loads this instance only; a
 * `consent-updated` grant loads it globally.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import logomark from '@/assets/reap/reap-logomark-gold.svg';
import { MAP_OPTIONS, darkMapStyles, lightMapStyles } from './mapStyles';
import './PropertyMap.css';

export type MapRegion = 'dfw' | 'san-antonio' | 'tampa';

export interface MapProperty {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Pre-resolved optimized image URL (getImage in the Astro wrapper). */
  image: string;
  imageAlt: string;
  /** ledgerMeta(p) — "Arlington, TX · 288 Units" */
  meta: string;
  /** ledgerFigure(p) — "Full Cycle · 1.86x Multiple" */
  figure: string;
  status: 'active' | 'full-cycle';
  /** /track-record/[id] when the property has a case study. */
  href?: string;
  region: MapRegion;
}

interface Props {
  apiKey: string;
  properties: MapProperty[];
  consentEnabled: boolean;
  consentCategory?: string;
  externalUrl?: string;
  /** Full-bleed variant — frame spans the viewport, bar stays on the page grid. */
  wide?: boolean;
}

interface ConsentWindow extends Window {
  __consentState?: { decided: boolean; categories: Record<string, boolean> };
}

// setOptions must run exactly once, before the first importLibrary call.
// importLibrary itself dedupes the Maps script across the homepage and
// /track-record islands and across view-transition remounts.
let optionsSet = false;
function loadMapsLibrary(apiKey: string): Promise<google.maps.MapsLibrary> {
  if (!optionsSet) {
    setOptions({ key: apiKey, v: 'weekly' });
    optionsSet = true;
  }
  return importLibrary('maps');
}

function hasConsent(enabled: boolean, category: string): boolean {
  if (!enabled) return true;
  const w = window as unknown as ConsentWindow;
  return !!(w.__consentState?.decided && w.__consentState.categories[category]);
}

/** Gold teardrop pin as an SVG data URI. Active = solid gold; full-cycle = olive with gold dot. */
function pinIcon(status: MapProperty['status']): string {
  const fill = status === 'active' ? '#ccaf79' : '#4f5b49';
  const dot = status === 'active' ? '#252c21' : '#ccaf79';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">` +
    `<path d="M15 1C7.3 1 1 7.3 1 15c0 10.5 14 24 14 24s14-13.5 14-24C29 7.3 22.7 1 15 1z" fill="${fill}" stroke="#252c21" stroke-width="1.5"/>` +
    `<circle cx="15" cy="15" r="4.5" fill="${dot}"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const REGION_CHIPS: { key: MapRegion | 'all'; label: string }[] = [
  { key: 'dfw', label: 'DFW' },
  { key: 'san-antonio', label: 'San Antonio' },
  { key: 'tampa', label: 'Tampa' },
  { key: 'all', label: 'All' },
];

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PropertyMap({
  apiKey,
  properties,
  consentEnabled,
  consentCategory = 'marketing',
  externalUrl = 'https://www.google.com/maps/search/?api=1&query=Dallas%2C+TX',
  wide = false,
}: Props) {
  const [granted, setGranted] = useState(false);
  const [forceLoad, setForceLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<MapProperty | null>(null);
  const [activeChip, setActiveChip] = useState<MapRegion | 'all'>('dfw');

  const canvasRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Consent gate — check on mount, react to banner decisions.
  useEffect(() => {
    if (hasConsent(consentEnabled, consentCategory)) {
      setGranted(true);
      return;
    }
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { categories?: Record<string, boolean> }
        | undefined;
      if (detail?.categories?.[consentCategory]) setGranted(true);
    };
    window.addEventListener('consent-updated', onConsent);
    return () => window.removeEventListener('consent-updated', onConsent);
  }, [consentEnabled, consentCategory]);

  const fitRegion = useCallback(
    (map: google.maps.Map, region: MapRegion | 'all') => {
      const subset =
        region === 'all' ? properties : properties.filter((p) => p.region === region);
      if (subset.length === 0) return;
      if (subset.length === 1) {
        const p = subset[0];
        if (prefersReducedMotion()) {
          map.setCenter({ lat: p.lat, lng: p.lng });
        } else {
          map.panTo({ lat: p.lat, lng: p.lng });
        }
        map.setZoom(12);
        setSelected(p);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      subset.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 48);
    },
    [properties]
  );

  // Map init — runs once consent is in hand and the canvas is in the DOM.
  useEffect(() => {
    if (!(granted || forceLoad) || !canvasRef.current || mapRef.current) return;
    let cancelled = false;

    loadMapsLibrary(apiKey)
      .then(() => {
        if (cancelled || !canvasRef.current) return;
        const isDark = document.documentElement.classList.contains('dark');
        const map = new google.maps.Map(canvasRef.current, {
          ...MAP_OPTIONS,
          styles: isDark ? darkMapStyles : lightMapStyles,
          center: { lat: 32.82, lng: -96.87 },
          zoom: 10,
        });
        mapRef.current = map;

        // Single-property mode: the page itself is the property detail, so the
        // pin is informational only — no click card.
        const interactive = properties.length > 1;
        markersRef.current = properties.map((p) => {
          const marker = new google.maps.Marker({
            map,
            position: { lat: p.lat, lng: p.lng },
            title: p.name,
            clickable: interactive,
            icon: {
              url: pinIcon(p.status),
              scaledSize: new google.maps.Size(30, 40),
              anchor: new google.maps.Point(15, 40),
            },
          });
          if (interactive) marker.addListener('click', () => setSelected(p));
          return marker;
        });

        map.addListener('click', () => setSelected(null));
        if (properties.length === 1) {
          // Single-property mode (case-study pages) — center on the pin.
          // Coords are city-level, so stay wide enough not to imply an address.
          map.setCenter({ lat: properties[0].lat, lng: properties[0].lng });
          map.setZoom(13);
        } else {
          fitRegion(map, 'dfw');
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => {
        google.maps.event.clearInstanceListeners(m);
        m.setMap(null);
      });
      markersRef.current = [];
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
        mapRef.current = null;
      }
    };
  }, [granted, forceLoad, apiKey, properties, fitRegion]);

  // Theme sync — restyle the map when the site's .dark class toggles.
  useEffect(() => {
    if (!ready) return;
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      mapRef.current?.setOptions({ styles: isDark ? darkMapStyles : lightMapStyles });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [ready]);

  // Details card — Esc closes, focus moves in on open and restores on close.
  useEffect(() => {
    if (!selected) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [selected]);

  const onChip = (key: MapRegion | 'all') => {
    setActiveChip(key);
    setSelected(null);
    if (mapRef.current) fitRegion(mapRef.current, key);
  };

  // ── Consent placeholder ──
  if (!granted && !forceLoad) {
    return (
      <div className="pmap-placeholder">
        <img
          className="pmap-placeholder-icon"
          src={logomark.src}
          width="36"
          height="36"
          alt=""
          aria-hidden="true"
        />
        <p className="pmap-placeholder-title">Portfolio Map</p>
        <p className="pmap-placeholder-desc">
          We serve the portfolio map through Google Maps, which sets Google cookies. Load it when
          you're ready.
        </p>
        <button type="button" className="pmap-placeholder-btn" onClick={() => setForceLoad(true)}>
          Load Map
        </button>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pmap-placeholder-link"
        >
          View on Google Maps
        </a>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="pmap-placeholder">
        <p className="pmap-placeholder-title">Portfolio Map</p>
        <p className="pmap-placeholder-desc">
          The map could not be loaded.{' '}
          <a href={externalUrl} target="_blank" rel="noopener noreferrer">
            View on Google Maps
          </a>
        </p>
      </div>
    );
  }

  // ── Map ──
  const single = properties.length === 1;
  return (
    <div className={wide ? 'pmap pmap-wide' : 'pmap'}>
      {!single && (
        <div className="pmap-bar">
          <div className="pmap-chips" role="group" aria-label="Map regions">
            {REGION_CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="pmap-chip"
                aria-pressed={activeChip === chip.key}
                onClick={() => onChip(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="pmap-frame">
        <div ref={canvasRef} className="pmap-canvas" aria-label="Map of portfolio properties" />
        {selected && (
          <div
            ref={cardRef}
            className="pmap-card"
            role="dialog"
            aria-label={selected.name}
            tabIndex={-1}
          >
            <button
              type="button"
              className="pmap-card-close"
              aria-label="Close property details"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <div className="pmap-card-photo">
              <img src={selected.image} alt={selected.imageAlt} loading="lazy" />
            </div>
            <div className="pmap-card-body">
              <span className="pmap-card-meta">{selected.meta}</span>
              <h4 className="pmap-card-name">{selected.name}</h4>
              <span className="pmap-card-figure">{selected.figure}</span>
              {selected.href && (
                <a className="pmap-card-link" href={selected.href}>
                  Read the Case Study <span aria-hidden="true">⟶</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
