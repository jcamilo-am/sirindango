import { EventState } from './types';

export interface EventStateInfo {
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canCreateInventoryMovements: boolean;
  canRegisterSales: boolean;
  canEditEvent: boolean;
  canCloseEvent: boolean;
  statusLabel: string;
  statusColor: 'gray' | 'blue' | 'green' | 'red';
  description: string;
}

export function getEventStateInfo(state: EventState): EventStateInfo {
  switch (state) {
    case EventState.SCHEDULED:
      return {
        canCreateProducts: true,
        canEditProducts: true,
        canCreateInventoryMovements: true,
        canRegisterSales: false,
        canEditEvent: true,
        canCloseEvent: false,
        statusLabel: 'No Iniciado',
        statusColor: 'gray',
        description: 'El evento aún no ha comenzado. Puedes crear productos y gestionar inventario.',
      };
    
    case EventState.ACTIVE:
      return {
        canCreateProducts: false,
        canEditProducts: false,
        canCreateInventoryMovements: false,
        canRegisterSales: true,
        canEditEvent: false,
        canCloseEvent: true,
        statusLabel: 'Activo',
        statusColor: 'green',
        description: 'El evento está en curso. Solo puedes registrar ventas.',
      };
    
    case EventState.CLOSED:
      return {
        canCreateProducts: false,
        canEditProducts: false,
        canCreateInventoryMovements: false,
        canRegisterSales: false,
        canEditEvent: false,
        canCloseEvent: false,
        statusLabel: 'Cerrado',
        statusColor: 'red',
        description: 'El evento ha finalizado. No se pueden realizar modificaciones.',
      };
    
    default:
      return {
        canCreateProducts: false,
        canEditProducts: false,
        canCreateInventoryMovements: false,
        canRegisterSales: false,
        canEditEvent: false,
        canCloseEvent: false,
        statusLabel: 'Desconocido',
        statusColor: 'gray',
        description: 'Estado del evento desconocido.',
      };
  }
}

export function getEventStatusFromDates(startDate: Date, endDate: Date, state: EventState): EventState {
  if (state === EventState.CLOSED) return EventState.CLOSED;
  
  const now = new Date();
  if (now < startDate) return EventState.SCHEDULED;
  if (now > endDate) return EventState.CLOSED;
  return EventState.ACTIVE;
}

export function validateEventAction(
  eventState: EventState,
  action: keyof EventStateInfo
): { allowed: boolean; message?: string } {
  const stateInfo = getEventStateInfo(eventState);
  const allowed = stateInfo[action] as boolean;
  
  if (!allowed) {
    let message = '';
    switch (action) {
      case 'canCreateProducts':
        message = 'No puedes crear productos en un evento activo o cerrado.';
        break;
      case 'canEditProducts':
        message = 'No puedes editar productos en un evento activo o cerrado.';
        break;
      case 'canCreateInventoryMovements':
        message = 'No puedes crear movimientos de inventario en un evento activo o cerrado.';
        break;
      case 'canRegisterSales':
        message = 'Solo puedes registrar ventas en eventos activos.';
        break;
      case 'canEditEvent':
        message = 'No puedes editar eventos que ya han iniciado o están cerrados.';
        break;
      case 'canCloseEvent':
        message = 'Solo puedes cerrar eventos que estén activos.';
        break;
    }
    return { allowed: false, message };
  }
  
  return { allowed: true };
} 