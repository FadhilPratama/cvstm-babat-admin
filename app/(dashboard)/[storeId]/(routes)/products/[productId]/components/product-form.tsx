'use client';

import * as z from 'zod';
import { useState } from 'react';
import {Category, Image, Product} from '@/lib/generated/prisma';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { AlertModal } from '@/components/modals/alert-modal';
import ImageUpload from '@/components/ui/image-upload';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface ProductFormProps {
    initialData: (Product & { images: Image[] }) | null;
    categories: Category[];
}

const formSchema = z.object({
    name: z.string().min(1),
    images: z.array(z.object({ url: z.string() })),
    price: z.number().positive(),
    categoryId: z.string().min(1),
    isFeatured: z.boolean(),
    isArchived: z.boolean(),
});

type ProductFormValues = {
    name: string;
    images: { url: string }[];
    price: number;
    categoryId: string;
    isFeatured: boolean;
    isArchived: boolean;
};

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, categories }) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const title = initialData ? 'Edit Produk' : 'Tambah Produk';
    const description = initialData ? 'Ubah detail produk toko' : 'Buat produk baru untuk toko';
    const toastMessage = initialData ? 'Produk berhasil diperbarui' : 'Produk berhasil dibuat';
    const action = initialData ? 'Simpan Perubahan' : 'Buat Produk';

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData
            ? {
                name: initialData.name,
                images: initialData.images || [],
                price: Number(initialData.price),
                categoryId: initialData.categoryId,
                isFeatured: Boolean(initialData.isFeatured),
                isArchived: Boolean(initialData.isArchived),
            }
            : {
                name: '',
                images: [],
                price: 0,
                categoryId: '',
                isFeatured: false,
                isArchived: false,
            },
    });

    const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
        try {
            setLoading(true);
            if (initialData) {
                await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data);
            } else {
                await axios.post(`/api/${params.storeId}/products`, data);
            }
            toast.success(toastMessage);
            router.push(`/${params.storeId}/products`);
            router.refresh();
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Cek kembali data yang diinput');
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
            toast.success('Produk berhasil dihapus');
            router.push(`/${params.storeId}/products`);
            router.refresh();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Cek kembali data dan koneksi Anda');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={loading} />

            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button disabled={loading} variant="destructive" size="sm" onClick={() => setOpen(true)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Separator />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    {/* Images Section */}
                    <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gambar Produk</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        disabled={loading}
                                        onChange={(url) => field.onChange([...(field.value || []), { url }])}
                                        onRemove={(url) =>
                                            field.onChange(field.value?.filter((current) => current.url !== url) || [])
                                        }
                                        value={field.value?.map((image) => image.url) || []}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Produk</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nama produk" disabled={loading} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Harga</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            disabled={loading}
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                field.onChange(value === '' ? 0 : Number(value));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kategori</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={loading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="isFeatured"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(!!checked)}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Produk Unggulan</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Produk ini akan muncul di halaman utama
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isArchived"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(!!checked)}
                                            disabled={loading}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Arsipkan Produk</FormLabel>
                                        <p className="text-sm text-muted-foreground">
                                            Produk ini tidak akan tampil di toko
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};