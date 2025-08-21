import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        // Await params before using it
        const { productId } = await params;

        if (!productId) {
            return new NextResponse("Product id dibutuhkan", { status: 400 });
        }

        const product = await db.product.findUnique({
            where: {
                id: productId,
            },
            include: {
                images: true,
                category: true,
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.log("[PRODUCT_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ storeId: string, productId: string }> }
) {
    try {
        const { userId } = await auth();
        const body = await req.json();

        const {
            name,
            price,
            categoryId,
            images,
            isFeatured,
            isArchived,
        } = body;

        // Await params before using it
        const { storeId, productId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Nama perlu diinput", { status: 400 });
        }

        if (!images || !images.length) {
            return new NextResponse("Image perlu diinput", { status: 400 });
        }

        if (!price) {
            return new NextResponse("Harga perlu diinput", { status: 400 });
        }

        if (!categoryId) {
            return new NextResponse("Kategori perlu diinput", { status: 400 });
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

        await db.product.update({
            where: {
                id: productId,
            },
            data: {
                name,
                price,
                categoryId,
                isFeatured,
                isArchived,
                storeId: storeId,
                images: {
                    deleteMany: {}
                },
            },
        });

        const product = await db.product.update({
            where: {
                id: productId,
            },
            data: {
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: {url: string}) => image )
                        ]
                    }
                }
            }
        })

        return NextResponse.json(product);
    } catch (error) {
        console.log("[PRODUCT_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ storeId: string, productId: string }> }
) {
    try {
        const { userId } = await auth();

        // Await params before using it
        const { storeId, productId } = await params;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 });
        }

        if (!productId) {
            return new NextResponse("Product id dibutuhkan", { status: 400 });
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

        const product = await db.product.delete({
            where: {
                id: productId,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.log("[PRODUCT_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}