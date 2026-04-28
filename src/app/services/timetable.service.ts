import { Injectable } from '@angular/core';
import { Area, AreaStatus, PowerGroup, PowerWindow, Schedule } from '../models/dumsor.models';
import { SCHEDULES } from '../data/seed-data';

@Injectable({ providedIn: 'root' })
export class TimetableService {
  readonly schedules = SCHEDULES;

  getAreaStatus(area: Area, now = new Date()): AreaStatus {
    const groupWindows = this.getGroupWindows(area.group);
    const currentOutage = groupWindows.find((window) => now >= window.start && now < window.end);
    const nextOutage = groupWindows.find((window) => window.start > now) ?? groupWindows[0];

    return {
      area,
      status: currentOutage ? 'OFF' : 'ON',
      currentOutage,
      nextOutage,
      nextRestoration: currentOutage?.end ?? nextOutage.end,
      restorationLabel: this.formatTime(currentOutage?.end ?? nextOutage.end),
    };
  }

  getTodaySchedules(now = new Date()): PowerWindow[] {
    const date = this.toDateKey(now);
    return this.schedules
      .filter((schedule) => schedule.date === date)
      .map((schedule) => this.toWindow(schedule));
  }

  getGroupWindows(group: PowerGroup): PowerWindow[] {
    return this.schedules
      .filter((schedule) => schedule.group === group)
      .map((schedule) => this.toWindow(schedule))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GH', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  formatRelative(date?: Date): string {
    if (!date) return 'No reports yet';
    const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  private toWindow(schedule: Schedule): PowerWindow {
    const start = this.parseDateTime(schedule.date, schedule.startTime);
    const end = this.parseDateTime(schedule.date, schedule.endTime);

    return {
      date: schedule.date,
      group: schedule.group,
      start,
      end,
      startLabel: this.formatTime(start),
      endLabel: this.formatTime(end),
      startBuffer: this.formatBuffer(start),
      endBuffer: this.formatBuffer(end),
    };
  }

  private parseDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    if (time === '24:00') {
      return new Date(year, month - 1, day + 1, 0, 0, 0);
    }

    const [hour, minute] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0);
  }

  private formatBuffer(date: Date): string {
    const before = new Date(date.getTime() - 30 * 60000);
    const after = new Date(date.getTime() + 30 * 60000);
    return `${this.formatTime(before)} - ${this.formatTime(after)}`;
  }

  private toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
