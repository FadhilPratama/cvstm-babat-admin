'use client';

import { useEffect, useState } from "react";
import { Button } from "./button";
import { ImagePlus, Trash } from "lucide-react";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import Image from "next/image";

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    value: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
                                                     disabled,
                                                     onChange,
                                                     onRemove,
                                                     value,
                                                 }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onUpload = (result: CloudinaryUploadWidgetResults) => {
        if (result.event !== "success") return;

        if (
            result.info &&
            typeof result.info !== "string" &&
            "secure_url" in result.info
        ) {
            const newUrl = result.info.secure_url as string;

            if (!value.includes(newUrl)) {
                onChange(newUrl);
            }
        }
    };



    if (!isMounted) {
        return null;
    }

    // Remove duplicates and use index for keys
    const uniqueImages = [...new Set(value)];

    return (
        <div>
            <div className="mb-4 flex items-center gap-4">
                {uniqueImages.map((url, index) => (
                    <div
                        key={`image-${index}`}
                        className="relative w-[200px] h-[200px] rounded-md overflow-hidden"
                    >
                        <div className="z-10 absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={() => onRemove(url)}
                                variant="destructive"
                                size="sm"
                                disabled={disabled}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Image"
                            src={url}
                        />
                    </div>
                ))}
            </div>
            <CldUploadWidget onUpload={onUpload} uploadPreset="upload_preset">
                {({ open }) => {
                    const onClick = () => {
                        open();
                    };

                    return (
                        <Button
                            type="button"
                            disabled={disabled}
                            variant="secondary"
                            onClick={onClick}
                        >
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Upload an Image
                        </Button>
                    );
                }}
            </CldUploadWidget>
        </div>
    );
};

export default ImageUpload;
