import LegalLayout, { H2, P, UL } from "./LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="24 avril 2026">
      <P>
        Chez VIBE, ta vie privée est essentielle. Cette politique explique quelles données
        nous collectons, pourquoi, et comment tu gardes le contrôle.
      </P>

      <H2>1. Données collectées</H2>
      <UL>
        <li>Compte : prénom, e-mail, mot de passe (chiffré).</li>
        <li>Profil style : âge, taille, poids, styles préférés, vibes, lieux fréquentés.</li>
        <li>Photos de scan : envoyées temporairement à notre IA pour analyse.</li>
        <li>Données techniques : appareil, langue, journaux d'erreurs anonymisés.</li>
        <li>Paiements : gérés par Stripe, nous ne stockons aucune donnée bancaire.</li>
      </UL>

      <H2>2. Utilisation</H2>
      <UL>
        <li>Fournir l'analyse stylistique IA et personnaliser tes recommandations.</li>
        <li>Gérer ton compte, tes crédits et l'historique de tes scans.</li>
        <li>Améliorer la qualité des modèles (de manière agrégée et anonymisée).</li>
        <li>Sécurité, prévention de la fraude, obligations légales.</li>
      </UL>

      <H2>3. Photos & IA</H2>
      <P>
        Tes photos sont envoyées à nos prestataires IA (Google Gemini, OpenAI) uniquement
        pour générer l'analyse demandée. Elles ne sont pas utilisées pour entraîner leurs
        modèles et sont supprimées après traitement.
      </P>

      <H2>4. Partage</H2>
      <P>
        Nous ne vendons jamais tes données. Elles sont partagées uniquement avec :
        Supabase (hébergement), Stripe (paiements), nos fournisseurs IA, et les autorités
        si la loi l'exige.
      </P>

      <H2>5. Conservation</H2>
      <P>
        Tes données de profil sont conservées tant que ton compte est actif. Tu peux le
        supprimer à tout moment depuis Réglages → Supprimer mon compte. Les données sont
        alors effacées sous 30 jours, sauf obligations légales.
      </P>

      <H2>6. Tes droits (RGPD)</H2>
      <UL>
        <li>Accès, rectification, effacement, portabilité.</li>
        <li>Opposition au traitement, limitation.</li>
        <li>Réclamation auprès de la CNIL (cnil.fr).</li>
      </UL>

      <H2>7. Sécurité</H2>
      <P>
        Connexion HTTPS, mots de passe hachés, accès aux données restreint par règles
        Row-Level Security côté base de données.
      </P>

      <H2>8. Mineurs</H2>
      <P>VIBE n'est pas destiné aux moins de 13 ans.</P>

      <H2>9. Contact</H2>
      <P>
        Pour toute question : <a href="mailto:privacy@vibe.app" className="text-accent underline">privacy@vibe.app</a>.
      </P>
    </LegalLayout>
  );
}