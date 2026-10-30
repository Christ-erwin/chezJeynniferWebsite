import { GameScreen } from "@/components/werewolf/GameScreen";

/**
 * Écran géant d'une partie de Loup-Garou (télé, projecteur), visible par tous
 * les joueurs. Lien public : seuls les rôles des joueurs éliminés y sont révélés.
 */
export default async function LoupGarouScreenPage({ params }: PageProps<"/ecran/loup-garou/[id]">) {
  const { id } = await params;
  return <GameScreen id={id} />;
}
