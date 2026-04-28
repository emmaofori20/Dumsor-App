import { Component } from '@angular/core';
import { AREAS, SCHEDULES } from '../../data/seed-data';

@Component({
  selector: 'app-admin-import',
  standalone: true,
  template: `
    <main class="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div class="mx-auto max-w-4xl">
        <a href="/" class="text-amber-300">Back</a>
        <h1 class="mt-4 text-3xl font-bold text-white">Admin import</h1>
        <p class="mt-2 text-slate-300">Use these objects to seed Firestore collections named areas and schedules.</p>
        <pre class="mt-4 max-h-[70vh] overflow-auto rounded-lg bg-slate-900 p-4 text-xs">{{ payload }}</pre>
      </div>
    </main>
  `,
})
export class AdminImportComponent {
  payload = JSON.stringify({ areas: AREAS, schedules: SCHEDULES }, null, 2);
}
