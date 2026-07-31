export const getGeolocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    }
  });
};

export const watchGeolocation = (onUpdate: (coords: { lat: number; lng: number }) => void, onError: (error: GeolocationPositionError) => void) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      onError(error);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};
