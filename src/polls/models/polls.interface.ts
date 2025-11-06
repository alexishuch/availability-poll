import { IParticipant } from "src/participants/models/participants.interface";

export interface IPoll {
    id: number;
    name: string;
    start_date?: Date;
    end_date?: Date;
    created_at: Date;
}

export interface IPollEnriched extends IPoll {
    participants: IParticipant[];
    commonSlots: { segment: string; cnt: number }[];
}

export interface ICreatePoll {
    name: string;
    start_date?: Date;
    end_date?: Date;
}