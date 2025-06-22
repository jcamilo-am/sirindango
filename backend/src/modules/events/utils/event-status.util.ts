export type EventState = 'SCHEDULED' | 'ACTIVE' | 'CLOSED';

export function getEventStatus(event: {
  startDate: Date;
  endDate: Date;
  state: string;
}): EventState {
  if (event.state === 'CLOSED') return 'CLOSED';
  const now = new Date();
  if (now < event.startDate) return 'SCHEDULED';
  if (now > event.endDate) return 'CLOSED'; // O 'FINISHED' si prefieres, pero usa 'CLOSED' para bloquear lógica
  return 'ACTIVE';
}
