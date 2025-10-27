import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

type ContextParams = {
    params: Promise<{
        storeId: string;
    }>;
};

// ===========================================
// CREATE PRODUCT (POST) - Admin Only
// ===========================================
export async function POST(req: Request, context: ContextParams) {
    try {
        const { userId } = await auth();
        const { storeId } = await context.params;
        const body = await req.json();

        const {
            name,
            price,
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
            return new NextResponse("Unauthorized user", { status: 401 });
        }

        // Validasi field wajib
        if (!name) return new NextResponse("Nama perlu diinput", { status: 400 });
        if (!images || !images.length) return new NextResponse("Image perlu diinput", { status: 400 });
        if (!price) return new NextResponse("Harga perlu diinput", { status: 400 });
        if (!categoryId) return new NextResponse("Kategori perlu diinput", { status: 400 });
        if (!storeId) return new NextResponse("Store ID URL dibutuhkan", { status: 400 });

        // Verifikasi kepemilikan store
        const storeByUserId = await db.store.findFirst({
            where: { id: storeId, userId },
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

        // Create product
        const product = await db.product.create({
            data: {
                name,
                price,
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
                        data: images.map((image: { url: string }) => ({ url: image.url })),
                    },
                },
            },
            include: {
                images: true,
                category: true,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCTS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// ===========================================
// GET PRODUCTS - Public & Admin
// ===========================================
export async function GET(req: Request, context: ContextParams) {
    try {
        const { searchParams } = new URL(req.url);
        const { storeId } = await context.params;

        const categoryId = searchParams.get("categoryId") || undefined;
        const isFeatured = searchParams.get("isFeatured");
        const query = searchParams.get("q") || undefined;
        const global = searchParams.get("global") === "true";

        console.log("🔍 GET Products - params:", {
            global,
            storeId,
            categoryId,
            isFeatured,
            query,
        });

        // Validasi storeId jika bukan global request
        if (!global && !storeId) {
            return new NextResponse("Store ID URL dibutuhkan", { status: 400 });
        }

        // Build where clause dengan type yang proper
        interface WhereClause {
            storeId?: string;
            categoryId?: string;
            isFeatured?: boolean;
            isArchived: boolean;
            OR?: Array<{
                name?: { contains: string; mode: "insensitive" };
                category?: { name: { contains: string; mode: "insensitive" } };
                description?: { contains: string; mode: "insensitive" };
                activeIngredients?: { contains: string; mode: "insensitive" };
                manufacturer?: { contains: string; mode: "insensitive" };
            }>;
        }

        const whereClause: WhereClause = {
            ...(global ? {} : { storeId }),
            categoryId,
            isFeatured: isFeatured === "true" ? true : undefined,
            isArchived: false,
        };

        // Search di multiple fields jika ada query
        if (query) {
            whereClause.OR = [
                { name: { contains: query, mode: "insensitive" } },
                { category: { name: { contains: query, mode: "insensitive" } } },
            ];

            // Jika ada field tambahan (description, manufacturer, dll), uncomment ini:
            // { description: { contains: query, mode: "insensitive" } },
            // { activeIngredients: { contains: query, mode: "insensitive" } },
            // { manufacturer: { contains: query, mode: "insensitive" } },
        }

        const products = await db.product.findMany({
            where: whereClause,
            include: {
                images: true,
                category: true,
            },
            orderBy: { createdAt: "desc" },
        });

        console.log(`✅ Found ${products.length} products${query ? ` for query "${query}"` : ""}`);

        return NextResponse.json(products);
    } catch (error) {
        console.error("[PRODUCTS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}