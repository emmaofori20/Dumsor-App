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
        <button type="button" class="location-search-button" (click)="useCurrentLocation()">
          Use current location
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

    if (!navigator.geolocation) {
      this.locationMessage.set('Location is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = this.areas.findNearest(position.coords.latitude, position.coords.longitude);
        if (!nearest) {
          this.locationMessage.set('No nearby timetable area found yet.');
          return;
        }

        this.query = nearest.name;
        this.results.set([]);
        this.areaSelected.emit(nearest);
      },
      () => this.locationMessage.set('Location permission was not granted.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }
}
