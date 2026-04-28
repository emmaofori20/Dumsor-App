import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TimetableService } from '../../services/timetable.service';

@Component({
  selector: 'app-today-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h2 class="text-lg font-bold text-white">Today’s schedule</h2>
      <div class="mt-3 grid gap-2">
        @for (slot of slots; track slot.date + slot.startLabel) {
          <div class="flex items-center justify-between gap-3 rounded-md bg-slate-800 px-3 py-3">
            <span class="text-sm text-slate-300">{{ slot.startLabel }} - {{ slot.endLabel }}</span>
            <span class="rounded bg-red-500 px-2 py-1 text-sm font-bold text-white">Group {{ slot.group }} OFF</span>
          </div>
        }
      </div>
    </section>
  `,
})
export class TodayScheduleComponent {
  slots;

  constructor(private readonly timetable: TimetableService) {
    this.slots = this.timetable.getTodaySchedules();
  }
}
