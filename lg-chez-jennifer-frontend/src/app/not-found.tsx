import { PassButton, GhostButton } from "@/components/ui";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function NotFound() {
  return (
    <div className="u-grain">
    <Header />
    <main id="contenu" className="mx-auto flex min-h-[80svh] max-w-2xl flex-col items-center justify-center px-5 pt-28 text-center">
      <p className="t-script text-5xl text-peach">Oups…</p>
      <h1 className="t-display mt-3 text-6xl text-paper">Cette salle est vide.</h1>
      <p className="mt-4 text-paper-muted">La page que tu cherches n&apos;existe pas (ou plus). La soirée continue ailleurs.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <PassButton href="/evenements">Voir les événements</PassButton>
        <GhostButton href="/" arrow={false}>Accueil</GhostButton>
      </div>
    </main>
    <Footer />
    </div>
  );
}
