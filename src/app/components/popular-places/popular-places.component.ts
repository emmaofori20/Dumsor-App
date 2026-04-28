import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Area } from '../../models/dumsor.models';
import { AreaService } from '../../services/area.service';

@Component({
  selector: 'app-popular-places',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="popular-card">
      <div class="section-head">
        <h2>Popular places</h2>
        <span>Tap to switch</span>
      </div>
      <div class="chip-grid">
        @for (place of popular; track place.id) {
          <button type="button" (click)="areaSelected.emit(place)">
            {{ place.name }}
          </button>
        }
      </div>
    </section>
  `,
})
export class PopularPlacesComponent {
  @Output() areaSelected = new EventEmitter<Area>();
  popular: Area[];

  constructor(private readonly areas: AreaService) {
    this.popular = this.areas.popularPlaces();
  }
}
