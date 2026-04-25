## 🎨 Logo VIBE — Monogramme "V" streetwear bold

### Concept visuel
Un **"V" majuscule sculpté**, façon Off-White / Balenciaga / Helmut Lang :
- Lettre **ultra-grasse** (black weight 900), tracée à partir de formes géométriques pures (pas une font système)
- **Coupe diagonale nette** dans la pointe du V — accent éditorial signature, lisible à toute taille
- **Deux variantes** : 
  - `V` seul (favicon, app icon, bottom nav)
  - `V` + wordmark "VIBE" en dessous (header, splash, onboarding)
- Espacement et proportions calibrés pour rester impactant en 16px (favicon) comme en 200px (header)

### Palette mono adaptatif
Le logo utilise `currentColor` / `text-foreground` → s'adapte automatiquement aux 3 thèmes existants :
- Crème par défaut → anthracite `#211F1B`
- Mauve → anthracite chaud
- Mono → noir pur

Variante "highlight" optionnelle avec barre/coupe en `text-accent` (lime ou mauve selon thème) pour les moments clés (splash, paywall).

### Livraison technique

**1. Composant SVG (`src/components/vibe/VibeLogo.tsx`)** — refonte complète
- SVG inline, paths vectoriels précis (pas de dépendance à une font)
- Props : `variant?: "icon" | "full"` (V seul ou V + wordmark), `accent?: boolean` (active la coupe lime)
- `className` continue d'accepter taille/couleur via Tailwind (`text-foreground`, `h-12`, etc.)
- Compatible avec tous les usages existants (Onboarding, Home header, etc.)

**2. Favicon + app icon**
- Génération d'un PNG 512×512 du monogramme via script Python (PIL) → `/public/favicon.png` + `/public/apple-touch-icon.png`
- Mise à jour de `index.html` (`<link rel="icon">` + `apple-touch-icon`)
- Suppression de l'ancien `favicon.ico`

**3. Exports téléchargeables** (`/mnt/documents/`)
- `vibe-logo-icon.svg` (V seul, vectoriel)
- `vibe-logo-full.svg` (V + wordmark)
- `vibe-logo-icon-512.png` (transparent, haute déf)
- `vibe-logo-full-1024.png` (transparent, pour réseaux sociaux)
- `vibe-logo-presskit.pdf` — page de présentation avec les variantes sur fond crème + fond noir (pour usage externe)

### QA visuel
- Génération + inspection des PNG/PDF avant livraison
- Test du SVG dans l'app à plusieurs tailles (favicon 16px, bottom nav 24px, header 32px, splash 96px)
- Vérif lisibilité sur les 3 thèmes (crème, mauve, mono)

### Ce qui change dans l'app
- `src/components/vibe/VibeLogo.tsx` → refonte (nouveau SVG, nouvelles props)
- `index.html` → nouveau favicon + apple-touch-icon
- `public/favicon.png`, `public/apple-touch-icon.png` → nouveaux fichiers
- Aucun autre fichier ne change : tous les usages existants de `<VibeLogo />` continuent de fonctionner (rétrocompatible)

---

**Note** : Tu n'as pas répondu à la question "format de livraison" — je pars sur **les deux** (SVG intégré + exports PNG/PDF) puisque c'est l'option la plus complète. Dis-moi si tu préfères seulement l'intégration ou seulement les exports.