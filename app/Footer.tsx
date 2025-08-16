// app/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-16 text-center text-sm text-slate-400">
      <nav className="flex gap-4 justify-center">
        <a href="/about">À propos</a>
        <a href="/privacy">Confidentialité</a>
      </nav>
      <p className="mt-2">© {new Date().getFullYear()} Market Cap Chain</p>
    </footer>
  );
}
