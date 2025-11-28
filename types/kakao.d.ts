// types/kakao.d.ts
// 카카오맵 API 타입 정의

interface Window {
  kakao: any
}

declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void
    
    class LatLng {
      constructor(lat: number, lng: number)
    }
    
    class Map {
      constructor(container: HTMLElement, options: MapOptions)
    }
    
    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
    }
    
    interface MapOptions {
      center: LatLng
      level: number
    }
    
    interface MarkerOptions {
      position: LatLng
      map?: Map
    }
  }
}