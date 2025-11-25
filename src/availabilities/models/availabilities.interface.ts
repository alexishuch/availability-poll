export interface IAvailability {
  id: string;
  slot_start: Date;
  slot_end: Date;
  participantId: string;
}

export interface ICreateAvailability extends Omit<IAvailability, 'id'> { }