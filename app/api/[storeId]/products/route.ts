import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

type ContextParams = {
    params: {
        storeId: string;
    };
};

// ===========================================
// CREATE PRODUCT (POST) — hanya untuk user login
// ===========================================
export async function POST(req: Request, context: unknown) {
    try {
        const { userId } = await auth();
        const { storeId } = (context as ContextParams).params;
        const body = await req.json();

        const {
            name,
            categoryId,
            images,
            isFeatured,
            isArchived,
            description,
            activeIngredients,
            netWeight,
            manufacturer,
            shelfLife,
            packaging,
        } = body;

        // ===== Validasi dasar =====
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!storeId) {
            return NextResponse.json({ error: "Store ID URL dibutuhkan" }, { status: 400 });
        }
        if (!name) {
            return NextResponse.json({ error: "Nama produk perlu diinput" }, { status: 400 });
        }
        if (!categoryId) {
            return NextResponse.json({ error: "Kategori perlu diinput" }, { status: 400 });
        }
        if (!images?.length) {
            return NextResponse.json({ error: "Image perlu diinput" }, { status: 400 });
        }

        // ===== Verifikasi kepemilikan store =====
        const store = await db.store.findFirst({
            where: { id: storeId, userId },
        });
        if (!store) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // ===== Verifikasi kategori =====
        const category = await db.category.findFirst({
            where: { id: categoryId, storeId },
        });
        if (!category) {
            return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
        }

        // ===== Create product =====
        const product = await db.product.create({
            data: {
                name,
                categoryId,
                storeId,
                isFeatured: !!isFeatured,
                isArchived: !!isArchived,
                description: description || null,
                activeIngredients: activeIngredients || null,
                netWeight: netWeight || null,
                manufacturer: manufacturer || null,
                shelfLife: shelfLife || null,
                packaging: packaging || null,
                images: {
                    createMany: {
                        data: images.map((img: { url: string }) => ({ url: img.url })),
                    },
                },
            },
            include: {
                images: true,
                category: true,
            },
        });

        return NextResponse.json(product);
    } catch (error: any) {
        console.error("[PRODUCTS_POST_ERROR]", error);
        return NextResponse.json(
            { error: `Terjadi kesalahan internal: ${error.message || error}` },
            { status: 500 }
        );
    }
}

// ===========================================
// GET PRODUCTS (GET) — publik tanpa auth
// ===========================================
export async function GET(req: Request, context: unknown) {
    try {
        const { searchParams } = new URL(req.url);
        const { storeId } = (context as ContextParams).params;

        const categoryId = searchParams.get("categoryId") || undefined;
        const isFeatured = searchParams.get("isFeatured");
        const query = searchParams.get("q") || undefined;

        console.log("StoreID:", storeId);
        console.log("Search params:", Object.fromEntries(searchParams));

        if (!storeId) {
            return NextResponse.json({ error: "Store ID URL dibutuhkan" }, { status: 400 });
        }

        const products = await db.product.findMany({
            where: {
                storeId,
                categoryId,
                isFeatured: isFeatured === "true" ? true : undefined,
                isArchived: false,
                ...(query
                    ? { name: { contains: query, mode: "insensitive" } }
                    : {}),
            },
            include: {
                images: true,
                category: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error("[PRODUCTS_GET_ERROR]", error);
        return NextResponse.json(
            { error: `Terjadi kesalahan internal: ${error.message || error}` },
            { status: 500 }
        );
    }
}
