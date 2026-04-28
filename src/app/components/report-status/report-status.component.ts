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
      <section id="report" class="report-card report-entry-card">
        <div class="section-head">
          <h2>Community power check</h2>
          <span>{{ area.name }} · Group {{ area.group }}</span>
        </div>
        <p>Help neighbors know what is really happening in your area.</p>
        <button type="button" class="open-report-button" (click)="open()">Send live report</button>
      </section>

      @if (isOpen()) {
        <div class="report-modal-backdrop" (click)="close()">
          <section class="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title" (click)="$event.stopPropagation()">
            <button type="button" class="modal-close" aria-label="Close report modal" (click)="close()">x</button>
            <div class="modal-kicker">Live report</div>
            <h2 id="report-title">What is happening in {{ area.name }}?</h2>
            <p class="modal-subtitle">Your anonymous report updates the community status for Group {{ area.group }}.</p>

            <div class="report-actions modal-actions">
              <button type="button" class="on" [class.selected]="selectedStatus() === 'ON'" (click)="selectedStatus.set('ON')">Power is ON</button>
              <button type="button" class="off" [class.selected]="selectedStatus() === 'OFF'" (click)="selectedStatus.set('OFF')">Power is OFF</button>
            </div>

            <label for="report-comment">Optional comment</label>
            <textarea
              id="report-comment"
              [(ngModel)]="comment"
              rows="4"
              maxlength="280"
              placeholder="Example: Lights came back 10 minutes ago"
            ></textarea>

            @if (message()) {
              <p class="saved-message">{{ message() }}</p>
            }

            <button type="button" class="submit-report-button" [disabled]="isSaving() || !selectedStatus()" (click)="submit()">
              {{ isSaving() ? 'Sending report...' : 'Submit report' }}
            </button>
          </section>
        </div>
      }
    }
  `,
})
export class ReportStatusComponent {
  @Input({ required: true }) area!: Area;
  @Output() reported = new EventEmitter<void>();
  comment = '';
  message = signal('');
  isOpen = signal(false);
  isSaving = signal(false);
  selectedStatus = signal<PowerStatus | null>(null);

  constructor(private readonly reports: ReportService) {}

  open(): void {
    this.message.set('');
    this.selectedStatus.set(null);
    this.isOpen.set(true);
  }

  close(): void {
    if (this.isSaving()) return;
    this.isOpen.set(false);
  }

  async submit(): Promise<void> {
    const status = this.selectedStatus();
    if (!status) return;

    this.isSaving.set(true);
    await this.reports.submit(this.area, status, this.comment);
    this.comment = '';
    this.message.set('Report saved. Community status has been updated.');
    this.reported.emit();
    this.isSaving.set(false);
    setTimeout(() => this.isOpen.set(false), 700);
  }
}
