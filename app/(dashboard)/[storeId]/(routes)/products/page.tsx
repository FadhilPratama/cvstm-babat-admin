import { ProductClient } from "./components/client";
import db from "@/lib/db";
import { format } from "date-fns";
import { ProductColumn } from "@/app/(dashboard)/[storeId]/(routes)/products/components/columns";

const ProductsPage = async ({
                                params,
                            }: {
    params: Promise<{ storeId: string }>;
}) => {
    const { storeId } = await params;

    const products = await db.product.findMany({
        where: {
            storeId,
        },
        include: {
            category: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const formattedProducts: ProductColumn[] = products.map((item) => ({
        id: item.id,
        name: item.name,
        isFeatured: item.isFeatured,
        isArchived: item.isArchived,
        category: item.category.name,
        createdAt: format(item.createdAt, "MMM dd, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductClient data={formattedProducts} />
            </div>
        </div>
    );
};

export default ProductsPage;
