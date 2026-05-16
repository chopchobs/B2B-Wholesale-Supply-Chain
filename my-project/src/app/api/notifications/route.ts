import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/server/actions/notifications";

interface PatchBody {
  id?: string;
  all?: boolean;
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [listRes, countRes] = await Promise.all([
      getNotifications(user.id),
      getUnreadCount(user.id),
    ]);

    if (listRes.error || countRes.error) {
      return NextResponse.json(
        { data: null, error: listRes.error ?? countRes.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        notifications: listRes.data ?? [],
        unreadCount: countRes.data ?? 0,
      },
      error: null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch notifications.";
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as PatchBody;

    if (body.all) {
      const res = await markAllAsRead(user.id);
      if (res.error) {
        return NextResponse.json(
          { data: null, error: res.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ data: res.data, error: null });
    }

    if (body.id) {
      const res = await markAsRead(body.id);
      if (res.error) {
        return NextResponse.json(
          { data: null, error: res.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ data: res.data, error: null });
    }

    return NextResponse.json(
      { data: null, error: "Provide 'id' or 'all: true'." },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update notification.";
    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
