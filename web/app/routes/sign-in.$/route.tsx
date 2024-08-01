import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/remix";
import { useSearchParams } from "@remix-run/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { EMAIL_NOT_ALLOWED } from "~/lib/types";
import { toast } from "~/components/ui/use-toast";

export default function SignInPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const signInError = searchParams.get("error");

    if (signInError === EMAIL_NOT_ALLOWED) {
      toast({
        variant: "destructive",
        title: "Sign In error",
        description:
          "You can only sign-in using email id added to the email whitelist",
      });
      setSearchParams(new URLSearchParams());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  return (
    <div>
      <div className="fixed inset-0 flex items-center justify-center">
        <ClerkLoading>
          <Loader2 size={48} className="animate-spin" />
        </ClerkLoading>
      </div>
      <ClerkLoaded>
        <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-[md]">
            <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Sign In
            </h2>
            <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-[480px]"></div>
          </div>
          <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="px-6 py-6 sm:px-12">
              <SignIn
                appearance={{
                  elements: {
                    footerAction: "hidden",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </ClerkLoaded>
    </div>
  );
}
