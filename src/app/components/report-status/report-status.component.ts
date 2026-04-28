import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Area, PowerStatus } from '../../models/dumsor.models';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (area) {
      <section id="report" class="report-card">
        <div class="section-head">
          <h2>Is this correct for your area?</h2>
          <span>{{ area.name }} · Group {{ area.group }}</span>
        </div>

        <div class="report-actions">
          <button type="button" class="on" (click)="submit('ON')">✓ Yes, it is ON</button>
          <button type="button" class="off" (click)="submit('OFF')">✕ No, it is OFF</button>
        </div>

        <textarea
          id="report-comment"
          [(ngModel)]="comment"
          rows="3"
          maxlength="280"
          placeholder="Optional comment"
        ></textarea>

        @if (message()) {
          <p class="saved-message">{{ message() }}</p>
        }
      </section>
    }
  `,
})
export class ReportStatusComponent {
  @Input({ required: true }) area!: Area;
  @Output() reported = new EventEmitter<void>();
  comment = '';
  message = signal('');

  constructor(private readonly reports: ReportService) {}

  async submit(status: PowerStatus): Promise<void> {
    await this.reports.submit(this.area, status, this.comment);
    this.comment = '';
    this.message.set('Report saved. Community status has been updated.');
    this.reported.emit();
  }
}
