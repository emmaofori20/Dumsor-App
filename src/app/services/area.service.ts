import { Injectable } from '@angular/core';
import { AREAS } from '../data/seed-data';
import { Area } from '../models/dumsor.models';

@Injectable({ providedIn: 'root' })
export class AreaService {
  readonly areas = AREAS;

  search(query: string): Area[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return this.areas
      .filter((area) =>
        [area.name, area.region, ...area.keywords].some((value) => value.toLowerCase().includes(normalized)),
      )
      .sort((a, b) => b.popularScore - a.popularScore)
      .slice(0, 12);
  }

  popularPlaces(): Area[] {
    return [...this.areas].sort((a, b) => b.popularScore - a.popularScore).slice(0, 12);
  }

  findById(id: string): Area | undefined {
    return this.areas.find((area) => area.id === id);
  }

  findByName(name: string): Area[] {
    return this.search(name);
  }

  findNearest(latitude: number, longitude: number): Area | undefined {
    return this.areas
      .filter((area) => area.latitude !== undefined && area.longitude !== undefined)
      .map((area) => ({
        area,
        distance: this.distanceKm(latitude, longitude, area.latitude!, area.longitude!),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.area;
  }

  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radiusKm = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
