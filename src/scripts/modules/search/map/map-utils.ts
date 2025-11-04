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
