import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";

export default async function DashboardLayout({
                                                  children,
                                                  params,
                                              }: {
    children: React.ReactNode;
    params: Promise<{ storeId: string }>;
}) {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    // Await the params object before accessing its properties
    const { storeId } = await params;

    const store = await db.store.findFirst({
        where: {
            id: storeId,
            userId
        }
    });

    if (!store) {
        redirect('/');
    }

    return (
        <>
            <Navbar />

            {children}
        </>
    );
}