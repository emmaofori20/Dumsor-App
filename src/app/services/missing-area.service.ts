import { Injectable } from '@angular/core';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MissingAreaReport } from '../models/dumsor.models';
import { FirebaseService } from './firebase.service';

const STORAGE_KEY = 'dumsor-missing-areas';
const DEVICE_KEY = 'dumsor-device-id';

@Injectable({ providedIn: 'root' })
export class MissingAreaService {
  constructor(private readonly firebase: FirebaseService) {}

  async submit(query: string): Promise<void> {
    const report: MissingAreaReport = {
      query: query.trim().slice(0, 120),
      createdAt: new Date(),
      deviceId: this.getDeviceId(),
    };

    if (!report.query) return;

    this.saveLocal(report);

    if (this.firebase.db) {
      await addDoc(collection(this.firebase.db, 'missingAreas'), {
        ...report,
        createdAt: serverTimestamp(),
      });
    }
  }

  private saveLocal(report: MissingAreaReport): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as MissingAreaReport[]) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([report, ...existing].slice(0, 100)));
  }

  private getDeviceId(): string {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  }
}
