import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserService } from '@/services/user.service';

const fcmTokenSchema = z.object({
  uid: z.string().min(1, 'uid is required'),
  fcmToken: z.string().min(1, 'fcmToken is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Validate request body using Zod
    const parsed = fcmTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { uid, fcmToken } = parsed.data;

    // Delegate database action to UserService
    const success = await UserService.registerFcmToken(uid, fcmToken);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token registered successfully.',
    });
  } catch (error: any) {
    console.error('[users/fcm-token] Error updating token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

