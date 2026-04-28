import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Area } from '../../models/dumsor.models';
import { PopularPlacesComponent } from '../popular-places/popular-places.component';
import { SearchComponent } from '../search/search.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchComponent, PopularPlacesComponent, ThemeToggleComponent],
  template: `
    <main class="search-home">
      <nav class="search-nav">
        <a href="/admin-import">Admin</a>
        <app-theme-toggle />
      </nav>

      <section class="search-hero">
        <div class="search-logo">
          <h1>
            <span>D</span><span>u</span><span>m</span><span>s</span><span>o</span><span>r</span>
          </h1>
          <p>Timetable Ghana</p>
        </div>

        <div class="search-home-box">
          <app-search (areaSelected)="openArea($event)" />
        </div>

        <app-popular-places (areaSelected)="openArea($event)" />

        <p class="search-disclaimer">
          Search by town, suburb, school, landmark, or community. Times may vary by +/- 30 minutes.
        </p>
      </section>
    </main>
  `,
})
export class HomeComponent {
  constructor(private readonly router: Router) {}

  openArea(area: Area): void {
    void this.router.navigate(['/area', area.id]);
  }
}
