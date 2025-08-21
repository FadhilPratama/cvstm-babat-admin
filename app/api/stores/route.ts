import { NextResponse } from "next/server";
import db from "@/lib/db";
import {auth} from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { name } = body;

        if (!userId) {
            return new NextResponse("Unauthorized user", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Nama toko perlu diinput", { status: 400 });
        }

        const store = await db.store.create({
            data: {
                name,
                userId,
            },
        });

        return NextResponse.json(store);
    } catch (error) {
        console.error("[STORES_POST]", error);
        return new NextResponse("internal error", { status: 500 });
    }
}
