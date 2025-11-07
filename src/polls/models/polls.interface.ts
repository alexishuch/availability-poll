import { IParticipant } from "src/participants/models/participants.interface";

export interface IPoll {
  id: number;
  name: string;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
}

export interface IPollWithParticipants extends IPoll {
  participants: IParticipant[];
}

export interface IPollEnriched extends IPollWithParticipants {
  commonSlots: { segment: string; cnt: number }[];
}

export interface ICreatePoll {
  name: string;
  start_date?: Date;
  end_date?: Date;
}