import { useTranslation } from "react-i18next";
import LegalLayout, { H2, P, UL } from "./LegalLayout";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <LegalLayout title={t("legal.privacy.title")} updated={t("legal.privacy.updated")}>
      <P>{t("legal.privacy.intro")}</P>

      <H2>{t("legal.privacy.h1")}</H2>
      <UL>
        <li>{t("legal.privacy.l1a")}</li>
        <li>{t("legal.privacy.l1b")}</li>
        <li>{t("legal.privacy.l1c")}</li>
        <li>{t("legal.privacy.l1d")}</li>
        <li>{t("legal.privacy.l1e")}</li>
      </UL>

      <H2>{t("legal.privacy.h2")}</H2>
      <UL>
        <li>{t("legal.privacy.l2a")}</li>
        <li>{t("legal.privacy.l2b")}</li>
        <li>{t("legal.privacy.l2c")}</li>
        <li>{t("legal.privacy.l2d")}</li>
      </UL>

      <H2>{t("legal.privacy.h3")}</H2>
      <P>{t("legal.privacy.p3")}</P>

      <H2>{t("legal.privacy.h4")}</H2>
      <P>{t("legal.privacy.p4")}</P>

      <H2>{t("legal.privacy.h5")}</H2>
      <P>{t("legal.privacy.p5")}</P>

      <H2>{t("legal.privacy.h6")}</H2>
      <UL>
        <li>{t("legal.privacy.l6a")}</li>
        <li>{t("legal.privacy.l6b")}</li>
        <li>{t("legal.privacy.l6c")}</li>
      </UL>

      <H2>{t("legal.privacy.h7")}</H2>
      <P>{t("legal.privacy.p7")}</P>

      <H2>{t("legal.privacy.h8")}</H2>
      <P>{t("legal.privacy.p8")}</P>

      <H2>{t("legal.privacy.h9")}</H2>
      <P>
        {t("legal.privacy.p9")}
        <a href="mailto:privacy@vibe.app" className="text-accent underline">privacy@vibe.app</a>.
      </P>
    </LegalLayout>
  );
}
