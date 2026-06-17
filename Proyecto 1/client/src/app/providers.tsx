"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { MqttProvider } from "@/lib/hooks/useMqttGreenPi";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, gcTime: 60_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MqttProvider>{children}</MqttProvider>
    </QueryClientProvider>
  );
}
