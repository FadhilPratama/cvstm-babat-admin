"use client";

import { useState, useTransition } from "react";
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

// ✅ Zod Schema Validation
const formSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    categoryId: z.string().min(1, "Category is required"),
    images: z
        .array(z.object({ url: z.string().url("Invalid image URL") }))
        .nonempty("At least one image is required"),
    isFeatured: z.boolean().default(false).optional(),
    isArchived: z.boolean().default(false).optional(),
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
    categories: Array<{ id: string; name: string }>;
}

const normalizeProductData = (data: any): ProductFormValues => ({
    name: data?.name ?? "",
    categoryId: data?.categoryId ?? "",
    images: data?.images ?? [],
    isFeatured: data?.isFeatured ?? false,
    isArchived: data?.isArchived ?? false,
    description: data?.description ?? "",
    activeIngredients: data?.activeIngredients ?? "",
    netWeight: data?.netWeight ?? "",
    manufacturer: data?.manufacturer ?? "",
    shelfLife: data?.shelfLife ?? "",
    packaging: data?.packaging ?? "",
});

export const ProductForm: React.FC<ProductFormProps> = ({
                                                            initialData,
                                                            categories,
                                                        }) => {
    const params = useParams();
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isEditing = Boolean(initialData);
    const title = isEditing ? "Edit Product" : "Create Product";
    const description = isEditing ? "Edit the product details." : "Add a new product.";
    const toastMessage = isEditing ? "Product updated successfully." : "Product created successfully.";
    const action = isEditing ? "Save changes" : "Create";

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: normalizeProductData(initialData),
        mode: "onChange",
    });

    const onSubmit = async (data: ProductFormValues) => {
        startTransition(async () => {
            try {
                if (isEditing) {
                    await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data);
                } else {
                    await axios.post(`/api/${params.storeId}/products`, data);
                }

                toast.success(toastMessage);
                router.push(`/${params.storeId}/products`);
                router.refresh();
            } catch (error: any) {
                console.error("Error submitting form:", error);
                toast.error(error?.response?.data?.message || "Something went wrong.");
            }
        });
    };

    const onDelete = async () => {
        startTransition(async () => {
            try {
                await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
                toast.success("Product deleted successfully.");
                router.push(`/${params.storeId}/products`);
                router.refresh();
            } catch (error: any) {
                console.error("Error deleting product:", error);
                toast.error(error?.response?.data?.message || "Failed to delete product.");
            } finally {
                setOpen(false);
            }
        });
    };

    return (
        <>
            <AlertModal isOpen={open} onClose={() => setOpen(false)} onConfirm={onDelete} loading={isPending} />

            <div className="flex items-center justify-between">
                <Heading title={title} description={description} />
                {isEditing && (
                    <Button disabled={isPending} variant="destructive" size="sm" onClick={() => setOpen(true)}>
                        <Trash className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Separator className="my-4" />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                    {/* === Images === */}
                    <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Images</FormLabel>
                                <FormControl>
                                    <ImageUpload
                                        value={field.value.map((image) => image.url)}
                                        disabled={isPending}
                                        onChange={(url) => field.onChange([...field.value, { url }])}
                                        onRemove={(url) => field.onChange(field.value.filter((img) => img.url !== url))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* === Basic Info === */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div className="md:grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter product name" disabled={isPending} {...field} />
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
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
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

                    {/* === Product Details === */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Product Details</h3>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Write product description..." disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="md:grid md:grid-cols-2 gap-8">
                            {[
                                { name: "activeIngredients", label: "Active Ingredients", placeholder: "e.g., Benih jagung F1" },
                                { name: "netWeight", label: "Net Weight / Content", placeholder: "e.g., 5 kg" },
                                { name: "manufacturer", label: "Manufacturer", placeholder: "e.g., Syngenta" },
                                { name: "shelfLife", label: "Shelf Life", placeholder: "e.g., 2 years" },
                                { name: "packaging", label: "Packaging", placeholder: "e.g., Plastic bag" },
                            ].map(({ name, label, placeholder }) => (
                                <FormField
                                    key={name}
                                    control={form.control}
                                    name={name as keyof ProductFormValues}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{label}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={placeholder} disabled={isPending} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* === Settings === */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Settings</h3>
                        <div className="flex flex-wrap gap-4">
                            <FormField
                                control={form.control}
                                name="isFeatured"
                                render={({ field }) => (
                                    <FormItem className="flex items-start space-x-3 border rounded-md p-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Featured</FormLabel>
                                            <FormDescription>This product will appear on the home page.</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isArchived"
                                render={({ field }) => (
                                    <FormItem className="flex items-start space-x-3 border rounded-md p-4">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Archived</FormLabel>
                                            <FormDescription>This product will not appear anywhere in the store.</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Button disabled={isPending} className="ml-auto" type="submit">
                        {action}
                    </Button>
                </form>
            </Form>
        </>
    );
};
