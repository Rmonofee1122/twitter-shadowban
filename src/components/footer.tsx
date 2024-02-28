import { Link } from "@nextui-org/react";
import NextLink from "next/link";

export function Footer() {
  return (
    <footer className="dark:bg-neutral-800">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center">
          Shadowban Test by <Link as={NextLink} href="https://www.threads.net/@kohnoselami">@KohnoseLami</Link>
        </p>
        <p className="text-center text-xs">
          <Link as={NextLink} href="https://github.com/Shadowban-Test/X">GitHub Repository</Link> | <Link as={NextLink} href="/api/docs">API Documents</Link>
        </p>
      </div>
    </footer>
  );
}