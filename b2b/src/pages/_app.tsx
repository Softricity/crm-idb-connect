import "@/styles/globals.css";
import type { AppProps } from "next/app";

import {HeroUIProvider} from "@heroui/react";
import CommonLayout from "@/components/layouts/CommonLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicPage = router.pathname === '/login' || router.pathname === '/become-an-agent';

  return (
    <HeroUIProvider>
      <AuthProvider>
        {isPublicPage ? (
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
