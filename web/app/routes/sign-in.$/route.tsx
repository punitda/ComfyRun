import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/remix";
import { Loader2 } from "lucide-react";
import { useEmailNotAllowedHook } from "~/lib/hooks";

export default function SignInPage() {
  useEmailNotAllowedHook();
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
