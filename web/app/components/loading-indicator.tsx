import { Loader2 } from "lucide-react";

const LoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="ml-2 text-lg font-semibold">Loading...</span>
    </div>
  );
};

export default LoadingIndicator;
