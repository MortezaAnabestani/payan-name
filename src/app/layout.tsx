import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "./fonts/Vazirmatn-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Vazirmatn-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Vazirmatn-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سه قطره خون — کاغذ و آسایشگاه",
  description:
    "برش تراگشتی از «سه قطره خون» صادق هدایت: ناتوانی در نوشتن، کاغذِ درهم و چرخهٔ آسایشگاه.",
};

export const viewport: Viewport = {
  themeColor: "#0d1512",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={vazirmatn.variable}
      // برخی افزونه‌های مرورگر (مثل ابزارهای اجباری‌کردن RTL) پیش از hydrate شدن،
      // کلاس‌هایی مثل "rtl-enabled" به <html> اضافه می‌کنند و تفاوت attribute را با
      // رندر سرور ناسازگار نشان می‌دهند. این پرچم فقط هشدارهای attribute در همین
      // تگ را بی‌صدا می‌کند و بقیه‌ی درخت را تحت تأثیر قرار نمی‌دهد.
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
