"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ModalProvider } from "@/components/modal/provider";
export function Providers({ children }) {
    return (<SessionProvider>
      <Toaster className="dark:hidden"/>
      <Toaster theme="dark" className="hidden dark:block"/>
      <ModalProvider>{children}</ModalProvider>
    </SessionProvider>);
}
