import { PowerGroup, Schedule } from '../models/dumsor.models';
import { GENERATED_AREAS } from './generated-areas';

export const AREAS = GENERATED_AREAS;

const dates = ['2026-04-25', '2026-04-26', '2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30', '2026-05-01'];
const rotation: PowerGroup[][] = [
  ['C', 'A', 'B', 'C'],
  ['A', 'B', 'C', 'A'],
  ['B', 'C', 'A', 'B'],
  ['C', 'A', 'B', 'C'],
  ['A', 'B', 'C', 'A'],
  ['B', 'C', 'A', 'B'],
  ['C', 'A', 'B', 'C'],
];
const periods = [
  ['00:00', '06:00'],
  ['06:00', '12:00'],
  ['12:00', '18:00'],
  ['18:00', '24:00'],
];

export const SCHEDULES: Schedule[] = dates.flatMap((date, dateIndex) =>
  periods.map(([startTime, endTime], periodIndex) => ({
    id: `${date}-${startTime}`,
    date,
    group: rotation[dateIndex][periodIndex],
    startTime,
    endTime,
    status: 'OFF' as const,
  })),
);
