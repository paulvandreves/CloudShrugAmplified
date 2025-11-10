import type { Metadata } from "next";
import "./app.css";
import AuthenticatorWrapper from "./AuthenticatorWrapper";
import "@aws-amplify/ui-react/styles.css";

export const metadata: Metadata = {
  title: "Alarm Trail",
  description: "Document you Cloudwatch Alarms and investigations over time",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthenticatorWrapper>{children}</AuthenticatorWrapper>
      </body>
    </html>
  );
}
