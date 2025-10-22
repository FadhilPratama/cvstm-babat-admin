import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

// ==========================================================
// GET SINGLE PRODUCT
// ==========================================================
export async function GET(
    req: Request,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const { storeId, productId } = params;

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID dibutuhkan" },
                { status: 400 }
            );
        }

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID dibutuhkan" },
                { status: 400 }
            );
        }

        const product = await db.product.findUnique({
            where: {
                id: productId,
                storeId,
            },
            include: {
                images: true,
                category: true,
            },
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
// UPDATE PRODUCT (PATCH)
// ==========================================================
export async function PATCH(
    req: Request,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const { userId } = await auth();
        const { storeId, productId } = params;
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

        // ===== Validasi =====
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID dibutuhkan" },
                { status: 400 }
            );
        }

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID dibutuhkan" },
                { status: 400 }
            );
        }

        if (!name) {
            return NextResponse.json(
                { error: "Nama produk perlu diinput" },
                { status: 400 }
            );
        }

        if (!categoryId) {
            return NextResponse.json(
                { error: "Kategori perlu diinput" },
                { status: 400 }
            );
        }

        if (!images?.length) {
            return NextResponse.json(
                { error: "Image perlu diinput" },
                { status: 400 }
            );
        }

        // ===== Verifikasi store ownership =====
        const store = await db.store.findFirst({
            where: {
                id: storeId,
                userId
            },
        });

        if (!store) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // ===== Verifikasi kategori =====
        const category = await db.category.findFirst({
            where: {
                id: categoryId,
                storeId
            },
        });

        if (!category) {
            return NextResponse.json(
                { error: "Kategori tidak ditemukan" },
                { status: 400 }
            );
        }

        // ===== Verifikasi produk exists =====
        const existingProduct = await db.product.findFirst({
            where: {
                id: productId,
                storeId
            },
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: "Produk tidak ditemukan" },
                { status: 404 }
            );
        }

        // ===== Update dengan transaksi =====
        const updatedProduct = await db.$transaction(async (tx) => {
            // Hapus gambar lama
            await tx.image.deleteMany({
                where: { productId }
            });

            // Update produk dengan gambar baru
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
                            data: images.map((img: { url: string }) => ({
                                url: img.url
                            })),
                        },
                    },
                },
                include: {
                    images: true,
                    category: true,
                },
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
// DELETE PRODUCT
// ==========================================================
export async function DELETE(
    req: Request,
    { params }: { params: { storeId: string; productId: string } }
) {
    try {
        const { userId } = await auth();
        const { storeId, productId } = params;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!storeId) {
            return NextResponse.json(
                { error: "Store ID dibutuhkan" },
                { status: 400 }
            );
        }

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID dibutuhkan" },
                { status: 400 }
            );
        }

        // ===== Verifikasi store ownership =====
        const store = await db.store.findFirst({
            where: {
                id: storeId,
                userId
            },
        });

        if (!store) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // ===== Delete product (cascade akan hapus images juga jika sudah setup di schema) =====
        await db.product.delete({
            where: {
                id: productId,
                storeId,
            },
        });

        return NextResponse.json({ message: "Produk berhasil dihapus" });
    } catch (error) {
        console.error("[PRODUCT_DELETE_ERROR]", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan internal" },
            { status: 500 }
        );
    }
}