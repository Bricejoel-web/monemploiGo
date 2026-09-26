import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/client";
import { getBewerbungsbriefBySlug } from "@/lib/cv/catalog";
import { BewerbungsbriefEditor } from "@/components/cv/BewerbungsbriefEditor";
import type { BewerbungsbriefData } from "@/lib/cv/types";

export default async function BewerbungsbriefEditorPage({ params, searchParams }: PageProps<"/[locale]/bewerbungsbrief/modele/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const session = await requireSession(locale);

  const template = getBewerbungsbriefBySlug(slug);
  if (!template) notFound();

  const dict = await getDictionary(locale as Locale);

  // Reprise d'un brouillon depuis le tableau de bord (?documentId=...).
  const { documentId: rawDocumentId } = await searchParams;
  const documentId = typeof rawDocumentId === "string" ? rawDocumentId : undefined;

  let initialData: BewerbungsbriefData | undefined;
  let resolvedDocumentId: string | undefined;

  if (documentId) {
    const existing = await prisma.document.findFirst({
      where: { id: documentId, userId: session.userId, type: "BEWERBUNGSBRIEF" },
    });
    if (existing) {
      initialData = JSON.parse(existing.contentJson) as BewerbungsbriefData;
      resolvedDocumentId = existing.id;
    }
  }

  return (
    <BewerbungsbriefEditor
      template={template}
      dict={dict}
      locale={locale as Locale}
      documentId={resolvedDocumentId}
      initialData={initialData}
    />
  );
}
