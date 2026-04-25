Je vais corriger deux problèmes ensemble : les moments où l’app semble en pause, et le flux email/Google qui ne sauvegarde pas toujours le profil après connexion.

## Objectif utilisateur
Après avoir rempli le profil puis choisi email ou Google :
- l’app ne doit plus donner l’impression d’être bloquée ;
- le profil doit être sauvegardé automatiquement ;
- au retour du lien email ou de Google, l’utilisateur doit arriver directement dans l’app, sans refaire le profil.

## Plan d’action

1. Fiabiliser le retour après email / Google
- Corriger la logique d’onboarding pour qu’elle traite clairement l’état “connexion en cours”.
- Si une session est créée après clic sur le lien email ou retour Google, reconstruire le profil depuis les données sauvegardées avant la redirection.
- Rediriger vers `/app` dès que le profil est sauvegardé.
- Éviter les boucles où l’utilisateur revient sur `/onboarding` et doit retaper son profil.

2. Ajouter un fallback solide pour le profil
- Garder les réponses d’onboarding localement avant l’envoi du lien ou Google.
- Les transmettre aussi dans l’URL de retour quand c’est possible.
- À la reconnexion, utiliser dans cet ordre : profil déjà en base, réponses locales, réponses dans l’URL, métadonnées du compte.
- Si le profil en base n’existe pas encore ou n’est pas marqué comme terminé, le créer/mettre à jour automatiquement.

3. Supprimer les causes de “pause” visibles
- Remplacer l’écran vide pendant le chargement auth/onboarding par un vrai loader léger, pour que l’app ne semble plus figée.
- Supprimer le `setInterval(applyTheme, 1500)` global qui relance inutilement le thème en boucle.
- Corriger `applyTheme` pour ne pas déclencher d’événement si le thème n’a pas réellement changé.
- Corriger les warnings React liés au logo/profil qui peuvent provoquer des comportements instables en développement.

4. Optimiser les tâches lentes au moment de l’inscription
- Ne pas bloquer la navigation sur l’identifiant appareil / welcome pack si cette partie prend trop de temps.
- Sauvegarder le profil et entrer dans l’app en priorité, puis traiter le bonus de bienvenue en arrière-plan quand possible.
- Mettre un délai de sécurité sur les opérations réseau non critiques pour éviter un bouton qui reste en “pause”.

5. Tester le résultat
- Vérifier le build TypeScript/Vite.
- Vérifier que les routes `/`, `/onboarding` et `/app` gardent le bon comportement.
- Vérifier que les changements n’éditent pas les fichiers auto-générés Cloud.

## Détails techniques
- Fichiers concernés principalement :
  - `src/pages/Onboarding.tsx`
  - `src/pages/Index.tsx`
  - `src/components/vibe/AppLayout.tsx`
  - `src/App.tsx`
  - `src/lib/theme.ts`
  - `src/lib/device.ts`
  - `src/components/vibe/VibeLogo.tsx`
- Pas de modification directe des fichiers auto-générés `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts` ou `src/integrations/lovable/index.ts`.
- Pas besoin de changer la base de données pour cette correction, sauf si les tests montrent que la table `profiles` manque une règle existante.