import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, signal } from '@angular/core';
import { Area, CommunitySummary } from '../../models/dumsor.models';
import { ReportService } from '../../services/report.service';
import { TimetableService } from '../../services/timetable.service';

@Component({
  selector: 'app-community-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (summary(); as data) {
      <section class="community-card">
        <div class="section-head">
          <h2>Nearby reports</h2>
          <span>{{ data.confidence }} confidence</span>
        </div>
        <p>
          {{ data.offCount }} people near {{ area.name }} report lights are OFF.
          {{ data.onCount }} report ON.
        </p>
        <small>Last report: {{ relative(data.lastReportedAt) }}</small>
      </section>
    }
  `,
})
export class CommunityReportsComponent implements OnChanges {
  @Input({ required: true }) area!: Area;
  summary = signal<CommunitySummary | null>(null);

  constructor(
    private readonly reports: ReportService,
    private readonly timetable: TimetableService,
  ) {}

  ngOnChanges(): void {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.summary.set(await this.reports.getSummary(this.area));
  }

  relative(date?: Date): string {
    return this.timetable.formatRelative(date);
  }
}
