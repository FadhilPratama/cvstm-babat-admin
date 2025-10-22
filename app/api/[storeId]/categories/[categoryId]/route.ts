import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

// ==========================================================
// GET SINGLE CATEGORY
// ==========================================================
export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
    try {
        const { storeId, categoryId } = await params;

        if (!storeId) {
            return NextResponse.json({ error: "Store id dibutuhkan" }, { status: 400 });
        }
        if (!categoryId) {
            return NextResponse.json({ error: "Category id dibutuhkan" }, { status: 400 });
        }

        const category = await db.category.findUnique({
            where: { id: categoryId, storeId },
            include: { banner: true },
        });

        if (!category) {
            return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORY_GET]", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
    }
}

// ==========================================================
// UPDATE CATEGORY
// ==========================================================
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();
        const { storeId, categoryId } = await params;

        const { name, bannerId } = body;

        if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        if (!storeId) return NextResponse.json({ error: "Store id dibutuhkan" }, { status: 400 });
        if (!categoryId) return NextResponse.json({ error: "Category id dibutuhkan" }, { status: 400 });
        if (!name) return NextResponse.json({ error: "Harus menginput name" }, { status: 400 });
        if (!bannerId) return NextResponse.json({ error: "Harus menginput bannerId" }, { status: 400 });

        const storeByUserId = await db.store.findFirst({
            where: { id: storeId, userId },
        });
        if (!storeByUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const updatedCategory = await db.category.update({
            where: { id: categoryId },
            data: { name, bannerId },
        });

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error("[CATEGORY_PATCH]", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
    }
}

// ==========================================================
// DELETE CATEGORY
// ==========================================================
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string; categoryId: string }> }
) {
    try {
        const { userId } = await auth();
        const { storeId, categoryId } = await params;

        if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        if (!storeId) return NextResponse.json({ error: "Store id dibutuhkan" }, { status: 400 });
        if (!categoryId) return NextResponse.json({ error: "Category id dibutuhkan" }, { status: 400 });

        const storeByUserId = await db.store.findFirst({
            where: { id: storeId, userId },
        });
        if (!storeByUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const deletedCategory = await db.category.delete({
            where: { id: categoryId },
        });

        return NextResponse.json(deletedCategory);
    } catch (error) {
        console.error("[CATEGORY_DELETE]", error);
        return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
    }
}
