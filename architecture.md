# Architecture initiale

## Principes

1. Toute affirmation factuelle affichée à la candidate doit pouvoir être remontée jusqu’à une source précise.
2. Les sorties du copilote conservent leurs liens vers les éléments de connaissance et citations utilisés.
3. Les statuts juridiques sont des valeurs explicites, pas des déductions du résumé.
4. Les données personnelles et la progression sont isolées par utilisatrice.
5. Démarrer avec un monolithe modulaire ; séparer un service seulement lorsqu’une contrainte le justifie.

## Modules applicatifs proposés

- `catalog` : sources, articles, thèmes, citations
- `legal` : textes, étapes, statuts et dates d’effet
- `digest` : sélection, priorités et éditions hebdomadaires
- `study` : notions, cartes, questions, tentatives et progression
- `assistant` : récupération de contenus, génération et références
- `identity` : compte, préférences et autorisations
- `delivery` : e-mail et canaux futurs derrière des adaptateurs

## Schéma logique préliminaire

- `users 1—N user_preferences`
- `sources 1—N source_items`
- `source_items N—N topics` via `source_item_topics`
- `knowledge_items 1—N citations N—1 sources`
- `laws 1—N legal_updates` ; chaque statut et date d’effet est lié à une citation
- `weekly_digests 1—N digest_items N—1 knowledge_items`
- `questions` et `flashcards` reliées aux éléments de connaissance pertinents
- `users 1—N quiz_attempts, oral_sessions, user_progress, notifications`
- `assistant_outputs 1—N assistant_output_citations N—1 citations`

Les noms et cardinalités seront traduits en migrations SQL après sélection du fournisseur PostgreSQL et de l’outil de migration.

## Flux de collecte cible

`source adapter → raw observation → normalization → canonical URL deduplication → topic assignment → verification status → knowledge item + citations`

La classification peut être assistée par un modèle, mais les faits et le statut de vérification proviennent des sources et du processus de validation. Les connecteurs doivent respecter les modalités d’accès publiées par chaque source.

## Décisions reportées

- Hébergement et fournisseur PostgreSQL
- Outil de migration et d’accès aux données
- Fournisseur d’authentification
- Fournisseur IA, règles de rétention et limites de coût
- Cadence et mécanisme de planification de la collecte
- Fournisseur e-mail et éventuel canal WhatsApp

Aucune clé ni intégration à un fournisseur externe n’est configurée à cette étape.

## Synchronisation hebdomadaire du prototype statique

Une automatisation récurrente Codex locale, « Synchroniser la veille Officier Watch », est active le lundi à 7 h. Elle recherche la semaine complète précédente, vérifie les liens et met à jour uniquement `data/veille.js` avec des contenus sourcés. Le bouton HTML « Synchroniser » recharge ce fichier dans le navigateur ; la collecte elle-même se fait dans la tâche planifiée, pas dans le navigateur. L’automatisation dépend de la disponibilité du planificateur local Codex.

Le rendu filtre les entrées incomplètes, exige des URLs HTTPS et insère les contenus via `textContent`. La génération conserve un nombre limité d’éléments et ne prétend pas que des informations non vérifiées sont établies.

## Prochain jalon

Phase 1 : choisir le fournisseur PostgreSQL et le système de migrations, définir le schéma minimal des sources, articles et citations, puis implémenter la gestion de sources et d’articles avec vérifications de traçabilité et de déduplication.
