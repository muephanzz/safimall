"use client"; 

import { useSearchParams } from "next/navigation";
import ProcessingModal from "@/components/ProcessingModal";

export default function ProcessingPage() {
  const searchParams = useSearchParams();
  const checkoutRequestId = searchParams.get("checkoutRequestId");

  return <ProcessingModal checkoutRequestId={checkoutRequestId} onClose={() => {}} />;
}
