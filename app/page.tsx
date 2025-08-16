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
      <section
        aria-labelledby="what-is"
        className="mt-12 prose prose-invert max-w-3xl mx-auto"
      >
        <h2 id="what-is">Qu’est-ce que “More-or-Less — Market Cap Chain” ?</h2>
        <p>
          Un mini-jeu gratuit de culture financière : compare la capitalisation
          boursière d’Apple, Microsoft, NVIDIA, LVMH, etc. Devine si la
          prochaine entreprise vaut <strong>plus</strong> ou{" "}
          <strong>moins</strong> que l’actuelle, et enchaîne les bonnes réponses
          pour battre ton record.
        </p>
        <h3>Fonctionnement</h3>
        <ul>
          <li>200+ entreprises connues (caps approximatives en milliards USD).</li>
          <li>Révélation animée de la market cap, score et meilleur score sauvegardé.</li>
          <li>Partage rapide du résultat sur mobile et desktop.</li>
        </ul>
        <h3>Pourquoi c’est fun ?</h3>
        <p>
          Tu t’habitues aux ordres de grandeur des secteurs (tech, luxe, énergie,
          banques…). Idéal pour réviser avant un entretien ou juste t’amuser.
        </p>
      </section>
    </main>
  );
}
