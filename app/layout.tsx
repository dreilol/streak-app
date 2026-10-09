import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = { title: "Streak App" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">
        <Nav />
        {children}
      </body>
    </html>
  );
}
