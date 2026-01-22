import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ticketRepo } from '@scopeshield/db';
import { tickets } from '@scopeshield/domain';

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;

    if (!description || !priceStr) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const priceCents = Math.round(parseFloat(priceStr) * 100);

    // Business Logic: Create ticket
    const ticket = await tickets.createTicketFromEvidence(ticketRepo, {
      ownerUserId: session.id,
      evidence: {
        platform: 'manual',
        text: description,
        evidenceAt: new Date(), // Now
        // No external URLs for manual creation
      },
      pricing: {
        currency: 'USD',
        priceCents: priceCents,
      },
    });

    // Handle redirect manually since we are in an API route
    return new Response(null, {
      status: 303,
      headers: { Location: '/dashboard' },
    });

  } catch (error: any) {
    console.error('Ticket creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
