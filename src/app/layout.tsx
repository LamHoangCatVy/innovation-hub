import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VPB Innovation Platform - Nền tảng Đổi mới Sáng tạo",
  description: "Nền tảng tiếp nhận, chấm điểm và điều phối sáng kiến toàn ngân hàng",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${ibmPlexSans.variable} h-full`}>
      <body className="h-full font-sans antialiased">{children}</body>
    </html>
  );
}
