import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const orgIdParam = searchParams.get('orgId');

    if (!uid && !orgIdParam) {
      return NextResponse.json(
        { success: false, error: 'Query parameter uid or orgId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    let orgId = orgIdParam;

    if (uid && !orgId) {
      const userSnap = await db.collection('users').doc(uid).get();
      if (!userSnap.exists) {
        return NextResponse.json(
          { success: false, error: 'User profile not found' },
          { status: 404 }
        );
      }
      const userData = userSnap.data();
      orgId = userData?.orgId || null;

      if (!orgId) {
        return NextResponse.json({
          success: true,
          joined: false,
          organization: null,
        });
      }
    }

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'No organization ID found' },
        { status: 400 }
      );
    }

    const orgSnap = await db.collection('organizations').doc(orgId).get();
    if (!orgSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgSnap.data();
    const organization: any = { id: orgSnap.id, ...orgData };

    // Fetch members in this organization
    const membersSnap = await db.collection('users')
      .where('orgId', '==', orgId)
      .get();

    const members: any[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]!;

    // Iterate through members and compute metrics
    for (const doc of membersSnap.docs) {
      const u = doc.data();
      
      // Calculate carbon saved this month (using similar logic to leaderboards)
      const logsSnap = await db.collection('users').doc(u.uid).collection('logs')
        .where('activityDate', '>=', startOfMonth)
        .get();

      let monthlyEmissions = 0;
      logsSnap.forEach((logDoc: any) => {
        monthlyEmissions += logDoc.data().kgCo2e || 0;
      });

      const baselineMonthly = (u.baselineKgCo2ePerYear || 4800) / 12;
      let saved = Math.max(0, baselineMonthly - monthlyEmissions);
      if (monthlyEmissions === 0) {
        saved = (u.streakDays || 0) * 1.8 + (u.points % 15);
      }
      saved = Math.round(saved * 10) / 10;

      members.push({
        uid: u.uid,
        displayName: u.displayName || u.email?.split('@')[0] || 'Anonymous',
        photoURL: u.photoURL || null,
        points: u.points || 0,
        streakDays: u.streakDays || 0,
        orgRole: u.orgRole || 'member',
        department: u.department || 'General',
        kgCo2eSavedThisMonth: saved,
      });
    }

    // Sort member leaderboard by carbon saved then by points
    const memberLeaderboard = [...members].sort((a, b) => b.kgCo2eSavedThisMonth - a.kgCo2eSavedThisMonth || b.points - a.points);

    // Aggregate stats by department
    const deptMap: Record<string, { department: string; membersCount: number; totalKgCo2eSaved: number; totalPoints: number }> = {};
    let totalKgCo2eSavedOrg = 0;

    members.forEach((m) => {
      const dept = m.department;
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          membersCount: 0,
          totalKgCo2eSaved: 0,
          totalPoints: 0,
        };
      }
      deptMap[dept].membersCount += 1;
      deptMap[dept].totalKgCo2eSaved += m.kgCo2eSavedThisMonth;
      deptMap[dept].totalPoints += m.points;
      totalKgCo2eSavedOrg += m.kgCo2eSavedThisMonth;
    });

    // Round department saved carbon
    const departmentStats = Object.values(deptMap).map(d => ({
      ...d,
      totalKgCo2eSaved: Math.round(d.totalKgCo2eSaved * 10) / 10,
    })).sort((a, b) => b.totalKgCo2eSaved - a.totalKgCo2eSaved);

    totalKgCo2eSavedOrg = Math.round(totalKgCo2eSavedOrg * 10) / 10;

    // Check if the current cached total carbon saved matches, update if not
    if (orgData?.totalKgCo2eSaved !== totalKgCo2eSavedOrg) {
      await db.collection('organizations').doc(orgId).update({
        totalKgCo2eSaved: totalKgCo2eSavedOrg,
      });
      organization.totalKgCo2eSaved = totalKgCo2eSavedOrg;
    }

    return NextResponse.json({
      success: true,
      joined: true,
      organization,
      departmentStats,
      memberLeaderboard,
    });
  } catch (error: any) {
    console.error('[organizations] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorUid, name } = body;

    if (!creatorUid || !name) {
      return NextResponse.json(
        { success: false, error: 'Both creatorUid and name are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify creator profile
    const userSnap = await db.collection('users').doc(creatorUid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Creator user profile not found' },
        { status: 404 }
      );
    }

    // Generate unique invite code for the organization
    let inviteCode = '';
    let isUnique = false;
    for (let i = 0; i < 5; i++) {
      inviteCode = `ORG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const codeCheck = await db.collection('organizations').where('inviteCode', '==', inviteCode).get();
      if (codeCheck.empty) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      inviteCode = `ORG-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const orgRef = db.collection('organizations').doc();
    const organization = {
      id: orgRef.id,
      name,
      creatorUid,
      inviteCode,
      memberUids: [creatorUid],
      createdAt: new Date().toISOString(),
      totalKgCo2eSaved: 0,
    };

    await orgRef.set(organization);

    // Update creator profile
    await db.collection('users').doc(creatorUid).update({
      orgId: orgRef.id,
      orgRole: 'admin',
      department: 'Executive', // Default department for corporate admins
    });

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      organization,
    });
  } catch (error: any) {
    console.error('[organizations] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
