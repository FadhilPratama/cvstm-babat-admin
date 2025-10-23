"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

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
import { AlertModal } from "@/components/modals/alert-modal";
import { Trash } from "lucide-react";

// ✅ Schema pakai zod
const formSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    categoryId: z.string().min(1, "Category is required"),
    images: z.object({ url: z.string() }).array(),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),
    description: z.string().nullable().optional(),
    activeIngredients: z.string().nullable().optional(),
    netWeight: z.string().nullable().optional(),
    manufacturer: z.string().nullable().optional(),
    shelfLife: z.string().nullable().optional(),
    packaging: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface Category {
    id: string;
    name: string;
}

interface ProductFormProps {
    initialData?: Partial<ProductFormValues> & {
        id?: string;
        images?: { id?: string; url: string }[];
    };
    categories: Category[];
}

// ✅ Normalisasi data agar tidak ada null/undefined yang bentrok
function normalizeProductData(data?: ProductFormProps["initialData"]): ProductFormValues {
    return {
        name: data?.name ?? "",
        categoryId: data?.categoryId ?? "",
        images: (data?.images ?? []).map((img) => ({ url: img.url })),
        isFeatured: data?.isFeatured ?? false,
        isArchived: data?.isArchived ?? false,
        description: data?.description ?? "",
        activeIngredients: data?.activeIngredients ?? "",
        netWeight: data?.netWeight ?? "",
        manufacturer: data?.manufacturer ?? "",
        shelfLife: data?.shelfLife ?? "",
        packaging: data?.packaging ?? "",
    };
}

export const ProductForm = ({ initialData, categories }: ProductFormProps) => {
    const params = useParams<{ storeId: string; productId?: string }>();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const title = initialData ? "Edit product" : "Create product";
    const description = initialData ? "Edit a product." : "Add a new product";
    const toastMessage = initialData
        ? "Product updated successfully"
        : "Product created successfully";
    const action = initialData ? "Save changes" : "Create";

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: normalizeProductData(initialData),
    });

    const onSubmit = async (data: ProductFormValues) => {
        try {
            setLoading(true);

            if (initialData?.id) {
                await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data);
            } else {
                await axios.post(`/api/${params.storeId}/products`, data);
            }

            toast.success(toastMessage);
            router.push(`/${params.storeId}/products`);
            router.refresh();
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Something went wrong. Please check your data and try again.");
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        try {
            setLoading(true);
            await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
            toast.success("Product deleted successfully");
            router.push(`/${params.storeId}/products`);
            router.refresh();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product. Please try again.");
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
                                        onChange={(url) => field.onChange([...field.value, { url }])}
                                        onRemove={(url) => field.onChange(field.value.filter((img) => img.url !== url))}
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
                                            <Input disabled={loading} placeholder="Product name" {...field} />
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
                                        <Select disabled={loading} onValueChange={field.onChange} value={field.value}>
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
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="md:grid md:grid-cols-2 gap-8">
                            {[
                                ["activeIngredients", "Active Ingredients", "e.g., Benih jagung hibrida F1"],
                                ["netWeight", "Net Weight / Content", "e.g., 5 kg"],
                                ["manufacturer", "Manufacturer", "e.g., Syngenta"],
                                ["shelfLife", "Shelf Life", "e.g., 2 years"],
                                ["packaging", "Packaging", "e.g., Plastic bag"],
                            ].map(([name, label, placeholder]) => (
                                <FormField
                                    key={name}
                                    control={form.control}
                                    name={name as keyof ProductFormValues}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{label}</FormLabel>
                                            <FormControl>
                                                <Input disabled={loading} placeholder={placeholder} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Settings</h3>
                        <div className="flex items-center space-x-8">
                            {[
                                ["isFeatured", "Featured", "This product will appear on the home page"],
                                ["isArchived", "Archived", "This product will not appear anywhere in the store"],
                            ].map(([name, label, desc]) => (
                                <FormField
                                    key={name}
                                    control={form.control}
                                    name={name as keyof ProductFormValues}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={
                                                        field.value == null
                                                            ? undefined
                                                            : typeof field.value === "boolean"
                                                                ? field.value
                                                                : Boolean(field.value)
                                                    }
                                                    onCheckedChange={field.onChange}
                                                    disabled={loading}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>{label}</FormLabel>
                                                <FormDescription>{desc}</FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            ))}
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
