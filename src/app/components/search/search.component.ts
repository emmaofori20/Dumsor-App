import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Area } from '../../models/dumsor.models';
import { AreaService } from '../../services/area.service';
import { MissingAreaService } from '../../services/missing-area.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="search-box">
      <label for="area-search" class="sr-only">Search your area</label>
      <div class="search-input-wrap">
        <span>⌕</span>
        <input
          id="area-search"
          name="areaSearch"
          [(ngModel)]="query"
          (ngModelChange)="onSearch($event)"
          placeholder="Search your area"
          autocomplete="off"
        />
      </div>

      @if (results().length) {
        <div class="search-results">
          @for (area of results(); track area.id) {
            <button type="button" (click)="select(area)">
              <span>
                <strong>{{ area.name }}</strong>
                <small>{{ area.region }}</small>
              </span>
              <em>Group {{ area.group }}</em>
            </button>
          }
        </div>
      }

      @if (showMissingState()) {
        <div class="missing-area-card">
          <strong>No timetable match found</strong>
          <p>Try a nearby town, suburb, school, landmark, or district name.</p>
          <button type="button" (click)="submitMissingArea()">Report missing area</button>
        </div>
      }

      @if (showLocationButton) {
        <button type="button" class="location-search-button" [disabled]="isLocating()" (click)="useCurrentLocation()">
          {{ isLocating() ? 'Finding your area...' : 'Use current location' }}
        </button>
      }

      @if (locationMessage()) {
        <p class="location-search-message">{{ locationMessage() }}</p>
      }

      @if (missingMessage()) {
        <p class="location-search-message">{{ missingMessage() }}</p>
      }
    </section>
  `,
})
export class SearchComponent {
  @Input() showLocationButton = true;
  @Input() showMissingAreaReport = true;
  @Output() areaSelected = new EventEmitter<Area>();
  query = '';
  results = signal<Area[]>([]);
  locationMessage = signal('');
  missingMessage = signal('');
  isLocating = signal(false);

  constructor(
    private readonly areas: AreaService,
    private readonly missingAreas: MissingAreaService,
  ) {}

  onSearch(value: string): void {
    this.missingMessage.set('');
    this.results.set(this.areas.search(value));
  }

  select(area: Area): void {
    this.query = area.name;
    this.results.set([]);
    this.areaSelected.emit(area);
  }

  showMissingState(): boolean {
    return this.showMissingAreaReport && this.query.trim().length >= 3 && this.results().length === 0;
  }

  async submitMissingArea(): Promise<void> {
    await this.missingAreas.submit(this.query);
    this.missingMessage.set('Thanks. We saved this missing area for review.');
  }

  useCurrentLocation(): void {
    this.locationMessage.set('');
    this.missingMessage.set('');

    if (!navigator.geolocation) {
      this.locationMessage.set('Location is not available in this browser.');
      return;
    }

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      this.locationMessage.set('Current location only works on HTTPS websites.');
      return;
    }

    this.isLocating.set(true);
    this.locationMessage.set('Finding the nearest timetable area...');
    this.getPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
      .catch(() => this.getPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }))
      .then((position) => this.usePosition(position))
      .catch((error: GeolocationPositionError) => this.handleLocationError(error))
      .finally(() => this.isLocating.set(false));
  }

  private getPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  private usePosition(position: GeolocationPosition): void {
    const nearest = this.areas.findNearest(position.coords.latitude, position.coords.longitude);
    if (!nearest) {
      this.locationMessage.set('No nearby timetable area found yet.');
      return;
    }

    this.query = nearest.name;
    this.results.set([]);
    this.locationMessage.set(`Using nearest timetable area: ${nearest.name}.`);
    this.areaSelected.emit(nearest);
  }

  private handleLocationError(error: GeolocationPositionError): void {
    const messages: Record<number, string> = {
      [error.PERMISSION_DENIED]: 'Location permission was not granted for this site.',
      [error.POSITION_UNAVAILABLE]: 'Your phone could not determine its location. Try turning on GPS/location services.',
      [error.TIMEOUT]: 'Location lookup timed out. Try again with GPS/location services enabled.',
    };

    this.locationMessage.set(messages[error.code] ?? 'Could not get your current location.');
  }
}
