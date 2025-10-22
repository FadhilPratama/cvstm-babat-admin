"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import ImageUpload from "@/components/ui/image-upload";
import { AlertModal } from '@/components/modals/alert-modal';
import { Trash } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(1),
    categoryId: z.string().min(1),
    images: z.object({ url: z.string() }).array(),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),

    // Product Details (Optional)
    description: z.string().optional(),
    activeIngredients: z.string().optional(),
    netWeight: z.string().optional(),
    manufacturer: z.string().optional(),
    shelfLife: z.string().optional(),
    packaging: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
    initialData: any;
    categories: any[];
}

function normalizeProductData(data: any): ProductFormValues {
    if (!data) {
        return {
            name: "",
            categoryId: "",
            images: [],
            isFeatured: false,
            isArchived: false,
            description: "",
            activeIngredients: "",
            netWeight: "",
            manufacturer: "",
            shelfLife: "",
            packaging: "",
        };
    }

    return {
        ...data,
        name: data.name ?? "",
        categoryId: data.categoryId ?? "",
        images: data.images ?? [],
        isFeatured: data.isFeatured ?? false,
        isArchived: data.isArchived ?? false,
        description: data.description ?? "",
        activeIngredients: data.activeIngredients ?? "",
        netWeight: data.netWeight ?? "",
        manufacturer: data.manufacturer ?? "",
        shelfLife: data.shelfLife ?? "",
        packaging: data.packaging ?? "",
    };
}

export const ProductForm: React.FC<ProductFormProps> = ({
                                                            initialData,
                                                            categories,
                                                        }) => {
    const params = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const title = initialData ? "Edit product" : "Create product";
    const description = initialData ? "Edit a product." : "Add a new product";
    const toastMessage = initialData ? 'Product updated successfully' : 'Product created successfully';
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: normalizeProductData(initialData),
    });

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);

            if (initialData) {
                // Update existing product
                await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data);
            } else {
                // Create new product
                await axios.post(`/api/${params.storeId}/products`, data);
            }

            toast.success(toastMessage);
            router.push(`/${params.storeId}/products`);
            router.refresh();
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Something went wrong. Please check your data and try again.');
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
            toast.success('Product deleted successfully');
            router.push(`/${params.storeId}/products`);
            router.refresh();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product. Please try again.');
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <>
            <AlertModal
                isOpen={open}
                onClose={() => setOpen(false)}
                onConfirm={onDelete}
                loading={loading}
            />

            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {initialData && (
                    <Button
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                        onClick={() => setOpen(true)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>
            <Separator />

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8 w-full"
                >
                    {/* Images */}
                    <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Images</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={field.value.map((image) => image.url)}
                                        disabled={loading}
                                        onChange={(url) =>
                                            field.onChange([...field.value, { url }])
                                        }
                                        onRemove={(url) =>
                                            field.onChange(
                                                field.value.filter((img) => img.url !== url)
                                            )
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div className="md:grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={loading}
                                                placeholder="Product name"
                                                {...field}
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
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            disabled={loading}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
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
                    </div>

                    <Separator />

                    {/* Product Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Product Details</h3>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            disabled={loading}
                                            placeholder="Product description..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="md:grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="activeIngredients"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Active Ingredients</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={loading}
                                                placeholder="e.g., Benih jagung hibrida F1"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="netWeight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Net Weight / Content</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="e.g., 5 kg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="manufacturer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Manufacturer</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="e.g., Syngenta" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="shelfLife"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Shelf Life</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="e.g., 2 years" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="packaging"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Packaging</FormLabel>
                                        <FormControl>
                                            <Input disabled={loading} placeholder="e.g., Plastic bag" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Settings</h3>
                        <div className="flex items-center space-x-8">
                            <FormField
                                control={form.control}
                                name="isFeatured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Featured</FormLabel>
                                            <FormDescription>
                                                This product will appear on the home page
                                            </FormDescription>
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
                                                onCheckedChange={field.onChange}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Archived</FormLabel>
                                            <FormDescription>
                                                This product will not appear anywhere in the store.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Button disabled={loading} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};