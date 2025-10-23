import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

// ==========================================================
// GET SINGLE PRODUCT
// ==========================================================
export async function GET(
    _req: NextRequest,  // Fixed: Added underscore prefix
    context: { params: Promise<{ storeId: string; productId: string }> }
) {
    try {
        const { storeId, productId } = await context.params;

        if (!storeId || !productId) {
            return NextResponse.json(
                { error: "Store ID dan Product ID dibutuhkan" },
                { status: 400 }
            );
        }

        const product = await db.product.findUnique({
            where: { id: productId, storeId },
            include: { images: true, category: true },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Produk tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCT_GET_ERROR]", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan internal" },
            { status: 500 }
        );
    }
}

// ==========================================================
// PATCH
// ==========================================================
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ storeId: string; productId: string }> }
) {
    try {
        const { userId } = await auth();
        const { storeId, productId } = await context.params;
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

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!storeId || !productId) return NextResponse.json({ error: "Store ID dan Product ID dibutuhkan" }, { status: 400 });

        if (!name || !categoryId || !images?.length) {
            return NextResponse.json(
                { error: "Nama, kategori, dan gambar wajib diisi" },
                { status: 400 }
            );
        }

        const store = await db.store.findFirst({ where: { id: storeId, userId } });
        if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const category = await db.category.findFirst({ where: { id: categoryId, storeId } });
        if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });

        const existingProduct = await db.product.findFirst({ where: { id: productId, storeId } });
        if (!existingProduct) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

        // Fixed: Removed redundant 'await' before db.$transaction
        const updatedProduct = await db.$transaction(async (tx) => {
            await tx.image.deleteMany({ where: { productId } });

            // Fixed: Removed redundant 'await' in return statement
            return tx.product.update({
                where: { id: productId },
                data: {
                    name,
                    categoryId,
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
                include: { images: true, category: true },
            });
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("[PRODUCT_PATCH_ERROR]", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan internal" },
            { status: 500 }
        );
    }
}

// ==========================================================
// DELETE
// ==========================================================
export async function DELETE(
    _req: NextRequest,  // Fixed: Added underscore prefix
    context: { params: Promise<{ storeId: string; productId: string }> }
) {
    try {
        const { userId } = await auth();
        const { storeId, productId } = await context.params;

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!storeId || !productId) return NextResponse.json({ error: "Store ID dan Product ID dibutuhkan" }, { status: 400 });

        const store = await db.store.findFirst({ where: { id: storeId, userId } });
        if (!store) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        await db.product.delete({ where: { id: productId, storeId } });

        return NextResponse.json({ message: "Produk berhasil dihapus" });
    } catch (error) {
        console.error("[PRODUCT_DELETE_ERROR]", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan internal" },
            { status: 500 }
        );
    }
}