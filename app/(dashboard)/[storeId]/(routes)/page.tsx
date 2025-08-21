import db from "@/lib/db";

interface DashboardPageProps {
    params: Promise<{ storeId: string }>
}

const DashboardPage = async ({ params }: DashboardPageProps) => {
    // Await the params object before accessing its properties
    const { storeId } = await params;

    const store = await db.store.findFirst({
        where: {
            id: storeId
        }
    });

    return (
        <div>
            Active Store: {store?.name}
        </div>
    );
};

export default DashboardPage;