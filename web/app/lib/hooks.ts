import { useSearchParams } from "@remix-run/react";
import { useEffect } from "react";
import { EMAIL_NOT_ALLOWED } from "./types";
import { toast } from "~/components/ui/use-toast";

export type Page = "SIGN-IN" | "SIGN-UP";
export function useEmailNotAllowedHook(page: Page) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const signInError = searchParams.get("error");

    if (signInError === EMAIL_NOT_ALLOWED) {
      toast({
        variant: "destructive",
        title: page === "SIGN-IN" ? "Sign In error" : "Sign Up error",
        description: `You can only ${
          page === "SIGN-IN" ? "sign-in" : "signup"
        } using email id added to the email whitelist`,
      });
      setSearchParams(new URLSearchParams());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
}
