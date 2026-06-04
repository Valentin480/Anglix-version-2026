import { Lesson, SchoolLevel } from '../types';

const levels: SchoolLevel[] = ['Primaire', 'Collège', 'Lycée', 'Supérieur'];

const mockLessons: Lesson[] = [
  // PRIMAIRE
  {
    id: 'pri-math-1',
    title: 'Les Additions Posées',
    category: 'Mathématiques',
    level: 'Primaire',
    difficulty: 1,
    explanation: 'L\'addition posée permet de calculer de grands nombres. On aligne les unités sous les unités, les dizaines sous les dizaines. Si la somme d\'une colonne dépasse 9, on utilise une retenue.',
    questions: [
      { id: 'q1', text: 'Combien font 15 + 27 ?', options: ['32', '42', '52', '45'], correctAnswer: 1 },
      { id: 'q2', text: 'Où place-t-on la retenue si 8 + 5 = 13 ?', options: ['Dans la colonne des unités', 'Dans la colonne des dizaines', 'On ne la place pas', 'Dans le résultat final'], correctAnswer: 1 }
    ]
  },
  // COLLÈGE
  {
    id: 'col-hist-1',
    title: 'L\'Empire Romain',
    category: 'Histoire',
    level: 'Collège',
    difficulty: 2,
    explanation: 'L\'Empire Romain a dominé le bassin méditerranéen pendant des siècles. Fondé en 27 av. J.-C. par Auguste, il a apporté la "Pax Romana", une période de paix et de prospérité relative.',
    questions: [
      { id: 'q1', text: 'Qui est le premier empereur romain ?', options: ['Jules César', 'Auguste', 'Néron', 'Marc Aurèle'], correctAnswer: 1 },
      { id: 'q2', text: 'Comment appelle-t-on la période de paix romaine ?', options: ['Pax Romana', 'Pax Italica', 'Pax Imperia', 'Pax Latina'], correctAnswer: 0 }
    ]
  },
  // LYCÉE
  {
    id: 'lyc-philo-1',
    title: 'La Liberté chez Kant',
    category: 'Philosophie',
    level: 'Lycée',
    difficulty: 3,
    explanation: 'Pour Kant, la liberté n\'est pas faire ce que l\'on veut, mais obéir à la loi que l\'on s\'est prescrite. C\'est l\'autonomie de la volonté. La liberté est un postulat de la raison pratique.',
    questions: [
      { id: 'q1', text: 'Qu\'est-ce que l\'autonomie pour Kant ?', options: ['Faire ce qu\'on veut', 'Obéir à ses instincts', 'Se donner sa propre loi', 'L\'absence de lois'], correctAnswer: 2 },
      { id: 'q2', text: 'La liberté est un postulat de la raison...', options: ['Pure', 'Pratique', 'Critique', 'Sensible'], correctAnswer: 1 }
    ]
  },
  // SUPÉRIEUR
  {
    id: 'sup-info-1',
    title: 'Algorithmique Avancée',
    category: 'Informatique',
    level: 'Supérieur',
    difficulty: 3,
    explanation: 'La complexité algorithmique se mesure souvent avec la notation Grand O. Un algorithme de tri comme QuickSort a une complexité moyenne de O(n log n).',
    questions: [
      { id: 'q1', text: 'Quelle est la complexité de QuickSort en moyenne ?', options: ['O(n)', 'O(n^2)', 'O(n log n)', 'O(1)'], correctAnswer: 2 },
      { id: 'q2', text: 'Que signifie O(1) ?', options: ['Complexité linéaire', 'Complexité constante', 'Complexité infinie', 'Complexité nulle'], correctAnswer: 1 }
    ]
  }
];

const generateMore = (count: number): Lesson[] => {
  const extra: Lesson[] = [];
  const categories = ['Français', 'Maths', 'Physique', 'SVT', 'Anglais', 'Espagnol', 'Géo', 'Éco'];
  
  for (let i = 0; i < count; i++) {
    const level = levels[i % levels.length];
    const cat = categories[i % categories.length];
    extra.push({
      id: `gen-${i}`,
      title: `${cat} - Module ${Math.floor(i / levels.length) + 1}`,
      category: cat,
      level: level,
      difficulty: (i % 3 + 1) as 1 | 2 | 3,
      explanation: `Fiche de révision détaillée pour le niveau ${level}. Ce module couvre les points clés du programme de ${cat}. Étudiez attentivement ces concepts pour réussir le quiz final.`,
      questions: [
        { id: 'q1', text: `Question de révision sur ${cat} (${level}) ?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0 },
        { id: 'q2', text: `Vrai ou Faux : Le concept de ${cat} est fondamental ?`, options: ['Vrai', 'Faux', 'Incertain', 'N/A'], correctAnswer: 0 }
      ]
    });
  }
  return extra;
};

export const ALL_LESSONS = [...mockLessons, ...generateMore(500)];
