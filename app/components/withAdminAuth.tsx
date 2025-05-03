"use client";
import { useEffect, useState, ComponentType } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Generic type for props
const withAdminAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const ProtectedComponent = (props: P) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
      const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/");
          return;
        }

        const { data: isAdminResult } = await supabase.rpc("check_is_admin", {
          uid: user.id,
        });

        if (!isAdminResult) {
          router.replace("/access-denied");
          return;
        }

        setIsAdmin(true);
        setLoading(false);
      };

      checkAdmin();
    }, [router]);

    if (loading) return <p className="text-center mt-10">Verifying admin...</p>;
    return isAdmin ? <WrappedComponent {...props} /> : null;
  };

  return ProtectedComponent;
};

export default withAdminAuth;
