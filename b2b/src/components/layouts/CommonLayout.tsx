import Footer from "../shared/Footer";
import Header from "../shared/Header";
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['400', '700'] });

export default function CommonLayout({children}: { children: React.ReactNode }) {
    return (
        <div className={`${outfit.className} min-h-screen space-y-6 flex flex-col`}>
            <Header />
            <main className="container mx-auto grow px-10">
                {children}
            </main>
            <Footer />
        </div>
    );
}