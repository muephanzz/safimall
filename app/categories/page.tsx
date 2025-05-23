"use client";

import ProductHeader from "@/components/ProductHeader";
import MobileMenu from "@/components/TabletNav";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
      // Detect mobile device based on user agent
      const checkMobile = () => {
        if (typeof navigator !== "undefined") {
          setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
        }
      };
      checkMobile();
    }, []);

  return (
    <>
      <div>
        <ProductHeader isMobile={isMobile} />
      </div>
      <div>
        <MobileMenu />
      </div>
    </>
  );
}
