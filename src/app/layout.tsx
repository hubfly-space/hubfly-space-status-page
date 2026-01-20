import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Hubfly Status",
	description: "System status and operational metrics for Hubfly services.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-[#f7f2ea] text-[#1c1916] dark:bg-[#0b0a09] dark:text-[#f5f2ed]`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
