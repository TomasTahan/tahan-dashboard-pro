/**
 * Servicio para hacer matching de descripciones de gastos con categorías de Odoo
 * Lee las categorías desde un archivo JSON local
 */

import categoriesData from "./categories.json";

export interface CategoryMatch {
  odoo_id: number;
  name: string;
  code: string | null;
  keywords: string[];
  confidence: number; // 0-1, qué tan seguro está del match
}

interface CategoryData {
  odoo_id: number;
  name: string;
  code: string | null;
  keywords: string[];
}

// Cargar categorías del archivo JSON
const categories: CategoryData[] = categoriesData as CategoryData[];

console.log(`📚 Categorías cargadas: ${categories.length}`);

/**
 * Busca la mejor categoría de gasto basada en una descripción y/o keywords
 * @param description - Descripción del gasto
 * @param aiKeywords - Keywords sugeridas por la IA (opcional, priorizadas si están disponibles)
 */
export async function findBestCategory(
  description: string,
  aiKeywords?: string[]
): Promise<CategoryMatch | null> {
  if (!description || description.trim().length === 0) {
    return null;
  }

  const normalizedDesc = description.toLowerCase().trim();

  try {
    // 1. Si hay keywords de la IA, priorizarlas para matching exacto
    if (aiKeywords && aiKeywords.length > 0) {
      console.log(`Usando keywords del agente IA: ${aiKeywords.join(", ")}`);

      // Intentar match con cada keyword del agente
      for (const aiKeyword of aiKeywords) {
        const normalizedAiKeyword = aiKeyword.toLowerCase().trim();

        // Buscar en categorías que contengan este keyword
        const aiMatches = categories.filter((cat) =>
          cat.keywords.some((kw) => kw.toLowerCase() === normalizedAiKeyword)
        );

        if (aiMatches.length > 0) {
          console.log(
            `Match encontrado con keyword IA "${aiKeyword}": ${aiMatches[0].name}`
          );
          return {
            ...aiMatches[0],
            confidence: 0.95, // Alta confianza por match con keyword de IA
          };
        }
      }
    }

    // 2. Intentar match exacto con la descripción
    const exactMatches = categories.filter((cat) =>
      cat.keywords.some((kw) => kw.toLowerCase() === normalizedDesc)
    );

    if (exactMatches.length > 0) {
      return {
        ...exactMatches[0],
        confidence: 1.0, // Match exacto
      };
    }

    // 3. Intentar match parcial (buscar si alguna keyword está contenida en la descripción o keywords IA)
    const searchTerms = [normalizedDesc];
    if (aiKeywords) {
      searchTerms.push(...aiKeywords.map((kw) => kw.toLowerCase().trim()));
    }

    // Buscar matches parciales
    const partialMatches: Array<CategoryMatch & { matchCount: number }> = [];

    for (const category of categories) {
      const categoryKeywords = category.keywords || [];
      let matchCount = 0;
      let aiKeywordMatch = false;

      for (const categoryKeyword of categoryKeywords) {
        const normalizedCategoryKeyword = categoryKeyword.toLowerCase();

        // Check contra todos los términos de búsqueda
        for (const searchTerm of searchTerms) {
          if (
            searchTerm.includes(normalizedCategoryKeyword) ||
            normalizedCategoryKeyword.includes(searchTerm)
          ) {
            matchCount++;

            // Dar más peso si el match fue con un keyword de IA
            if (
              aiKeywords &&
              aiKeywords.some((kw) => kw.toLowerCase() === searchTerm)
            ) {
              aiKeywordMatch = true;
            }
            break; // No contar múltiples veces el mismo keyword
          }
        }
      }

      if (matchCount > 0) {
        // Calcular confianza: mayor si hay match con keywords de IA
        let confidence = Math.min(matchCount / categoryKeywords.length, 1.0);
        if (aiKeywordMatch) {
          confidence = Math.min(confidence * 1.2, 0.9); // Boost de confianza
        }

        partialMatches.push({
          odoo_id: category.odoo_id,
          name: category.name,
          code: category.code,
          keywords: categoryKeywords,
          confidence,
          matchCount,
        });
      }
    }

    // Ordenar por matchCount descendente y luego por confidence
    partialMatches.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.confidence - a.confidence;
    });

    if (partialMatches.length > 0) {
      const { matchCount, ...bestMatch } = partialMatches[0];
      console.log(
        `Match parcial encontrado: ${bestMatch.name} (${matchCount} keywords coincidentes, confianza: ${bestMatch.confidence.toFixed(2)})`
      );
      return bestMatch;
    }

    return null;
  } catch (error) {
    console.error("Error in findBestCategory:", error);
    return null;
  }
}

/**
 * Busca múltiples posibles categorías para una descripción
 */
export async function findPossibleCategories(
  description: string,
  limit: number = 5
): Promise<CategoryMatch[]> {
  if (!description || description.trim().length === 0) {
    return [];
  }

  const normalizedDesc = description.toLowerCase().trim();

  try {
    const matches: Array<CategoryMatch & { matchCount: number }> = [];

    for (const category of categories) {
      const keywords = category.keywords || [];
      let matchCount = 0;

      for (const keyword of keywords) {
        const normalizedKeyword = keyword.toLowerCase();

        if (
          normalizedDesc.includes(normalizedKeyword) ||
          normalizedKeyword.includes(normalizedDesc)
        ) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        matches.push({
          odoo_id: category.odoo_id,
          name: category.name,
          code: category.code,
          keywords: keywords,
          confidence: Math.min(matchCount / keywords.length, 1.0),
          matchCount,
        });
      }
    }

    // Ordenar y limitar
    matches.sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.confidence - a.confidence;
    });

    return matches.slice(0, limit).map(({ matchCount, ...match }) => match);
  } catch (error) {
    console.error("Error in findPossibleCategories:", error);
    return [];
  }
}

/**
 * Obtiene una categoría por su odoo_id desde el archivo JSON
 */
export async function getCategoryByOdooId(
  odooId: number
): Promise<CategoryMatch | null> {
  try {
    const category = categories.find((cat) => cat.odoo_id === odooId);

    if (!category) {
      return null;
    }

    return {
      ...category,
      confidence: 1.0,
    };
  } catch (error) {
    console.error("Error in getCategoryByOdooId:", error);
    return null;
  }
}

/**
 * Obtiene todas las categorías disponibles
 */
export async function getAllCategories(): Promise<CategoryMatch[]> {
  try {
    return categories.map((cat) => ({
      ...cat,
      confidence: 1.0,
    }));
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    return [];
  }
}
