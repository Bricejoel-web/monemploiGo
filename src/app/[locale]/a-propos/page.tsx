import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LegalPage } from "@/components/layout/LegalPage";
import { seoMetadata } from "@/lib/seo-pages";

// Uniquement des faits vérifiables sur le service (aucun chiffre, avis ni
// partenaire). L'identité juridique de l'exploitant sera ajoutée quand elle
// sera fournie.
export async function generateMetadata({ params }: PageProps<"/[locale]/a-propos">) {
  const { locale } = await params;
  return seoMetadata(locale, "about", "/a-propos");
}

export default async function AboutPage({ params }: PageProps<"/[locale]/a-propos">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = (await getDictionary(locale as Locale)).pages.about;

  const lists: [string, string[]][] = [
    [t.forWhoTitle, t.forWho],
    [t.featuresTitle, t.features],
  ];

  return (
    <LegalPage title={t.title}>
      <p className="text-base text-black/80 dark:text-white/80">{t.intro}</p>
      {lists.map(([title, items]) => (
        <section key={title} className="flex flex-col gap-2">
          <h2 className="font-semibold text-black dark:text-white">{title}</h2>
          <ul className="list-disc pl-5">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-black dark:text-white">{t.notTitle}</h2>
        <p>{t.not}</p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-semibold text-black dark:text-white">{t.commitmentsTitle}</h2>
        <ul className="list-disc pl-5">
          {t.commitments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <p>
        {t.contactText}{" "}
        <Link href={`/${locale}/contact`} className="font-medium underline">
          {t.contactLink}
        </Link>
      </p>
    </LegalPage>
  );
}
