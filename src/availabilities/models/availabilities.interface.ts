export interface IAvailability {
  id: number;
  slot_start: Date;
  slot_end: Date;
  participantId: number;
}

export interface ICreateAvailability extends Omit<IAvailability, 'id'> { }