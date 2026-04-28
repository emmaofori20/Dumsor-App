import { Injectable } from '@angular/core';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { Area, CommunitySummary, PowerReport, PowerStatus } from '../models/dumsor.models';
import { FirebaseService } from './firebase.service';

const STORAGE_KEY = 'dumsor-reports';
const DEVICE_KEY = 'dumsor-device-id';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly localReports$ = new BehaviorSubject<PowerReport[]>(this.readReports());

  constructor(private readonly firebase: FirebaseService) {}

  getDeviceId(): string {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  }

  async submit(area: Area, status: PowerStatus, comment = ''): Promise<void> {
    const report: PowerReport = {
      areaId: area.id,
      areaName: area.name,
      group: area.group,
      status,
      comment: comment.trim().slice(0, 280),
      createdAt: new Date(),
      deviceId: this.getDeviceId(),
    };

    this.saveLocal(report);

    if (this.firebase.db) {
      await addDoc(collection(this.firebase.db, 'reports'), {
        ...report,
        createdAt: serverTimestamp(),
      });
    }
  }

  async getSummary(area: Area): Promise<CommunitySummary> {
    let reports = this.localReports$.value.filter((report) => report.areaId === area.id);

    if (this.firebase.db) {
      const snapshot = await getDocs(
        query(
          collection(this.firebase.db, 'reports'),
          where('areaId', '==', area.id),
          orderBy('createdAt', 'desc'),
          limit(50),
        ),
      );
      reports = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          areaId: data['areaId'],
          areaName: data['areaName'],
          group: data['group'],
          status: data['status'],
          comment: data['comment'] ?? '',
          deviceId: data['deviceId'],
          createdAt: data['createdAt']?.toDate?.() ?? new Date(),
        } as PowerReport;
      });
    }

    const onCount = reports.filter((report) => report.status === 'ON').length;
    const offCount = reports.filter((report) => report.status === 'OFF').length;
    const lastReportedAt = reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt;
    const total = onCount + offCount;

    return {
      areaId: area.id,
      onCount,
      offCount,
      lastReportedAt,
      confidence: total >= 10 ? 'High' : total >= 4 ? 'Medium' : 'Low',
    };
  }

  private saveLocal(report: PowerReport): void {
    const reports = [report, ...this.localReports$.value].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    this.localReports$.next(reports);
  }

  private readReports(): PowerReport[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      return (JSON.parse(raw) as PowerReport[]).map((report) => ({
        ...report,
        createdAt: new Date(report.createdAt),
      }));
    } catch {
      return [];
    }
  }
}
