import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const name = body.name;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Harus menginput nama", { status: 400 });
        }

        const { storeId } = await params;

        if (!storeId) {
            return new NextResponse("Store id dibutuhkan", { status: 400 });
        }

        const store = await db.store.updateMany({
            where: { id: storeId, userId },
            data: { name },
        });

        return NextResponse.json(store);
    } catch (error) {
        console.log("[STORE_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        const { storeId } = await params;

        if (!storeId) {
            return new NextResponse("Store id dibutuhkan", { status: 400 });
        }

        const store = await db.store.deleteMany({
            where: { id: storeId, userId },
        });

        return NextResponse.json(store);
    } catch (error) {
        console.log("[STORE_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
