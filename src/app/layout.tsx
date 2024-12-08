import "./globals.css";

export const metadata = {
  title: "Weather Report",
  description:
    "Select the place you would like to visit and check the weather report.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
