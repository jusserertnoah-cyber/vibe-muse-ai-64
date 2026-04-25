import { useTranslation } from "react-i18next";
import LegalLayout, { H2, P, UL } from "./LegalLayout";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t("legal.terms.title")} updated={t("legal.terms.updated")}>
      <P>{t("legal.terms.intro")}</P>

      <H2>{t("legal.terms.h1")}</H2>
      <P>{t("legal.terms.p1")}</P>

      <H2>{t("legal.terms.h2")}</H2>
      <UL>
        <li>{t("legal.terms.l2a")}</li>
        <li>{t("legal.terms.l2b")}</li>
        <li>{t("legal.terms.l2c")}</li>
      </UL>

      <H2>{t("legal.terms.h3")}</H2>
      <UL>
        <li>{t("legal.terms.l3a")}</li>
        <li>{t("legal.terms.l3b")}</li>
        <li>{t("legal.terms.l3c")}</li>
        <li>{t("legal.terms.l3d")}</li>
      </UL>

      <H2>{t("legal.terms.h4")}</H2>
      <P>{t("legal.terms.p4")}</P>

      <H2>{t("legal.terms.h5")}</H2>
      <UL>
        <li>{t("legal.terms.l5a")}</li>
        <li>{t("legal.terms.l5b")}</li>
        <li>{t("legal.terms.l5c")}</li>
      </UL>

      <H2>{t("legal.terms.h6")}</H2>
      <P>{t("legal.terms.p6")}</P>

      <H2>{t("legal.terms.h7")}</H2>
      <P>{t("legal.terms.p7")}</P>

      <H2>{t("legal.terms.h8")}</H2>
      <P>{t("legal.terms.p8")}</P>

      <H2>{t("legal.terms.h9")}</H2>
      <P>{t("legal.terms.p9")}</P>

      <H2>{t("legal.terms.h10")}</H2>
      <P>{t("legal.terms.p10")}</P>

      <H2>{t("legal.terms.h11")}</H2>
      <P>{t("legal.terms.p11")}</P>

      <H2>{t("legal.terms.h12")}</H2>
      <P>
        {t("legal.terms.p12")}
        <a href="mailto:hello@vibe.app" className="text-accent underline">hello@vibe.app</a>.
      </P>
    </LegalLayout>
  );
}
