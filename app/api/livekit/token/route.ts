import { NextResponse } from 'next/server';
import { createToken } from '@/lib/livekit';

export async function GET(req: Request) {
    let searchParams = new URLSearchParams();
    try {
      if (req.url) {
        const url = new URL(req.url);
        searchParams = url.searchParams;
      }
    } catch (error) {
      console.warn('Failed to parse URL from request:', error);
    }
    const room = searchParams.get('room');
    const username = searchParams.get('username');
    const role = searchParams.get('role');

    if (!room || !username || !role) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const token = await createToken(room, username, role as 'teacher' | 'student');
        return NextResponse.json({ token });
    } catch (error) {
        console.error('Token generation error:', error);
        return NextResponse.json({ error: 'Failed to generate token', details: (error as Error).message }, { status: 500 });
    }
}
