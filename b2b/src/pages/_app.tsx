import "@/styles/globals.css";
import type { AppProps } from "next/app";

import {HeroUIProvider} from "@heroui/react";
import CommonLayout from "@/components/layouts/CommonLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';

  return (
    <HeroUIProvider>
      <AuthProvider>
        {isLoginPage ? (
          <Component {...pageProps} />
        ) : (
          <CommonLayout>
            <Component {...pageProps} />
          </CommonLayout>
        )}
      </AuthProvider>
    </HeroUIProvider>
  );
}
