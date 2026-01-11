// questions.js
export const QUESTIONS = [
  { question: "Des makers utilisent les fablabs pour créer des prothèses ou aides techniques.", correct: true, explanation: "Oui. Beaucoup de fablabs soutiennent des projets d'assistance (prothèses, adaptations, aides techniques) via l'impression 3D et l'électronique." },
  { question: "Des fablabs organisent des ateliers intergénérationnels.", correct: true, explanation: "Oui. Ateliers enfants/parents, seniors, débutants : le fablab est souvent un lieu de transmission entre publics." },
  { question: "Des enfants apprennent à coder ou modéliser en fablab.", correct: true, explanation: "Oui. Scratch, Arduino, modélisation 3D… les fablabs proposent souvent des initiations adaptées." },
  { question: "Certains fablabs sont accessibles aux personnes en situation de handicap.", correct: true, explanation: "Oui. Certains lieux adaptent l'accueil et les postes de travail, ou mènent des projets inclusifs avec des partenaires." },
  { question: "Il existe des fablabs dans des bibliothèques, des écoles et des centres sociaux.", correct: true, explanation: "Oui. Les fablabs peuvent être intégrés à des structures publiques/associatives : écoles, médiathèques, maisons de quartier." },
  { question: "Des fablabs ont été créés à l'initiative de citoyens.", correct: true, explanation: "Oui. Beaucoup naissent de collectifs locaux qui veulent mutualiser outils, savoir-faire et projets." },
  { question: "Des fablabs participent à des projets de recherche scientifique.", correct: true, explanation: "Oui. Prototypage rapide, instrumentation, tests : certains fablabs collaborent avec universités, écoles, labs." },
  { question: "Des fablabs organisent des hackathons citoyens.", correct: true, explanation: "Oui. Il arrive qu'ils animent des événements de co-création (solutions locales, écologie, mobilité, inclusion)." },
  { question: "Certains fablabs ont des règles de sécurité strictes.", correct: true, explanation: "Oui. Machines + outils = procédures : formation, EPI, encadrement, zones dédiées, etc." },
  { question: "Des fablabs utilisent des logiciels libres pour la modélisation.", correct: true, explanation: "Oui. On peut y utiliser Blender, FreeCAD, Inkscape, etc. (même si certains utilisent aussi des logiciels propriétaires)." },

  { question: "Tous les fablabs sont ouverts 24h/24 et 7j/7.", correct: false, explanation: "Non. Les horaires dépendent du lieu, de l'équipe, des bénévoles, et des contraintes de sécurité." },
  { question: "On peut utiliser toutes les machines sans aucune formation.", correct: false, explanation: "Non. La plupart des machines nécessitent une initiation (sécurité + bonnes pratiques) avant usage autonome." },
  { question: "Tous les projets réalisés en fablab sont automatiquement open source.", correct: false, explanation: "Non. Le partage est encouragé, mais un projet peut rester privé. Cela dépend des règles du lieu et du choix du maker." },
  { question: "Les fablabs sont toujours gratuits pour tout le monde.", correct: false, explanation: "Non. Beaucoup demandent une cotisation, un coût matière, ou un tarif atelier (parfois socialement modulé)." },
  { question: "Il n'y a jamais de règles dans un fablab.", correct: false, explanation: "Non. Il y a presque toujours un cadre : sécurité, réservation machines, respect du matériel, usage des espaces." },
  { question: "Les fablabs sont réservés aux ingénieurs et techniciens.", correct: false, explanation: "Non. Le principe d'un fablab, c'est l'ouverture : curieux, artistes, étudiants, bricoleurs, pros…" },
  { question: "On peut y fabriquer une voiture roulante et homologuée pour la route en une journée.", correct: false, explanation: "Non. Un fablab aide à prototyper, mais fabriquer une voiture complète homologuée en 24h n'est pas réaliste." },
  { question: "Les fablabs ne servent qu'à imprimer des gadgets.", correct: false, explanation: "Non. On y fait du prototypage utile, de la réparation, de l'apprentissage, des objets fonctionnels, artistiques, éducatifs." },
  { question: "Il n'y a pas besoin de respecter les règles de sécurité.", correct: false, explanation: "Non. C'est l'inverse : la sécurité est centrale (machines dangereuses, outils coupants, lasers, etc.)." },
  { question: "Les fablabs sont des magasins de bricolage.", correct: false, explanation: "Non. Un fablab est un lieu de fabrication/formation/communauté, pas une surface de vente de matériel." }
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
export const MAX_GAMES = Math.ceil(TOTAL_QUESTIONS / 5);
