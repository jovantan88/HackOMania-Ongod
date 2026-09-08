"use client"

import Link from "next/link"
import { Github, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppHeader({
  session,
  darkMode,
  onToggleTheme,
  onLogin,
  showAuth = true,
}) {
  return (
    <header className="z-30 flex items-center justify-between gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-gray-900/90">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
            O
          </span>
          <span className="leading-tight">
            <span className="block font-semibold tracking-tight">Ongod</span>
            <span className="hidden text-xs text-stone-500 dark:text-stone-400 sm:block">
              Find your tribe IRL
            </span>
          </span>
        </Link>
        <span className="hidden rounded-full border border-stone-200 px-2.5 py-1 text-[11px] text-stone-600 dark:border-stone-700 dark:text-stone-300 md:inline-flex">
          Honorable mention · HackOMania 2025
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {showAuth &&
          (session ? (
            <Button variant="outline" disabled>
              Signed in
            </Button>
          ) : (
            <Button onClick={onLogin} variant="outline">
              Sign in with <Github className="ml-1 h-4 w-4" />
            </Button>
          ))}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleTheme}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  )
}
