export declare const TICKET_STATUSES: readonly ["pending", "approved", "paid", "rejected"];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export declare function isTicketStatus(x: string): x is TicketStatus;
export type Ticket = {
    id: string;
    status: TicketStatus;
};
/**
 * Domain error for invalid state transitions.
 * Keep it simple and explicit (no frameworks).
 */
export declare class TicketTransitionError extends Error {
    readonly from: TicketStatus;
    readonly to: TicketStatus;
    constructor(from: TicketStatus, to: TicketStatus, message?: string);
}
export declare function canTransition(from: TicketStatus, to: TicketStatus): boolean;
export declare function assertTransition(from: TicketStatus, to: TicketStatus): void;
/**
 * Pure transition function: returns a new Ticket with updated status.
 * Does NOT persist anything.
 */
export declare function transitionTicket(ticket: Ticket, to: TicketStatus): Ticket;
/**
 * Guard helpers (explicit intent, easy to grep)
 */
export declare function assertPending(ticket: Ticket): void;
export declare function assertApproved(ticket: Ticket): void;
/**
 * Convenience domain operations (readable in use-cases)
 */
export declare function approve(ticket: Ticket): Ticket;
export declare function reject(ticket: Ticket): Ticket;
export declare function markPaid(ticket: Ticket): Ticket;
/**
 * Idempotent version of markPaid: if already paid, returns as-is.
 * Otherwise attempts transition.
 */
export declare function markPaidIdempotent(ticket: Ticket): Ticket;
export type EvidenceInput = {
    platform: string;
    text: string;
    evidenceAt: Date;
    evidenceUrl?: string;
    assetUrl?: string;
};
export type CreateTicketInput = {
    ownerUserId: string;
    evidence: EvidenceInput;
    pricing?: {
        priceCents?: number;
        currency?: string;
    };
};
export type CreatedTicket = {
    id: string;
    status: TicketStatus;
    ownerUserId: string;
    priceCents: number | null;
    currency: string;
    platform: string;
    evidenceText: string;
    evidenceAt: Date;
    evidenceUrl: string | null;
    assetUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
};
/**
 * The only DB capability the domain needs for ticket creation.
 * Implemented in packages/db. Domain does not know Prisma exists.
 */
export interface TicketWriter {
    createTicket(data: {
        ownerUserId: string;
        status: TicketStatus;
        priceCents: number | null;
        currency: string;
        platform: string;
        evidenceText: string;
        evidenceAt: Date;
        evidenceUrl: string | null;
        assetUrl: string | null;
    }): Promise<CreatedTicket>;
}
export declare function createTicketFromEvidence(repo: TicketWriter, input: CreateTicketInput): Promise<CreatedTicket>;
export interface TicketReader {
    getTicketById(id: string): Promise<CreatedTicket | null>;
}
export interface TicketUpdater {
    updateTicketStatus(id: string, status: TicketStatus): Promise<CreatedTicket>;
}
/**
 * Approve a ticket. Allowed only from:
 * - pending -> approved
 */
export declare function approveTicket(repo: TicketReader & TicketUpdater, ticketId: string): Promise<CreatedTicket>;
