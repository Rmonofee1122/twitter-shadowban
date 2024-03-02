"use client";

import { Button } from "@nextui-org/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa6";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  switch (theme) {
    case "dark":
      return (
        <Button isIconOnly color="primary" variant="solid" aria-label="Switch to light mode" onClick={() => setTheme("light")}>
          <FaSun className="text-xl" />
        </Button>
      )
    case "light":
      return (
        <Button isIconOnly color="primary" variant="flat" aria-label="Switch to dark mode" onClick={() => setTheme("dark")}>
          <FaMoon className="text-xl" />
        </Button>
      )
    default:
      return null
  }
};