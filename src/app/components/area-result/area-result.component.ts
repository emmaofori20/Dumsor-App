import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AreaStatus } from '../../models/dumsor.models';

@Component({
  selector: 'app-area-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (status) {
      <section class="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-wide text-slate-400">{{ status.area.region }} · Group {{ status.area.group }}</p>
            <h2 class="mt-1 text-2xl font-bold text-white">{{ status.area.name }}</h2>
          </div>
          <span class="rounded px-3 py-1 text-sm font-bold" [class.bg-red-500]="status.status === 'OFF'" [class.bg-emerald-400]="status.status === 'ON'" [class.text-slate-950]="status.status === 'ON'">
            {{ status.status }}
          </span>
        </div>

        @if (status.currentOutage) {
          <div class="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3">
            <p class="text-sm font-semibold text-red-200">Current outage window</p>
            <p class="mt-1 text-lg text-white">{{ status.currentOutage.startLabel }} - {{ status.currentOutage.endLabel }}</p>
            <p class="mt-2 text-sm text-slate-300">Expected on: {{ status.currentOutage.endLabel }}, may return between {{ status.currentOutage.endBuffer }}</p>
          </div>
        } @else {
          <div class="mt-4 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3">
            <p class="text-sm font-semibold text-emerald-200">Power is expected to be ON now</p>
            <p class="mt-1 text-sm text-slate-300">Next restoration time shown below is for the next scheduled outage.</p>
          </div>
        }

        <dl class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-md bg-slate-800 p-3">
            <dt class="text-sm text-slate-400">Next outage</dt>
            <dd class="mt-1 font-semibold text-white">{{ status.nextOutage.startLabel }} - {{ status.nextOutage.endLabel }}</dd>
            <dd class="mt-1 text-sm text-amber-200">Expected off: {{ status.nextOutage.startLabel }}, may start between {{ status.nextOutage.startBuffer }}</dd>
          </div>
          <div class="rounded-md bg-slate-800 p-3">
            <dt class="text-sm text-slate-400">Next restoration</dt>
            <dd class="mt-1 font-semibold text-white">{{ status.restorationLabel }}</dd>
            <dd class="mt-1 text-sm text-amber-200">Expected on: {{ status.restorationLabel }}, may return between {{ status.nextOutage.endBuffer }}</dd>
          </div>
        </dl>
      </section>
    }
  `,
})
export class AreaResultComponent {
  @Input({ required: true }) status!: AreaStatus;
}
