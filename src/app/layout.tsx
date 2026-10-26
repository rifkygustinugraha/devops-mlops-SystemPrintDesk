import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintDesk | Antrean Layanan Cetak Kampus",
  description:
    "Ambil dan pantau antrean layanan fotokopi kampus secara digital.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
