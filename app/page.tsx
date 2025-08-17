// app/page.tsx
import Game from "./Game"; // Game est un Client Component avec "use client" DANS Game.tsx

export const metadata = {
  title: "More-or-Less — Market Cap Chain",
  description:
    "Jeu web : devine si la prochaine entreprise vaut plus ou moins que l’actuelle. 200+ sociétés, reveal animé, score et partage.",
  alternates: {
    canonical: "https://ton-domaine.com/",
  },
  openGraph: {
    type: "website",
    url: "https://ton-domaine.com/",
    title: "More-or-Less — Market Cap Chain",
    description:
      "Devine ‘More or Less’ sur la market cap. Enchaîne les bonnes réponses pour battre ton highscore.",
    images: ["/og-image.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "More-or-Less — Market Cap Chain",
    applicationCategory: "Game",
    operatingSystem: "Web",
    url: "https://ton-domaine.com/",
    image: "https://ton-domaine.com/og-image.png",
    description:
      "Jeu web: devine si la prochaine entreprise vaut plus ou moins. 200+ sociétés, score et partage.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: ["fr-FR", "en-US"],
  };

  return (
    <main>
      {/* Données structurées SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Ton jeu (client) */}
      <Game />

      {/* Section texte SEO sous le héros/jeu */}
      <section aria-labelledby="about" className="mt-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6">
          <h2 id="about" className="sr-only">À propos du jeu</h2>
          <p className="text-sm text-slate-300/90">
            Devine si la prochaine entreprise vaut <span className="text-slate-100 font-medium">plus</span> ou
            <span className="text-slate-100 font-medium"> moins</span> que l’actuelle. 200+ sociétés, reveal animé,
            score sauvegardé. Pas d’inscription.
          </p>
          <details className="mt-2">
            <summary className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer">En savoir plus</summary>
            <ul className="mt-2 text-xs text-slate-400/90 space-y-1">
              <li>Tech, luxe, énergie, banques…</li>
              <li>Caps approximatives (milliards USD) — pour le fun.</li>
              <li>Highscore stocké en localStorage.</li>
            </ul>
          </details>
        </div>
      </section>

    </main>
  );
}
