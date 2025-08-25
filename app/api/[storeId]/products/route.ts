import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
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

        const { storeId } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized user", { status: 401 });
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

        if (!storeId) {
            return new NextResponse("Store ID URL dibutuhkan", { status: 400 });
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

        const product = await db.product.create({
            data: {
                name,
                price,
                categoryId,
                isFeatured,
                isArchived,
                storeId: storeId,
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: {url:string}) => image)
                        ]
                    }
                }
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCTS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { searchParams } = new URL(req.url);

        const categoryId = searchParams.get("categoryId") || undefined;
        const isFeatured = searchParams.get("isFeatured");
        const query = searchParams.get("q") || "";
        const global = searchParams.get("global") === "true";

        const { storeId } = await params;

        if (!global && !storeId) {
            return new NextResponse("Store ID URL dibutuhkan", { status: 400 });
        }

        const products = await db.product.findMany({
            where: {
                ...(global
                    ? {} // abaikan store filter → semua store
                    : { storeId }),

                categoryId,
                isFeatured: isFeatured ? true : undefined,
                isArchived: false,

                // pencarian nama produk
                ...(query
                    ? {
                        name: {
                            contains: query,
                            mode: "insensitive",
                        },
                    }
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
    } catch (error) {
        console.error("[PRODUCTS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
