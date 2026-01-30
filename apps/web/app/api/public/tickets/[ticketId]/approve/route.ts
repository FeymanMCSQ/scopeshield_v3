
import { NextResponse } from 'next/server';
import { tickets } from '@scopeshield/domain';
import { ticketRepo } from '@scopeshield/db';

export const runtime = 'nodejs';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    try {
        const { ticketId } = await params;

        // Domain logic enforces state transition (Pending -> Approved)
        await tickets.approveTicket(ticketRepo, ticketId);

        // Redirect back to the public ticket page
        const url = new URL(req.url);
        const origin = url.origin;

        return new Response(null, {
            status: 303,
            headers: {
                Location: `${origin}/t/${ticketId}`
            },
        });

    } catch (e: any) {
        console.error('Approval error:', e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
