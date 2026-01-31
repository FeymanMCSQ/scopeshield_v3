
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@scopeshield/db/src/client'; // Direct access for now or add to repo

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, type } = await req.json();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Basic spam prevention: check recent feedback from this user
        // (Optional, can be added later)

        const feedback = await prisma.feedback.create({
            data: {
                userId: user.id,
                message: message.trim(),
                type: type || 'feedback',
            },
        });

        // Optional: Send alert to admin (e.g. Email/Slack)
        // For now, just store it.

        return NextResponse.json({ ok: true, id: feedback.id });
    } catch (error: any) {
        console.error('Feedback error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
