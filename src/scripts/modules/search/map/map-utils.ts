// Funções utilitárias para verificar se propriedades estão dentro das áreas desenhadas

export interface PropertyData {
  id: string;
  title?: string;
  price: number;
  pricePerSquareMeter: number;
  address: string;
  neighborhood?: string;
  city: string;
  state: string;
  propertyType: "COMERCIAL" | "RESIDENCIAL" | "TERRENO";
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  images: string[];
  isFavorite?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: google.maps.Polygon
): boolean => {
  return google.maps.geometry.poly.containsLocation(
    new google.maps.LatLng(point.lat, point.lng),
    polygon
  );
};

export const isPointInCircle = (
  point: { lat: number; lng: number },
  circle: google.maps.Circle
): boolean => {
  const center = circle.getCenter();
  const radius = circle.getRadius();

  if (!center) return false;

  const distance = google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(point.lat, point.lng),
    center
  );

  return distance <= radius;
};

export const isPointInRectangle = (
  point: { lat: number; lng: number },
  rectangle: google.maps.Rectangle
): boolean => {
  const bounds = rectangle.getBounds();
  if (!bounds) return false;

  return bounds.contains(new google.maps.LatLng(point.lat, point.lng));
};

export const filterPropertiesByOverlay = (
  properties: PropertyData[],
  overlay: google.maps.drawing.OverlayCompleteEvent
): PropertyData[] => {
  if (!overlay.overlay) {
    return properties;
  }

  return properties.filter((property) => {
    if (!property.coordinates) return false;

    const point = {
      lat: property.coordinates.lat,
      lng: property.coordinates.lng,
    };

    switch (overlay.type) {
      case google.maps.drawing.OverlayType.POLYGON:
        return isPointInPolygon(point, overlay.overlay as google.maps.Polygon);
      case google.maps.drawing.OverlayType.CIRCLE:
        return isPointInCircle(point, overlay.overlay as google.maps.Circle);
      case google.maps.drawing.OverlayType.RECTANGLE:
        return isPointInRectangle(
          point,
          overlay.overlay as google.maps.Rectangle
        );
      default:
        return false;
    }
  });
};

/**
 * Converte um overlay do Google Maps para o formato GeoJSON Polygon esperado pela API
 * Retorna null se o overlay não for um Polygon
 */
export const convertOverlayToGeoJSONPolygon = (
  overlay: google.maps.drawing.OverlayCompleteEvent
): { type: "Polygon"; coordinates: number[][][] } | null => {
  if (overlay.type !== google.maps.drawing.OverlayType.POLYGON) {
    return null;
  }

  const polygon = overlay.overlay as google.maps.Polygon;
  if (!polygon) {
    return null;
  }

  const paths = polygon.getPath();
  if (!paths) {
    return null;
  }

  // Converter paths do Google Maps para formato GeoJSON
  // GeoJSON usa [longitude, latitude] e o primeiro ponto deve ser igual ao último (fechar o polígono)
  const coordinates: number[][] = [];
  
  for (let i = 0; i < paths.getLength(); i++) {
    const latLng = paths.getAt(i);
    coordinates.push([latLng.lng(), latLng.lat()]);
  }

  // Garantir que o polígono está fechado (primeiro ponto = último ponto)
  if (coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push([first[0], first[1]]);
    }
  }

  // GeoJSON Polygon format: coordinates é um array de arrays de arrays
  // [[[lng, lat], [lng, lat], ...]]
  return {
    type: "Polygon",
    coordinates: [coordinates],
  };
};