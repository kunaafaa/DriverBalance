"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export default function TabCloseGuard() {
  const pathname = usePathname()
  const csrfRef = useRef<string | null>(null)
  const isFirstRender = useRef(true)

  // Pre-fetch the CSRF token once so beforeunload can use it without extra round trips
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d: { csrfToken?: string }) => {
        csrfRef.current = d.csrfToken ?? null
      })
      .catch(() => {})
  }, [])

  // Set the navigating flag on every client-side route change (skip the initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    sessionStorage.setItem("navigating", "true")
  }, [pathname])

  // On page load: clear any stale navigating flag, then wire up beforeunload
  useEffect(() => {
    sessionStorage.removeItem("navigating")

    const handleBeforeUnload = () => {
      // If a route change just happened (e.g. refresh mid-navigation), skip logout
      if (sessionStorage.getItem("navigating") === "true") {
        sessionStorage.removeItem("navigating")
        return
      }

      if (!csrfRef.current) return

      // keepalive ensures the request completes even as the page unloads
      fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken: csrfRef.current,
          json: "true",
        }).toString(),
        keepalive: true,
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  return null
}
