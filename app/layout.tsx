import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Streak App",
  description: "Build your streak, celebrate progress, and climb the leaderboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-body">
        <Nav />
        {children}
      </body>
    </html>
  );
}
