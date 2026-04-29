import { CommonModule } from '@angular/common';
import { Component, ViewChild, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Area, AreaStatus, PowerWindow } from '../../models/dumsor.models';
import { AreaService } from '../../services/area.service';
import { TimetableService } from '../../services/timetable.service';
import { CommunityReportsComponent } from '../community-reports/community-reports.component';
import { ReportStatusComponent } from '../report-status/report-status.component';
import { SearchComponent } from '../search/search.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-area-page',
  standalone: true,
  imports: [CommonModule, SearchComponent, ReportStatusComponent, CommunityReportsComponent, ThemeToggleComponent],
  template: `
    <main class="app-shell">
      <div class="result-frame">
        <header class="result-topbar">
          <a class="mini-brand" href="/">
            <span>D</span>
            <strong>Dumsor Timetable</strong>
          </a>
          <app-theme-toggle />
          <div class="result-search">
            <app-search [showLocationButton]="false" [showMissingAreaReport]="false" (areaSelected)="openArea($event)" />
          </div>
        </header>

        @if (selectedStatus(); as status) {
          <section class="area-hero">
            <div>
              <p class="eyebrow">{{ status.area.region }} feeder zone</p>
              <h1>{{ status.area.name }}</h1>
              <p>Load Management - Apr 25 to May 1, 2026</p>
            </div>
            <div class="group-badge">
              <span>Group</span>
              <strong>{{ status.area.group }}</strong>
            </div>
            <button type="button" (click)="focusSearch()">Change area</button>
          </section>

          <section id="status" class="status-card" [class.is-off]="status.status === 'OFF'">
            <div class="status-glow"></div>
            <div class="status-row">
              <div class="power-ring">{{ status.status }}</div>
              <div>
                <span class="status-pill">{{ status.status === 'ON' ? 'Grid supply expected' : 'Load shed window' }}</span>
                <h2>Power is {{ status.status }}</h2>
                @if (status.currentOutage) {
                  <p>Current outage: {{ status.currentOutage.startLabel }} - {{ status.currentOutage.endLabel }}</p>
                } @else {
                  <p>Next outage: {{ status.nextOutage.startLabel }} - {{ status.nextOutage.endLabel }}</p>
                }
              </div>
            </div>

            <div class="time-grid">
              <div>
                <span>Expected off</span>
                <strong>{{ status.nextOutage.startLabel }}</strong>
                <small>{{ status.nextOutage.startBuffer }}</small>
              </div>
              <div>
                <span>Expected on</span>
                <strong>{{ status.restorationLabel }}</strong>
                <small>{{ status.currentOutage?.endBuffer ?? status.nextOutage.endBuffer }}</small>
              </div>
            </div>
          </section>

          <section class="alert-card">
            <span class="alert-icon">+/-30</span>
            <div>
              <h2>Operational timing buffer</h2>
              <p>Actual outage and restoration times may vary by +/- 30 minutes or more.</p>
            </div>
          </section>

          <section class="week-card">
            <div class="section-head">
              <h2>This week</h2>
              <span>Published timetable</span>
            </div>
            <div class="week-strip">
              @for (day of weekDays; track day.date) {
                <button
                  type="button"
                  class="day-tile"
                  [class.today]="day.isToday"
                  [class.selected]="selectedDate() === day.date"
                  [attr.aria-pressed]="selectedDate() === day.date"
                  (click)="selectDate(day.date)"
                >
                  <span>{{ day.weekday }}</span>
                  <strong>{{ day.day }}</strong>
                  <small>*</small>
                </button>
              }
            </div>
            <div class="schedule-panel">
              <div class="schedule-panel-head">
                <div>
                  <span>Selected day</span>
                  <strong>{{ selectedDateLabel() }}</strong>
                </div>
                <em>{{ status.area.name }} · Group {{ status.area.group }}</em>
              </div>

              @if (selectedDaySchedules(); as slots) {
                @if (slots.length) {
                  <div class="schedule-list">
                    @for (slot of slots; track slot.date + slot.startLabel) {
                      <div class="schedule-slot">
                        <span>OFF</span>
                        <div>
                          <strong>{{ slot.startLabel }} - {{ slot.endLabel }}</strong>
                          <small>{{ slot.startBuffer }} to {{ slot.endBuffer }}</small>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="schedule-empty">No outage is scheduled for this area on this date.</p>
                }
              }
            </div>
          </section>

          <app-report-status [area]="status.area" (reported)="community.refresh()" />
          <app-community-reports #community [area]="status.area" />
        } @else {
          <section class="empty-card">
            <h1>Area not found</h1>
            <p>Search again or choose a popular place.</p>
          </section>
        }

        <footer class="site-credit result-credit">
          Built by <a href="https://github.com/emmaofori20" target="_blank" rel="noopener noreferrer">Emma Ofori</a>
        </footer>
      </div>
    </main>
  `,
})
export class AreaPageComponent {
  @ViewChild('community') community?: CommunityReportsComponent;
  selectedArea = signal<Area | undefined>(undefined);
  selectedStatus = computed<AreaStatus | null>(() => {
    const area = this.selectedArea();
    return area ? this.timetable.getAreaStatus(area) : null;
  });
  weekDays: Array<{ date: string; weekday: string; day: number; isToday: boolean }>;
  selectedDate = signal('');
  selectedDaySchedules = computed<PowerWindow[]>(() => {
    const area = this.selectedArea();
    const date = this.selectedDate();
    if (!area || !date) return [];

    return this.timetable.getGroupWindows(area.group).filter((window) => window.date === date);
  });
  selectedDateLabel = computed(() => {
    const date = this.selectedDate();
    if (!date) return 'Choose a day';

    return new Intl.DateTimeFormat('en-GH', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${date}T00:00:00`));
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly areas: AreaService,
    private readonly timetable: TimetableService,
  ) {
    this.weekDays = this.timetable.schedules
      .filter((schedule) => schedule.startTime === '00:00')
      .map((schedule) => {
        const date = new Date(`${schedule.date}T00:00:00`);
        const today = new Date();
        return {
          date: schedule.date,
          weekday: new Intl.DateTimeFormat('en-GH', { weekday: 'short' }).format(date).toUpperCase(),
          day: date.getDate(),
          isToday: date.toDateString() === today.toDateString(),
        };
      });
    this.selectedDate.set(this.weekDays.find((day) => day.isToday)?.date ?? this.weekDays[0]?.date ?? '');

    this.route.paramMap.subscribe((params) => {
      this.selectedArea.set(this.areas.findById(params.get('id') ?? ''));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  openArea(area: Area): void {
    void this.router.navigate(['/area', area.id]);
  }

  focusSearch(): void {
    const input = document.getElementById('area-search') as HTMLInputElement | null;
    input?.focus();
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  focusReport(): void {
    const report = document.getElementById('report');
    const comment = document.getElementById('report-comment') as HTMLTextAreaElement | null;
    report?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => comment?.focus(), 300);
  }

  async share(status: AreaStatus): Promise<void> {
    const text = `${status.area.name} is expected to be ${status.status}. Next outage: ${status.nextOutage.startLabel} - ${status.nextOutage.endLabel}.`;
    if (navigator.share) {
      await navigator.share({ title: 'Dumsor Timetable Ghana', text }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(text).catch(() => undefined);
  }
}
