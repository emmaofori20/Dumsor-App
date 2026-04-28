import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button type="button" class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="'Switch to ' + (theme.theme() === 'dark' ? 'light' : 'dark') + ' mode'">
      <span>{{ theme.theme() === 'dark' ? '☀' : '☾' }}</span>
      <strong>{{ theme.theme() === 'dark' ? 'Light' : 'Dark' }}</strong>
    </button>
  `,
})
export class ThemeToggleComponent {
  constructor(readonly theme: ThemeService) {}
}
