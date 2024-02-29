import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button } from "@nextui-org/react";
import { ThemeSwitcher } from "./theme-switcher";
import { FaXTwitter } from "react-icons/fa6";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

export function Header() {
  return (
    <header>
      <Navbar position="static" className="dark:bg-neutral-800">
        <NavbarBrand>
          <FaXTwitter className="text-3xl" />
        </NavbarBrand>
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem>
            <p className={`${montserrat.className} font-bold text-inherit text-xl`}>Shadowban Test</p>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem>
            <ThemeSwitcher />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    </header>
  );
}
