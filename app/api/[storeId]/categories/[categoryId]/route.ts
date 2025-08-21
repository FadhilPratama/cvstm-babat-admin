import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ categoryId: string }> }
) {
    try {
        const { categoryId } = await params;

        if (!categoryId) {
            return new NextResponse("Category id dibutuhkan", { status: 400 });
        }

        const category = await db.category.findUnique({
            where: {
                id: categoryId,
            },
            include: {
                banner: true
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log("[CATEGORY_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, categoryId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();

        const { name, bannerId } = body;

        const { storeId, categoryId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Harus menginput name", { status: 400 });
        }

        if (!bannerId) {
            return new NextResponse("Harus menginput bannerId", { status: 400 });
        }

        if (!storeId) {
            return new NextResponse("Store id dibutuhkan", { status: 400 });
        }

        if (!categoryId) {
            return new NextResponse("Category id dibutuhkan", { status: 400 });
        }

        const storeByUserId = await db.store.findFirst({
            where: {
                id: storeId,
                userId
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const category = await db.category.update({
            where: {
                id: categoryId,
            },
            data: {
                name,
                bannerId
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log("[CATEGORY_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, categoryId: string }> }
) {
    try {
        const { userId } = await auth();

        const { storeId, categoryId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!categoryId) {
            return new NextResponse("Category id dibutuhkan", { status: 400 });
        }

        if (!storeId) {
            return new NextResponse("Store id dibutuhkan", { status: 400 });
        }

        const storeByUserId = await db.store.findFirst({
            where: {
                id: storeId,
                userId
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const category = await db.category.delete({
            where: {
                id: categoryId,
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.log("[CATEGORY_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}