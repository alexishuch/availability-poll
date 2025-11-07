import { ConflictException } from "@nestjs/common";
import { IAvailability } from "./models/availabilities.interface";
import { Availability } from "./models/availability.entity";

export function convertDatetoPgTimestamptz(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '+00')
};

export function convertPgTimestamptzToDate(value: string, formatDate: boolean): Date {
  const normalized = formatDate ? value.slice(1, -1) : value;
  return new Date(normalized);
};

export function deserializeAvailability(availability: Availability, formatDate: boolean): IAvailability {
  const range = availability.slot.replace(/[{}]/g, '');
  const match = range.match(/\[(.*?),(.*)\)/);

  if (!match) {
    throw new ConflictException('Unable to deserialize availability slot');
  }

  const [, slotStartRaw, slotEndRaw] = match;

  return {
    id: availability.id,
    slot_start: convertPgTimestamptzToDate(slotStartRaw, formatDate),
    slot_end: convertPgTimestamptzToDate(slotEndRaw, formatDate),
    participantId: availability.participant.id,
  };
}