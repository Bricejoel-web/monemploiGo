import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { getBewerbungsbriefBySlug, getCoverLetterBySlug, getCvTemplateBySlug } from "@/lib/cv/catalog";
import type { BewerbungsbriefData, CoverLetterData, CvData } from "@/lib/cv/types";
import { saveProBewerbungsbriefDocument, saveProCoverLetterDocument, saveProCvDocument } from "@/lib/pro/document-actions";
import { CvEditor } from "@/components/cv/CvEditor";
import { CoverLetterEditor } from "@/components/cv/CoverLetterEditor";
import { BewerbungsbriefEditor } from "@/components/cv/BewerbungsbriefEditor";
import { CvFonts } from "@/components/cv/CvFonts";

type Props =
  | { kind: "CV"; templateSlug: string; candidateId: string; documentId?: string; data: CvData; includePhoto?: boolean }
  | { kind: "COVER_LETTER"; templateSlug: string; candidateId: string; documentId?: string; data: CoverLetterData }
  | { kind: "BEWERBUNGSBRIEF"; templateSlug: string; candidateId: string; documentId?: string; data: BewerbungsbriefData };

/**
 * Éditeurs du site (mêmes champs, même génération automatique des lettres,
 * mêmes modèles) en mode Pro : enregistrement en brouillon pour CE candidat,
 * sans prix ni paiement. Le candidat est lié côté serveur (action liée).
 */
export async function ProDocumentEditor(props: Props) {
  const dict = await getDictionary("fr");

  if (props.kind === "CV") {
    const template = getCvTemplateBySlug(props.templateSlug);
    if (!template) notFound();
    return (
      <>
        <CvFonts />
        <CvEditor
          template={template}
          dict={dict}
          locale="fr"
          documentId={props.documentId}
          initialData={props.data}
          initialIncludePhoto={props.includePhoto ?? Boolean(props.data.photoDataUrl)}
          proSave={saveProCvDocument.bind(null, props.candidateId)}
        />
      </>
    );
  }

  if (props.kind === "COVER_LETTER") {
    const template = getCoverLetterBySlug(props.templateSlug);
    if (!template) notFound();
    return (
      <>
        <CvFonts />
        <CoverLetterEditor
          template={template}
          dict={dict}
          locale="fr"
          documentId={props.documentId}
          initialData={props.data}
          proSave={saveProCoverLetterDocument.bind(null, props.candidateId)}
        />
      </>
    );
  }

  const template = getBewerbungsbriefBySlug(props.templateSlug);
  if (!template) notFound();
  return (
    <>
      <CvFonts />
      <BewerbungsbriefEditor
        template={template}
        dict={dict}
        locale="fr"
        documentId={props.documentId}
        initialData={props.data}
        proSave={saveProBewerbungsbriefDocument.bind(null, props.candidateId)}
      />
    </>
  );
}
