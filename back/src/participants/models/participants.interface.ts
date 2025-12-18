export interface IParticipant {
  id: string;
  name: string;
}

export interface ICreateParticipant extends Pick<IParticipant, 'name'> {
  pollId: string;
}