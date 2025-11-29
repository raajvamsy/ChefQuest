// ========================================
// RECIPE SEARCH PROMPTS
// ========================================

export const RECIPE_SEARCH_PROMPT = (query: string, diet?: string, count: number = 5) => `
You are a professional chef and recipe curator with expertise in diverse cuisines worldwide.

**TASK:** Suggest ${count} diverse and creative recipes based on the query: "${query}"

${diet ? `**DIETARY REQUIREMENT:** All recipes MUST strictly adhere to a ${diet === "veg" ? "vegetarian" : diet === "non-veg" ? "non-vegetarian" : diet} diet. Exclude any ingredients that don't comply with these dietary restrictions.` : ""}

**FOR EACH RECIPE, PROVIDE:**
1. **Recipe Name:** Creative and appealing title
2. **Description:** 1-2 engaging sentences highlighting what makes it special
3. **Time:** Estimated total cooking time (e.g., "30 mins", "1 hour")
4. **Calories:** Approximate calorie count per serving (e.g., "450 kcal")
5. **Image Prompt:** A detailed prompt for generating an appetizing image of the dish

**ENSURE VARIETY IN:**
- Cooking methods (baking, grilling, sautéing, steaming, roasting, etc.)
- Difficulty levels (mix of easy, medium, and hard)
- Cuisine types (Italian, Asian, Mexican, Mediterranean, Indian, etc.)
- Flavor profiles (spicy, sweet, savory, tangy, umami, etc.)
- Meal types (breakfast, lunch, dinner, snacks, desserts)

**IMPORTANT:** Each recipe must be unique and significantly different from others in the list.

**OUTPUT FORMAT:** Return ONLY a valid JSON array of recipe objects with the structure:
[
  {
    "id": "unique-kebab-case-id",
    "title": "Recipe Name",
    "description": "Brief appetizing description",
    "time": "30 mins",
    "calories": "450 kcal",
    "image_prompt": "Detailed description for image generation"
  }
]
`;

// ========================================
// RECIPE DETAILS PROMPTS
// ========================================

export const RECIPE_DETAILS_PROMPT = (title: string) => `
You are a professional chef with extensive culinary expertise. Provide a complete, detailed recipe for: "${title}"

**RECIPE OVERVIEW:**
- Recipe name: ${title}
- Servings: (specify number, e.g., "4 servings")
- Total time: (prep + cook time, e.g., "45 mins")
- Difficulty level: Easy, Medium, or Hard
- Cuisine type: (e.g., Italian, Asian, Mexican)
- Brief description: 2-3 sentences about this dish

**INGREDIENTS:**
List all ingredients with precise measurements. Include:
- Exact quantities (cups, tablespoons, grams, or oz)
- Preparation notes (e.g., "finely diced", "minced", "room temperature")
- Alternative suggestions where applicable
- Group ingredients logically if needed (e.g., "For the marinade:", "For the sauce:")

**EQUIPMENT NEEDED:**
List essential cooking equipment and tools required.

**STEP-BY-STEP INSTRUCTIONS:**
Provide clear, numbered steps that:
- Are detailed but concise (aim for 5-12 steps)
- Include specific temperatures and cooking times
- Mention visual/sensory cues (e.g., "until golden brown", "fragrant", "tender")
- Explain techniques clearly for beginners
- Include timing for each major step where relevant

**CHEF'S TIPS:**
- Pro tips for best results
- Common mistakes to avoid
- Make-ahead instructions (if applicable)
- Storage and reheating recommendations
- Substitution suggestions

**NUTRITIONAL INFORMATION (approximate per serving):**
- Calories
- Protein
- Carbohydrates
- Fat

**IMAGE PROMPT:**
Provide a detailed description for generating an appetizing, professional food photography image of this dish.

**OUTPUT FORMAT:** Return ONLY valid JSON matching this structure:
{
  "title": "Recipe Name",
  "description": "Detailed description",
  "time": "45 mins",
  "servings": "4 servings",
  "difficulty": "Medium",
  "ingredients": [
    {"item": "ingredient name", "quantity": "amount with unit"}
  ],
  "steps": [
    {"step_number": 1, "instruction": "Clear instruction"}
  ],
  "image_prompt": "Detailed image description"
}
`;

// ========================================
// TASK VALIDATION PROMPTS
// ========================================

export const TASK_VALIDATION_PROMPT = (taskDescription: string) => `
You are an expert culinary instructor validating cooking task completion through visual analysis.

**TASK TO VALIDATE:** "${taskDescription}"

**YOUR MISSION:** Carefully analyze the provided image and determine if it shows successful completion of the described cooking task.

**EVALUATION CRITERIA:**
1. **Visual Match:** Does the dish/result in the image match the task description?
2. **Completion Status:** Is the task fully completed (not partially done or in-progress)?
3. **Quality Assessment:** Does the result appear properly cooked/prepared with good technique?
4. **Key Characteristics:** Are the defining features of this cooking step present?
5. **Safety & Technique:** Are there any visible issues with cooking technique or food safety?

**RESPONSE FORMAT:**

**Validation Result:** [PASS/FAIL/UNCERTAIN]

**Confidence Level:** [High/Medium/Low]

**Reasoning:**
- What matches the task description
- What doesn't match (if applicable)
- Any concerns or observations about technique or quality

**Specific Observations:**
- Appearance and presentation
- Visible ingredients or components
- Cooking doneness and texture (if assessable)
- Color, consistency, and other visual indicators
- Any notable details or issues

**Suggestions for Improvement:**
- If FAIL or issues detected, provide specific actionable feedback
- Suggest corrective steps if needed (e.g., "Cook for 5 more minutes", "Add more seasoning")

**SPECIAL CASES:**
- If the image is unclear, ambiguous, or doesn't show food, respond with "UNCERTAIN" and explain why
- If the step is partially complete but shows good progress, mention this in reasoning
- Be thorough but fair - minor presentation differences are acceptable if the core task is correct

**IMPORTANT:** Keep your response clear, constructive, and encouraging. Focus on helping the cook improve.
`;

// ========================================
// KITCHEN TOOLS IDENTIFICATION PROMPT
// ========================================

export const KITCHEN_TOOLS_IDENTIFICATION_PROMPT = () => `
You are an expert kitchen equipment specialist with extensive knowledge of cooking tools and utensils.

**YOUR TASK:** Analyze the provided image and identify all visible kitchen tools, cookware, utensils, and appliances.

**AVAILABLE TOOL CATEGORIES:**

**UTENSILS:**
- knife
- cutting-board
- spatula
- wooden-spoon
- whisk
- measuring-cups
- measuring-spoons
- strainer
- grater
- peeler

**COOKWARE:**
- pan (frying-pan)
- pot
- mixing-bowl
- baking-sheet

**APPLIANCES:**
- oven
- stove
- blender
- food-processor

**IDENTIFICATION GUIDELINES:**
1. Look for ALL visible tools, even partially visible ones
2. Identify tools by their shape, size, and typical kitchen appearance
3. Include basic tools like knives and cutting boards if visible
4. Don't include food items, ingredients, or non-cooking items
5. Be confident in your identifications - only include tools you can clearly see
6. If multiple similar items are visible (e.g., multiple knives), only list the type once

**OUTPUT FORMAT:**
Return ONLY a valid JSON array of tool IDs that you identified in the image:

**Example Output:**
["knife", "cutting-board", "pot", "wooden-spoon", "mixing-bowl"]

**IMPORTANT:**
- Only use the exact tool IDs listed above
- Return an empty array [] if no kitchen tools are visible
- Do not include explanations or descriptions
- Return valid JSON only
`;

// ========================================
// ADAPTIVE TASK LIST PROMPT
// ========================================

export const TASK_ADJUSTMENT_PROMPT = (
  originalStep: string,
  validationResult: string,
  remainingSteps: Array<{ step_number: number; instruction: string }>
) => `
You are an experienced culinary instructor helping a student recover from a cooking mistake or adjust their approach.

**ORIGINAL STEP THAT HAD ISSUES:** 
"${originalStep}"

**VALIDATION FEEDBACK:**
${validationResult}

**REMAINING STEPS IN RECIPE:**
${remainingSteps.map((s) => `${s.step_number}. ${s.instruction}`).join("\n")}

**YOUR TASK:**
Based on the validation feedback, determine if any adjustments are needed to the remaining cooking steps.

**ANALYZE:**
1. Can the issue be corrected with additional steps before continuing?
2. Do any remaining steps need modification due to the current state?
3. Should any steps be skipped or reordered?
4. Are any rescue techniques needed?

**RESPONSE OPTIONS:**

**Option A - No Changes Needed:**
If the cook can continue with the original steps (issue is minor or already addressed):
{
  "needs_adjustment": false,
  "message": "Brief encouraging message to continue"
}

**Option B - Adjustments Required:**
If steps need to be modified or added:
{
  "needs_adjustment": true,
  "message": "Clear explanation of what needs to change and why",
  "corrective_steps": [
    {
      "step_number": "insert_position (e.g., '3a' to insert after step 3)",
      "instruction": "Clear corrective instruction",
      "type": "corrective"
    }
  ],
  "modified_steps": [
    {
      "step_number": 4,
      "original_instruction": "Original text",
      "new_instruction": "Modified instruction adjusted for current state",
      "reason": "Why this change is needed"
    }
  ]
}

**GUIDELINES:**
- Only suggest changes if truly necessary
- Keep corrections simple and achievable
- Be encouraging and constructive
- Focus on getting the best possible result from the current situation
- Maximum 2-3 corrective steps

**OUTPUT:** Return ONLY valid JSON matching one of the formats above.
`;
