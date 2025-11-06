export interface IParticipant {
    id: number;
    name: string;
}

export interface ICreateParticipant {
    name: string;
    pollId?: number;
}