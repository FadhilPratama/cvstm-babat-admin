import Image from "next/image";
import {Button} from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-4">
      <Button
      size="lg"
      variant="destructive">
          Click Me
      </Button>
    </div>
  );
}
