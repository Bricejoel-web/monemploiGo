import { requireProAccount } from "@/lib/pro/dal";
import { ProShell } from "@/components/pro/ProShell";

// Pages privées de l'espace Pro. Chaque page rappelle aussi
// requireProAccount() (mis en cache pour la requête) : une page ne doit
// jamais compter sur la seule mise en page pour vérifier l'accès.
export default async function ProSpaceLayout({ children }: LayoutProps<"/[locale]/pro">) {
  const account = await requireProAccount();
  return <ProShell companyName={account.companyName} logoDataUrl={account.logoDataUrl}>{children}</ProShell>;
}
