import { ConflictException } from "@nestjs/common";
import { IAvailability } from "./models/availabilities.interface";
import { Availability } from "./models/availability.entity";

export function deserializeAvailability(availability: Availability): IAvailability {
  const range = availability.slot.replace(/[{}]/g, '');
  const match = range.match(/\["(.*?)","(.*?)"\)/);

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