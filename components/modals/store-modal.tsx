'use client'

import * as z from 'zod'


import { useStoreModal } from "@/hooks/use-store-modal";
import Modal from "../ui/modal";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import toast from "react-hot-toast";

const formSchema = z.object({
    name: z.string().min(1, {
        message: "Nama Toko Harus Dimasukin",
    }),
});

export const StoreModal = () => {
    const [loading, setLoading] = useState(false);

    const storeModal = useStoreModal();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/stores", values);
            console.log(response.data);
            toast.success("Berhasil Membuat Toko");
            window.location.assign(`/${response.data.id}`);
        } catch (error) {
            console.log(error);
            toast.error("Gagal Membuat Toko")
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Buat Store"
            description="Tambahkan Store untuk membuat produk dan kategori"
            isOpen={storeModal.isOpen}
            onClose={storeModal.onClose}
        >
            <div className="space-y-4 py-2 pb-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Toko</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama toko" {...field}
                                        disabled={loading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="pt-6 space-x-2 flex items-center justify-end">
                            <Button disabled={loading} type="button" variant="outline" onClick={storeModal.onClose}>
                                Batal
                            </Button>
                            <Button disabled={loading} type="submit" >
                                Simpan
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </Modal>
    );
};
