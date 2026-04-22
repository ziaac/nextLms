"""
FIX — providers.tsx
Hapus HeroUIProvider (tidak ada di HeroUI v3)
HeroUI v3 cukup import styles di globals.css, tidak butuh Provider

Cara pakai:
  Jalankan dari root project (nextjslms/):
    python scripts/fix_providers.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files = {}

# ============================================================
# src/app/providers.tsx  — FIXED
# ============================================================

files["src/app/providers.tsx"] = """\
'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
"""

# ============================================================
# WRITE
# ============================================================

def write_files(files_dict: dict, base: str) -> None:
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")
    print(f"\n🎉 Fix selesai! Coba jalankan ulang: npm run dev")

if __name__ == "__main__":
    print("🔧 Fix providers.tsx — hapus HeroUIProvider\n")
    write_files(files, BASE)