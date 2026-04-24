import LegalLayout, { H2, P, UL } from "./LegalLayout";

export default function Terms() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" updated="24 avril 2026">
      <P>
        Bienvenue sur VIBE. En utilisant l'application, tu acceptes les présentes CGU.
        Lis-les attentivement.
      </P>

      <H2>1. Service</H2>
      <P>
        VIBE est une application mobile de coaching style basée sur l'intelligence
        artificielle. Elle propose : analyse de tenues (scan), inspirations, conseils
        personnalisés et achats de crédits.
      </P>

      <H2>2. Compte</H2>
      <UL>
        <li>Tu dois avoir au moins 13 ans pour créer un compte.</li>
        <li>Tu fournis des informations exactes et tu protèges ton mot de passe.</li>
        <li>Tu es responsable de toute activité depuis ton compte.</li>
      </UL>

      <H2>3. Crédits & paiements</H2>
      <UL>
        <li>1 crédit = 1 scan IA complet.</li>
        <li>Les crédits s'achètent par packs (Starter, Vibe Pack, Styliste, Premium) via Stripe.</li>
        <li>Les crédits sont rattachés à ton compte et n'expirent pas.</li>
        <li>Les crédits ne sont ni remboursables ni convertibles en argent, sauf obligation légale.</li>
      </UL>

      <H2>4. Droit de rétractation</H2>
      <P>
        Conformément à l'article L221-28 du Code de la consommation, l'achat de crédits
        est un contenu numérique exécuté immédiatement avec ton accord exprès. Tu
        renonces donc à ton droit de rétractation dès la première utilisation d'un crédit.
      </P>

      <H2>5. Utilisation acceptable</H2>
      <UL>
        <li>Pas de contenu illégal, haineux, sexuellement explicite ou portant atteinte à autrui.</li>
        <li>Pas de scan de personnes sans leur consentement.</li>
        <li>Pas de tentative de contournement, scraping ou rétro-ingénierie.</li>
      </UL>

      <H2>6. Propriété intellectuelle</H2>
      <P>
        VIBE, son logo, son design et son code sont protégés. Tu conserves les droits sur
        tes photos, mais nous accordes une licence pour les traiter dans le cadre du
        service.
      </P>

      <H2>7. IA & avertissement</H2>
      <P>
        Les analyses sont générées par des modèles IA. Elles sont indicatives et
        subjectives, sans garantie d'exactitude. Elles ne constituent pas un conseil
        professionnel.
      </P>

      <H2>8. Affiliation</H2>
      <P>
        Les liens shopping peuvent être des liens d'affiliation. Le prix payé par toi
        n'est pas affecté.
      </P>

      <H2>9. Suspension & résiliation</H2>
      <P>
        Nous pouvons suspendre ton compte en cas de violation des CGU. Tu peux supprimer
        ton compte à tout moment depuis Réglages.
      </P>

      <H2>10. Responsabilité</H2>
      <P>
        Le service est fourni « tel quel ». Nous ne sommes pas responsables des dommages
        indirects liés à l'utilisation de l'app, dans la limite autorisée par la loi.
      </P>

      <H2>11. Droit applicable</H2>
      <P>Droit français. Tribunaux compétents : ceux du ressort du siège de l'éditeur.</P>

      <H2>12. Contact</H2>
      <P>
        Pour toute question : <a href="mailto:hello@vibe.app" className="text-accent underline">hello@vibe.app</a>.
      </P>
    </LegalLayout>
  );
}