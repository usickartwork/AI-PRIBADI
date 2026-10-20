import { NearbyFacility } from './types';

// Curated reference hospitals across major Indonesian provinces for reliable offline / fallback search
export const CURATED_MAJOR_FACILITIES: NearbyFacility[] = [
  {
    id: 'rscm-jkt',
    name: 'RSUP Nasional Dr. Cipto Mangunkusumo (RSCM) - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan Nasional',
    address: 'Jl. Pangeran Diponegoro No.71, Kenari, Senen, Jakarta Pusat',
    phone: '(021) 1500135',
    lat: -6.1969,
    lng: 106.8467,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUP+Nasional+Dr+Cipto+Mangunkusumo+IGD',
  },
  {
    id: 'rspad-jkt',
    name: 'RSPAD Gatot Soebroto - IGD 24 Jam',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Pusat',
    address: 'Jl. Abdul Rahman Saleh No.24, Senen, Jakarta Pusat',
    phone: '(021) 3441008',
    lat: -6.1775,
    lng: 106.8378,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSPAD+Gatot+Soebroto+IGD',
  },
  {
    id: 'rshs-bdg',
    name: 'RSUP Dr. Hasan Sadikin (RSHS) Bandung - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan Jawa Barat',
    address: 'Jl. Pasteur No.38, Pasteur, Sukajadi, Kota Bandung',
    phone: '(022) 2034953',
    lat: -6.8967,
    lng: 107.5983,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUP+Dr+Hasan+Sadikin+Bandung+IGD',
  },
  {
    id: 'rsds-sby',
    name: 'RSUD Dr. Soetomo Surabaya - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan Jawa Timur',
    address: 'Jl. Mayjen Prof. Dr. Moestopo No.6-8, Gubeng, Surabaya',
    phone: '(031) 5501078',
    lat: -7.2683,
    lng: 112.7583,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUD+Dr+Soetomo+Surabaya+IGD',
  },
  {
    id: 'rsup-sardjito-jogja',
    name: 'RSUP Dr. Sardjito Yogyakarta - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan D.I. Yogyakarta',
    address: 'Jl. Kesehatan No.1, Sekip, Sinduadi, Mlati, Sleman, Yogyakarta',
    phone: '(0274) 631190',
    lat: -7.7686,
    lng: 110.3739,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUP+Dr+Sardjito+Yogyakarta+IGD',
  },
  {
    id: 'rsup-adam-malik-mdn',
    name: 'RSUP H. Adam Malik Medan - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan Sumatera Utara',
    address: 'Jl. Bunga Lau No.17, Kemenangan Tani, Medan Tuntungan, Medan',
    phone: '(061) 8360143',
    lat: 3.5189,
    lng: 98.6078,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUP+H+Adam+Malik+Medan+IGD',
  },
  {
    id: 'rsup-wahidin-mks',
    name: 'RSUP Dr. Wahidin Sudirohusodo Makassar - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan Sulawesi Selatan',
    address: 'Jl. Perintis Kemerdekaan Km.11, Tamalanrea, Makassar',
    phone: '(0411) 584677',
    lat: -5.1352,
    lng: 119.4936,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUP+Dr+Wahidin+Sudirohusodo+Makassar+IGD',
  },
  {
    id: 'rsup-sanglah-dps',
    name: 'RSUP Prof. Dr. I.G.N.G. Ngoerah (Sanglah) Denpasar - IGD',
    type: 'hospital',
    typeLabel: 'Rumah Sakit Rujukan Bali & Nusa Tenggara',
    address: 'Jl. Diponegoro, Dauh Puri Klod, Denpasar Barat, Denpasar',
    phone: '(0361) 227911',
    lat: -8.6756,
    lng: 115.2128,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=RSUP+Prof+Dr+I+G+N+G+Ngoerah+Sanglah+Denpasar+IGD',
  },
];

export async function fetchNearbyFacilitiesFromCoords(
  lat: number,
  lng: number,
  type: 'all' | 'hospital' | 'police' | 'fire_station' = 'all'
): Promise<NearbyFacility[]> {
  try {
    // Overpass API Query with radius 7km, timeout 6s
    const amenityFilter =
      type === 'hospital'
        ? '["amenity"="hospital"]'
        : type === 'police'
        ? '["amenity"="police"]'
        : type === 'fire_station'
        ? '["amenity"="fire_station"]'
        : '["amenity"~"hospital|police|fire_station|clinic"]';

    const query = `[out:json][timeout:6];(node${amenityFilter}(around:7000,${lat},${lng});way${amenityFilter}(around:7000,${lat},${lng}););out center 12;`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Overpass status ${res.status}`);
    }

    const data = await res.json();
    if (!data.elements || !Array.isArray(data.elements) || data.elements.length === 0) {
      return getFallbackNearbyFacilities(lat, lng);
    }

    const facilities: NearbyFacility[] = data.elements.map((el: any, i: number) => {
      const eLat = el.lat || el.center?.lat || lat;
      const eLng = el.lon || el.center?.lon || lng;
      const amenity = el.tags?.amenity || 'hospital';
      const name = el.tags?.name || (amenity === 'hospital' ? 'Rumah Sakit' : amenity === 'police' ? 'Kantor Polisi' : 'Pos Damkar');

      let typeKey: NearbyFacility['type'] = 'hospital';
      let typeLabel = 'Rumah Sakit';
      if (amenity === 'police') {
        typeKey = 'police';
        typeLabel = 'Kantor Polisi';
      } else if (amenity === 'fire_station') {
        typeKey = 'fire_station';
        typeLabel = 'Pemadam Kebakaran';
      } else if (amenity === 'clinic') {
        typeKey = 'clinic';
        typeLabel = 'Klinik / Puskesmas';
      }

      // Calculate approximate Haversine distance
      const distanceKm = calculateHaversineDistance(lat, lng, eLat, eLng);

      return {
        id: `osm-${el.id || i}`,
        name,
        type: typeKey,
        typeLabel,
        address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:city'] || ''}`.trim() : undefined,
        phone: el.tags?.phone || el.tags?.['contact:phone'],
        lat: eLat,
        lng: eLng,
        distanceKm: Math.round(distanceKm * 10) / 10,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${eLat},${eLng}`)}`,
      };
    });

    facilities.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return facilities.slice(0, 10);
  } catch {
    // If Overpass fails (network error, timeout, offline), return computed fallback from major facilities
    return getFallbackNearbyFacilities(lat, lng);
  }
}

export function getFallbackNearbyFacilities(lat: number, lng: number): NearbyFacility[] {
  return CURATED_MAJOR_FACILITIES.map((f) => {
    const dist = f.lat && f.lng ? calculateHaversineDistance(lat, lng, f.lat, f.lng) : undefined;
    return {
      ...f,
      distanceKm: dist ? Math.round(dist * 10) / 10 : undefined,
    };
  }).sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildExternalSearchUrl(query: string, coords?: { lat: number; lng: number } | null): string {
  if (coords) {
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${coords.lat},${coords.lng},14z`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}
