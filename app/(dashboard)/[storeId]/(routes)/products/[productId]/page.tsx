import db from "@/lib/db";
import { ProductForm } from "@/app/(dashboard)/[storeId]/(routes)/products/[productId]/components/product-form";

// Tipe untuk Prisma Decimal-like object
interface DecimalLike {
    toNumber: () => number;
}

// Serialize Prisma Decimal ke number biasa
function serializeDecimal<T>(obj: T): T {
    return JSON.parse(
        JSON.stringify(obj, (_, value) => {
            if (typeof value === "object" && value !== null) {
                const maybeDecimal = value as Partial<DecimalLike>;
                if (typeof maybeDecimal.toNumber === "function") {
                    return maybeDecimal.toNumber();
                }
            }
            return value;
        })
    );
}

// Server component
const ProductPage = async ({
                               params,
                           }: {
    params: { productId: string; storeId: string };
}) => {
    const { productId, storeId } = params;

    const product = await db.product.findUnique({
        where: { id: productId },
        include: { images: true },
    });

    const categories = await db.category.findMany({
        where: { storeId },
    });

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductForm
                    initialData={product ? serializeDecimal(product) : null}
                    categories={serializeDecimal(categories)}
                />
            </div>
        </div>
    );
};

export default ProductPage;
