import db from "@/lib/db";
import {CategoryForm} from "@/app/(dashboard)/[storeId]/(routes)/categories/[categoryId]/components/category-form";

const CategoryPage = async ({
                                params
                            }: {
    params: Promise<{categoryId: string, storeId: string}> // Add storeId to the type
}) => {
    const { categoryId, storeId } = await params; // Destructure both values

    const category = await db.category.findUnique({
        where: {
            id: categoryId // Use the destructured categoryId
        }
    })

    const banners = await db.banner.findMany({
        where: {
            storeId: storeId
        }
    })

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryForm
                    banners={banners}
                    initialData={category}
                />
            </div>
        </div>
    );
}

export default CategoryPage;