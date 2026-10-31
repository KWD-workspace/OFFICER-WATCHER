# Officier Watch

Studio web statique en HTML et CSS pour organiser la veille et les révisions du concours d’Officier de la Police nationale.

## Ouvrir le studio

Ouvre `index.html` dans un navigateur. Aucune installation ou compilation n’est requise. Les sections de navigation utilisent des ancres HTML ; la mise en page s’adapte aux petits écrans.

## Synchroniser la veille

Une tâche hebdomadaire Codex est programmée le lundi à 7 h. Elle recherche les informations publiées pendant la semaine précédente, vérifie les sources et met à jour `data/veille.js`. Dans le studio, le bouton **Synchroniser** recharge ce fichier. Il ne déclenche pas une nouvelle recherche web à la demande.

La collecte planifiée dépend de l’exécution des automatisations locales Codex. Les actualités ne sont affichées que si elles possèdent au minimum un titre, une date, un résumé et un lien HTTPS vers une source. Le script construit le contenu avec `textContent` et ouvre les liens externes avec `noopener noreferrer`.

## Explorer et réviser l’archive

La veille peut être filtrée sur 7, 30 ou 90 jours, sur un an, ou sur une période personnalisée. La recherche porte sur les titres, résumés, points clés et tags ; les catégories peuvent également être sélectionnées. Les favoris, articles révisés et meilleurs scores sont conservés dans le navigateur utilisé. Le quiz complet pose une question par actualité archivée ; le quiz rapide en pose cinq. Les cartes mémoire utilisent les points clés sourcés, et la simulation orale permet de comparer sa réponse à la synthèse et aux repères de l’actualité. Le Copilote et la Bibliothèque retrouvent les contenus archivés et leurs sources ; la section Lois & réformes rassemble les sujets juridiques.

## Fichiers

- `index.html` — contenu et navigation du studio
- `styles.css` — mise en forme responsive, sans police ni bibliothèque externe
- `studio.js` — synchronisation du fichier hebdomadaire et rendu des actualités
- `data/veille.js` — dernières données de veille vérifiées
- `docs/architecture.md` — architecture envisagée pour les fonctions dynamiques à venir

## Limites actuelles

Le studio reste un site statique : les favoris et la progression sont propres à un navigateur et ne sont pas synchronisés entre appareils. Le Copilote recherche des contenus pertinents dans l’archive et ne rédige pas de réponses générées par IA. La tâche hebdomadaire Codex met à jour le fichier de données local ; le bouton **Synchroniser** recharge ce fichier dans le studio, mais ne lance pas une recherche web ni une publication GitHub. Pour mettre à jour GitHub Pages, la nouvelle version des données doit être publiée dans le dépôt. Aucun contenu d’actualité fictif n’est affiché comme un fait.
