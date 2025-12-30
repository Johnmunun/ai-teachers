import { AccessToken } from 'livekit-server-sdk';

export async function createToken(roomName: string, participantName: string, role: 'teacher' | 'student') {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set');
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        ttl: '1h',
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: role === 'teacher',
        canSubscribe: true,
        // Teachers can publish everything, students can only subscribe (and maybe publish generic data if needed)
        canPublishData: true,
    });

    return await at.toJwt();
}
