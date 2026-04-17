import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateMealPlan = async (userProfile: any, date: string, customPrefs: any) => {
  const prompt = `
    Generate a daily meal plan for an Indian user with the following profile:
    - Age: ${userProfile.age}
    - Gender: ${userProfile.gender}
    - Weight: ${userProfile.weight} kg
    - Height: ${userProfile.height} cm
    - Activity Level: ${userProfile.activityLevel}
    - Dietary Preference: ${customPrefs.diet}
    - Cuisine Preferences: ${customPrefs.cuisine || userProfile.cuisinePreferences?.join(', ') || 'Any Indian'}
    - Dislikes/Allergies: ${customPrefs.dislikedFoods || userProfile.dislikes || 'None'}
    - Health Issues: ${customPrefs.healthIssues?.join(', ') || 'None'}
    - Target Daily Calories: ${customPrefs.calories} kcal
    
    The meal plan should include Breakfast, Lunch, Snack, and Dinner.
    Ensure the total calories are close to the target.
    Provide realistic portion sizes and macronutrient breakdown (protein, carbs, fat) for each meal.
    Also provide brief recipe instructions on how to prepare each meal.
    
    CRITICAL REGIONAL ACCURACY RULES:
    1. You MUST strictly adhere to the requested "Cuisine Preferences".
    2. DO NOT mix regional cuisines. If "South Indian" is selected, ONLY provide authentic South Indian dishes (e.g., Idli, Dosa, Appam, Puttu, Rice, Sambar, Rasam, Poriyal). DO NOT suggest Poha, Roti, Paratha, or Chole for a South Indian plan.
    3. If "North Indian" is selected, provide authentic North Indian dishes (e.g., Roti, Paratha, Dal Makhani, Sabzi, Poha, Chole). DO NOT suggest Idli, Dosa, or Appam.
    4. Ensure food pairings are culturally accurate and realistic. For example, pair Roti with Sabzi or Dal. Pair Rice with Sambar, Rasam, or Dal. NEVER pair Roti with Sambar.
    
    IMPORTANT: Use 'katori' (small bowl) as a standard unit of measurement for portion control where applicable (e.g., 1 katori dal, 1 katori rice). A standard Indian katori holds approx 150-180g of liquids/curd and 100-120g of solids.
    IMPORTANT: If the dietary preference is non-vegetarian, DO NOT make every single item non-vegetarian. You MUST include normal staple foods like roti, chapati, paratha, rice, dal, and vegetables to create a realistic and balanced Indian meal.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCalories: { type: Type.NUMBER },
            totalProtein: { type: Type.NUMBER },
            totalCarbs: { type: Type.NUMBER },
            totalFat: { type: Type.NUMBER },
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mealType: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Snack', 'Dinner'] },
                  foodName: { type: Type.STRING },
                  portionSize: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  recipeHint: { type: Type.STRING },
                  recipeInstructions: { type: Type.STRING }
                },
                required: ['mealType', 'foodName', 'portionSize', 'calories', 'protein', 'carbs', 'fat', 'recipeInstructions']
              }
            }
          },
          required: ['totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'meals']
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw error;
  }
};

export const chatWithAssistant = async (userProfile: any, todayLogs: any[], message: string, history: any[] = []) => {
  const systemInstruction = `
    You are NutritionPal, a friendly AI nutrition assistant specialized in Indian diets.
    User Profile:
    - BMI: ${userProfile.bmi}
    - Target Calories: ${userProfile.dailyCalorieTarget}
    - Diet: ${userProfile.dietaryPreference}
    - Cuisines: ${userProfile.cuisinePreferences?.join(', ') || 'Any'}
    
    Today's Food Logs:
    ${todayLogs.map(log => `- ${log.foodName} (${log.calories} kcal)`).join('\n')}
    
    Provide helpful, concise, and culturally relevant advice.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3.1-flash-lite-preview',
      config: {
        systemInstruction,
      }
    });
    
    // Replay history if needed (simplified for now, just sending the latest message)
    // In a real app, we'd pass history to the chat creation or send sequentially.
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Error chatting with assistant:", error);
    throw error;
  }
};

export const searchFoodDatabase = async (query: string, dietaryPreference: string) => {
  const prompt = `
    Search for Indian food items matching the query: "${query}".
    Dietary restriction: ${dietaryPreference}.
    IMPORTANT: Use 'katori' (small bowl) as a standard unit of measurement for portion control where applicable (e.g., 1 katori dal, 1 katori rice). A standard Indian katori holds approx 150-180g of liquids/curd and 100-120g of solids.
    Return a comprehensive list of up to 15 matching food items with their nutritional info per standard serving. Include various regional variations, street foods, and home-cooked styles if applicable. Also provide brief recipe instructions on how to prepare each item.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING },
              portionSize: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              recipeInstructions: { type: Type.STRING }
            },
            required: ['foodName', 'portionSize', 'calories', 'protein', 'carbs', 'fat', 'recipeInstructions']
          }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error searching food:", error);
    return [];
  }
};

export const analyzeRecipe = async (recipeText: string) => {
  const prompt = `
    Analyze the following Indian recipe ingredients and quantities:
    "${recipeText}"
    
    Calculate the total nutritional value for the entire recipe based on the raw ingredients provided.
    Then, suggest a standard serving size (e.g., "1 katori", "2 pieces") and provide the nutritional value per serving.
    Also provide step-by-step recipe instructions on how to make it based on the ingredients.
    Remember: A standard Indian katori holds approx 150-180g of liquids/curd and 100-120g of solids.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipeName: { type: Type.STRING },
            totalNutrition: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER }
              },
              required: ['calories', 'protein', 'carbs', 'fat']
            },
            servingSize: { type: Type.STRING },
            perServingNutrition: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER }
              },
              required: ['calories', 'protein', 'carbs', 'fat']
            },
            recipeInstructions: { type: Type.STRING }
          },
          required: ['recipeName', 'totalNutrition', 'servingSize', 'perServingNutrition', 'recipeInstructions']
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error analyzing recipe:", error);
    throw error;
  }
};
export const getRecommendedFoods = async (dietaryPreference: string, mealType: string, healthIssues: string[] = [], cuisinePreference: string = 'Any Indian') => {
  const prompt = `
    Suggest 15 diverse, common, and healthy Indian food items suitable for ${mealType}.
    Dietary restriction: ${dietaryPreference}.
    Cuisine Preference: ${cuisinePreference}.
    ${healthIssues.length > 0 ? `Health conditions to consider (avoid triggering foods): ${healthIssues.join(', ')}.` : ''}
    
    CRITICAL REGIONAL ACCURACY RULES:
    1. You MUST strictly adhere to the requested "Cuisine Preference". If "South Indian" is requested, ONLY provide authentic South Indian foods. DO NOT suggest North Indian items like Poha or Paratha for South Indian.
    2. Ensure food pairings are culturally accurate (e.g., NEVER pair Roti with Sambar).
    
    IMPORTANT: Provide a very wide variety of foods from the requested cuisine, including home-cooked meals, popular regional breakfasts/snacks, and healthy street food alternatives.
    If the dietary restriction allows non-vegetarian food, DO NOT restrict the suggestions to ONLY non-vegetarian items. You MUST include normal staple foods like roti, chapati, paratha, rice, dal, and vegetables as well. Provide a balanced mix.
    
    Return a list of 15 matching food items with their nutritional info per standard serving. Also provide brief recipe instructions on how to prepare each item.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING },
              portionSize: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              recipeInstructions: { type: Type.STRING }
            },
            required: ['foodName', 'portionSize', 'calories', 'protein', 'carbs', 'fat', 'recipeInstructions']
          }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error getting recommended foods:", error);
    return [];
  }
};
