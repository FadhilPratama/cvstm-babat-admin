import { CategoryClient } from "./components/client";
import db from "@/lib/db";

import {format} from 'date-fns'
import {CategoryColumn} from "@/app/(dashboard)/[storeId]/(routes)/categories/components/columns";

const CategoriesPage = async ({
                               params
                           }: {
    params: Promise<{ storeId: string }>
}) => {
    const { storeId } = await params;

    const categories = await db.category.findMany({
        where: {
            storeId: storeId,
        },

        include: {
            banner: true,
        },

        orderBy: {
            createdAt: 'desc'
        }
    })

    const formattedCategories:CategoryColumn[] = categories.map((item) => ({
        id:item.id,
        name: item.name,
        bannerLabel: item.banner.label,
        createdAt: format(item.createdAt, "MMM dd, yyyy"),
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryClient data={formattedCategories} />
            </div>
        </div>
    );
}

export default CategoriesPage;