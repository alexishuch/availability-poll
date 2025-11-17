import { ConflictException } from "@nestjs/common";
import { IAvailability } from "./models/availabilities.interface";
import { Availability } from "./models/availability.entity";

export function formatDateToPGSlotRange(slotStart: Date, slotEnd: Date): string {
  // toISOString returns the date in UTC format
  const start = slotStart.toISOString();
  const end = slotEnd.toISOString();
  return `{["${start}","${end}")}`;
}

export function deserializeAvailability(availability: Availability): IAvailability {
  const match = availability.slot.match(/\["(.*?)","(.*?)"\)/);
  if (!match) {
    throw new ConflictException('Unable to deserialize availability slot');
  }
  const [, slotStartRaw, slotEndRaw] = match;

  return {
    id: availability.id,
    slot_start: new Date(slotStartRaw),
    slot_end: new Date(slotEndRaw),
    participantId: availability.participant.id,
  };
}