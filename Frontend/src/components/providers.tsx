"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, type ReactNode } from "react";
import { Watermark } from "@/components/layout/Watermark";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <Watermark />
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: "10px", background: "#0f172a", color: "#fff" },
        }}
      />
    </QueryClientProvider>
  );
}
