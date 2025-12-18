import { IParticipant } from "src/participants/models/participants.interface";

export interface IPoll {
  id: string;
  name: string;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
}

export interface IPollEnriched {
  participants: IParticipant[];
  commonSlots: ICommonSlot[];
}

export interface ICreatePoll {
  name: string;
  start_date?: Date;
  end_date?: Date;
}

export interface ICommonSlot {
  start_date: Date;
  end_date: Date;
  count: number;
  participants_names: string[];
}