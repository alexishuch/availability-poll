export interface IParticipant {
  id: number;
  name: string;
}

export interface ICreateParticipant extends Pick<IParticipant, 'name'> {
  pollId: number;
}