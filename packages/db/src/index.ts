export * from './client';
import * as repo from './ticketsRepo';

console.log('DEBUG [db/index.ts]: Module initialized, listTicketsForOwner type:', typeof repo.listTicketsForOwner);

export { ticketRepo, ticketWriter, getPublicTicketById, listTicketsForOwner } from './ticketsRepo';
export type { PublicTicketView, TicketListItemDto } from './ticketsRepo';
