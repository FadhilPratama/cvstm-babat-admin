import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

type ContextParams = {
    params: Promise<{
        storeId: string;
        productId: string;
    }>;
};

// ==========================================================
// GET SINGLE PRODUCT - Public
// ==========================================================
export async function GET(
    _req: NextRequest,
    context: ContextParams
) {
    try {
        const { productId } = await context.params;

        if (!productId) {
            return new NextResponse("Product id dibutuhkan", { status: 400 });
        }

        // Public endpoint - tidak perlu validasi storeId
        const product = await db.product.findUnique({
            where: {
                id: productId,
            },
            include: {
                images: true,
                category: true,
            },
        });

        if (!product) {
            return new NextResponse("Produk tidak ditemukan", { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCT_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// ==========================================================
// PATCH PRODUCT - Admin Only
// ==========================================================
export async function PATCH(
    req: NextRequest,
    context: ContextParams
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

        // Validasi user
        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!storeId || !productId) {
            return new NextResponse("Store ID dan Product ID dibutuhkan", { status: 400 });
        }

        // Validasi field wajib
        if (!name) {
            return new NextResponse("Nama perlu diinput", { status: 400 });
        }

        if (!images || !images.length) {
            return new NextResponse("Image perlu diinput", { status: 400 });
        }

        if (!categoryId) {
            return new NextResponse("Kategori perlu diinput", { status: 400 });
        }

        // Verifikasi kepemilikan store
        const storeByUserId = await db.store.findFirst({
            where: {
                id: storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Verifikasi kategori exists
        const category = await db.category.findFirst({
            where: { id: categoryId, storeId },
        });

        if (!category) {
            return new NextResponse("Kategori tidak ditemukan", { status: 400 });
        }

        // Verifikasi product exists
        const existingProduct = await db.product.findFirst({
            where: { id: productId, storeId },
        });

        if (!existingProduct) {
            return new NextResponse("Produk tidak ditemukan", { status: 404 });
        }

        // Update product dengan transaction
        const product = await db.$transaction(async (tx) => {
            // Delete old images
            await tx.image.deleteMany({
                where: { productId },
            });

            // Update product with new data
            return await tx.product.update({
                where: {
                    id: productId,
                },
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
                            data: images.map((image: { url: string }) => ({ url: image.url })),
                        },
                    },
                },
                include: {
                    images: true,
                    category: true,
                },
            });
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCT_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// ==========================================================
// DELETE PRODUCT - Admin Only
// ==========================================================
export async function DELETE(
    _req: NextRequest,
    context: ContextParams
) {
    try {
        const { userId } = await auth();
        const { storeId, productId } = await context.params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!storeId || !productId) {
            return new NextResponse("Store ID dan Product ID dibutuhkan", { status: 400 });
        }

        // Verifikasi kepemilikan store
        const storeByUserId = await db.store.findFirst({
            where: {
                id: storeId,
                userId,
            },
        });

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Verifikasi product exists
        const existingProduct = await db.product.findFirst({
            where: { id: productId, storeId },
        });

        if (!existingProduct) {
            return new NextResponse("Produk tidak ditemukan", { status: 404 });
        }

        // Delete product (images akan auto-delete karena cascade)
        const product = await db.product.delete({
            where: {
                id: productId,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCT_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}