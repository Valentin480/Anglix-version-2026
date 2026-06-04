import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateLessonWithAI = async (
  topic: string, 
  level: string, 
  includeVideo: boolean = true,
  attachments?: { data: string; mimeType: string }[]
) => {
  const hasAttachments = attachments && attachments.length > 0;
  
  const videoInstruction = includeVideo 
    ? `CONSIGNES POUR YOUTUBE (RAPIDITÉ ET PRÉCISION) :
    - Utilise l'outil de recherche Google pour trouver IMMÉDIATEMENT une vidéo YouTube RÉELLE, ACTIVE et PERTINENTE.
    - PRIORITÉS ABSOLUES PAR MATIÈRE :
      * MATHÉMATIQUES : Cherche en priorité la chaîne "@YMONKA" (Yvan Monka).
      * HISTOIRE / GÉOGRAPHIE : Cherche en priorité "C'est pas sorcier".
      * AUTRES : "L'Antisèche", "Digischool", "Lumni".
    - L'identifiant doit être un ID de 11 caractères valide.
    - Fournis également un 'youtubeSearchQuery' optimisé pour retrouver la vidéo (ex: "Yvan Monka [sujet]").`
    : `CONSIGNES POUR YOUTUBE :
    - Ne cherche PAS de vidéo YouTube. Laisse 'youtubeId' et 'youtubeSearchQuery' vides.`;

  const contextPrompt = hasAttachments 
    ? `ANALYSE DE DOCUMENTS : J'ai joint ${attachments.length} document(s) (images ou PDF) qui contiennent un cours. 
       TON DEVOIR : Analyse ces documents avec une précision chirurgicale. 
       - Si l'utilisateur a aussi donné un sujet ("${topic}"), utilise-le comme axe de lecture.
       - Sinon, identifie le sujet principal des documents pour créer la fiche.`
    : `Génère une leçon de révision complète et un quiz pour le sujet suivant : "${topic}" pour un niveau scolaire précis : "${level}".`;

  const contents: any = {
    parts: [
      { text: `${contextPrompt}
    
    CONSIGNES POUR LA FICHE DE RÉVISION :
    - OBJECTIF : Ultra-lisible en 10 secondes. Zéro blabla. Uniquement l'essentiel.
    - STYLE : Style "Fiche Bristol" ou "Flashcard".
    - STRUCTURE :
      * Titres en gros (##)
      * Sous-parties (###)
      * Listes à puces (claires et courtes)
      * Sauts de lignes fréquents pour aérer
    - CODE COULEUR (Utilise ces balises HTML spécifiques) :
      * <div class="revision-def">...</div> pour les DÉFINITIONS (Rouge)
      * <div class="revision-formula">...</div> pour les FORMULES / RÈGLES (Bleu)
      * <div class="revision-example">...</div> pour les EXEMPLES concrets (Vert)
      * <div class="revision-tip">...</div> pour les ASTUCES / PIÈGES (Jaune)
    - CONTENU :
      * Utilise des mots-clés plutôt que des phrases longues.
      * Ajoute des schémas simples avec des flèches (➜, ➔) ou des tableaux Markdown.
      * Maximum 15-20 lignes de texte au total.
      * Un concept = un exemple simple.
      * Utilise des emojis pertinents pour illustrer les points clés.
    - Souligne les points cruciaux avec <u></u>.
    - Fournis un 'imageSearchTerm' pour illustrer la leçon.

    CONSIGNES POUR LE QUIZ :
    - Génère exactement 20 questions variées (pour assurer une réponse rapide et fiable).
    - Types de questions autorisés : 
      * 'qcm' (4 options, correctAnswer est l'index 0-3)
      * 'true_false' (2 options: Vrai/Faux, correctAnswer est l'index 0-1)
      * 'fill_in_the_blank' (Pas d'options, correctAnswer est le mot manquant)
      * 'calculation' (Pour les maths, pas d'options, correctAnswer est le résultat numérique)
      * 'open_ended' (Question courte, pas d'options, correctAnswer est la réponse attendue)
    - **IMPORTANT : ILLUSTRATIONS (DIAGRAMMES SVG)** :
      * Pour les questions de géométrie, de sciences (SVT/Physique) ou de géographie, génère un code SVG simple et clair dans le champ 'diagram'.
      * Le SVG doit être contenu dans une balise <svg viewBox="0 0 200 200">.
      * Utilise des couleurs sobres (noir, gris, bleu clair).
      * Exemple pour un triangle : <polygon points="50,150 150,150 100,50" fill="none" stroke="black" stroke-width="2" />.
      * Ajoute des labels textuels si nécessaire (<text x="..." y="...">Label</text>).
    - Répartis les types de manière équilibrée.
    - Les questions doivent couvrir tous les aspects du sujet, du plus simple au plus complexe.
    - Ajoute une courte explication pour chaque réponse.

    ${videoInstruction}

    La réponse doit être au format JSON.` },
      ...(attachments || []).map(at => ({
        inlineData: {
          data: at.data,
          mimeType: at.mimeType
        }
      }))
    ]
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [contents],
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          explanation: { type: Type.STRING },
          imageSearchTerm: { type: Type.STRING, description: "Terme de recherche pour une image d'illustration (ex: 'cellule végétale')" },
          youtubeId: { type: Type.STRING, description: "L'ID de 11 caractères de la vidéo YouTube réelle trouvée via Google Search" },
          youtubeSearchQuery: { type: Type.STRING, description: "Requête de recherche YouTube précise pour retrouver la vidéo (ex: 'cours svt la mitose l'antiseche')" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["qcm", "fill_in_the_blank", "true_false", "calculation", "open_ended"] },
                diagram: { type: Type.STRING, description: "Code SVG optionnel pour illustrer la question (ex: schéma géométrique, cellule, graphique)" },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  nullable: true
                },
                correctAnswer: { type: Type.STRING, description: "L'index pour QCM/Vrai-Faux, ou la réponse texte/numérique pour les autres" },
                explanation: { type: Type.STRING }
              },
              required: ["text", "type", "correctAnswer"]
            }
          }
        },
        required: ["title", "category", "explanation", "questions", "youtubeId", "imageSearchTerm"]
      }
    }
  });

  if (!response.text) {
    console.error("Gemini Response Error:", response);
    if (response.candidates?.[0]?.finishReason) {
      throw new Error(`L'IA a arrêté la génération : ${response.candidates[0].finishReason}`);
    }
    throw new Error("Aucune réponse de l'IA (le texte est vide)");
  }

  return JSON.parse(response.text);
};
