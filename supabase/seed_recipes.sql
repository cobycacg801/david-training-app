-- Sample recipes for David Training App
-- Run in Supabase SQL Editor to populate the nutrition library

INSERT INTO recipes (title, description, category, calories, prep_time, ingredients, instructions, min_plan, published) VALUES
  (
    'High-Protein Chicken Bowl',
    'Lean grilled chicken over brown rice with roasted veggies. Perfect post-workout meal to maximize muscle recovery.',
    'high-protein',
    620,
    '25 min',
    ARRAY[
      '200g chicken breast',
      '1 cup brown rice (cooked)',
      '1 cup broccoli florets',
      '1/2 red bell pepper, sliced',
      '2 tbsp olive oil',
      '1 tsp garlic powder',
      '1 tsp smoked paprika',
      'Salt & pepper to taste',
      'Squeeze of lemon'
    ],
    ARRAY[
      'Season chicken breast with garlic powder, smoked paprika, salt and pepper.',
      'Heat 1 tbsp olive oil in a skillet over medium-high heat. Cook chicken 6–7 minutes per side until cooked through. Let rest 5 minutes, then slice.',
      'Steam or roast broccoli and bell pepper with remaining olive oil at 400°F for 15 minutes until slightly charred.',
      'Plate brown rice as the base, top with sliced chicken and roasted vegetables.',
      'Finish with a squeeze of fresh lemon. Serve hot.'
    ],
    'base',
    true
  ),
  (
    'Overnight Protein Oats',
    'Prep the night before and wake up to a ready-made high-protein breakfast. No excuses for skipping breakfast.',
    'high-protein',
    480,
    '5 min (prep night before)',
    ARRAY[
      '1 cup rolled oats',
      '1 scoop vanilla whey protein',
      '1 cup unsweetened almond milk',
      '1/2 cup Greek yogurt (plain)',
      '1 tbsp chia seeds',
      '1 tbsp almond butter',
      '1/2 banana, sliced',
      '1 tsp honey',
      'Pinch of cinnamon'
    ],
    ARRAY[
      'Add oats, protein powder, chia seeds, and cinnamon to a mason jar or container with a lid.',
      'Pour in almond milk and stir until combined. The mixture will look liquid — it thickens overnight.',
      'Add Greek yogurt and fold in gently.',
      'Seal and refrigerate overnight (at least 6 hours).',
      'In the morning, top with sliced banana, almond butter, and a drizzle of honey. Eat cold or warm for 90 seconds in microwave.'
    ],
    'base',
    true
  ),
  (
    'Pre-Workout Power Smoothie',
    'Fast-absorbing carbs and caffeine-free energy boost. Drink 30–45 minutes before training for peak performance.',
    'pre-workout',
    310,
    '5 min',
    ARRAY[
      '1 medium banana (frozen)',
      '1/2 cup frozen mango chunks',
      '1 scoop unflavored or vanilla protein',
      '1 cup coconut water',
      '1 tbsp rolled oats',
      '1 tsp spirulina powder (optional)',
      '1/2 tsp ginger, grated',
      '4–5 ice cubes'
    ],
    ARRAY[
      'Add all ingredients to a high-speed blender.',
      'Blend on high for 45–60 seconds until completely smooth.',
      'If too thick, add a splash more coconut water.',
      'Pour into a large glass and drink immediately.',
      'Consume 30–45 minutes before your workout for optimal energy.'
    ],
    'base',
    true
  ),
  (
    'Salmon & Sweet Potato Recovery Plate',
    'Anti-inflammatory omega-3s from salmon paired with complex carbs from sweet potato. David''s go-to recovery meal.',
    'recovery',
    580,
    '30 min',
    ARRAY[
      '180g salmon fillet (skin on)',
      '1 medium sweet potato',
      '2 cups baby spinach',
      '1/2 avocado, sliced',
      '2 tbsp olive oil',
      '1 tbsp soy sauce (low sodium)',
      '1 tsp sesame oil',
      '1 clove garlic, minced',
      'Fresh dill or parsley',
      'Lemon wedge'
    ],
    ARRAY[
      'Preheat oven to 425°F. Pierce sweet potato several times with a fork, rub with 1 tsp olive oil, and bake 40–45 minutes until tender.',
      'Mix soy sauce, sesame oil, garlic, and 1 tsp olive oil. Brush over salmon fillet.',
      'Heat remaining oil in oven-safe skillet over medium-high heat. Sear salmon skin-side up for 3 minutes. Flip and transfer to oven for 8–10 minutes.',
      'Halve the sweet potato. Arrange spinach and avocado on the plate.',
      'Place salmon and sweet potato alongside the greens. Finish with fresh herbs and lemon. Eat within 45 minutes post-workout.'
    ],
    'base',
    true
  ),
  (
    'Egg White & Veggie Scramble',
    'Clean lean protein breakfast with zero unnecessary fat. High volume, low calorie — keeps you full and fueled.',
    'high-protein',
    290,
    '10 min',
    ARRAY[
      '6 egg whites (or 3/4 cup liquid egg whites)',
      '1 whole egg',
      '1/2 cup cherry tomatoes, halved',
      '1 cup baby spinach',
      '1/4 onion, diced',
      '1/4 cup mushrooms, sliced',
      '1 tsp olive oil',
      'Salt, pepper, red pepper flakes',
      '2 tbsp salsa (optional topping)'
    ],
    ARRAY[
      'Heat olive oil in a non-stick skillet over medium heat.',
      'Sauté onion and mushrooms 3–4 minutes until softened.',
      'Add cherry tomatoes and cook another 2 minutes.',
      'Add spinach and toss until wilted, about 1 minute.',
      'Whisk egg whites and whole egg together. Pour over vegetables.',
      'Stir gently with spatula, cooking until just set — about 2–3 minutes. Do not overcook.',
      'Season with salt, pepper, and red pepper flakes. Top with salsa if desired.'
    ],
    'base',
    true
  ),
  (
    'Grilled Steak & Asparagus',
    'High-protein, nutrient-dense dinner for heavy training days. Lean sirloin packed with creatine and iron.',
    'high-protein',
    520,
    '20 min',
    ARRAY[
      '200g sirloin steak (trimmed)',
      '1 bunch asparagus, trimmed',
      '1 tbsp olive oil',
      '2 cloves garlic, minced',
      '1 tbsp balsamic vinegar',
      '1 tsp rosemary (dried or fresh)',
      '1 tsp thyme',
      'Salt & coarse black pepper',
      'Lemon zest for garnish'
    ],
    ARRAY[
      'Take steak out of fridge 20 minutes before cooking to bring to room temperature.',
      'Rub steak with 1 tsp olive oil, garlic, rosemary, thyme, salt, and pepper on both sides.',
      'Heat grill pan or cast iron over high heat until smoking hot.',
      'Grill steak 3–4 minutes per side for medium-rare. Rest on cutting board 5 minutes.',
      'Toss asparagus with remaining olive oil and balsamic. Grill or roast at 425°F for 10 minutes.',
      'Slice steak against the grain. Plate with asparagus and finish with lemon zest.'
    ],
    'pro',
    true
  ),
  (
    'Turkey & Quinoa Stuffed Peppers',
    'Macro-balanced meal prep staple. Make 4 peppers on Sunday and have lunches ready for the week.',
    'meal-plan',
    440,
    '40 min',
    ARRAY[
      '4 large bell peppers (any color)',
      '400g lean ground turkey',
      '1 cup quinoa (cooked)',
      '1 can diced tomatoes (14oz)',
      '1/2 onion, finely diced',
      '3 cloves garlic, minced',
      '1 tsp cumin',
      '1 tsp chili powder',
      '1/2 tsp oregano',
      'Salt & pepper',
      '50g reduced-fat mozzarella (optional topping)'
    ],
    ARRAY[
      'Preheat oven to 375°F. Cut tops off peppers and remove seeds and membranes.',
      'In a skillet over medium heat, brown ground turkey with onion and garlic until cooked through, 7–8 minutes.',
      'Stir in diced tomatoes, quinoa, cumin, chili powder, oregano, salt and pepper. Simmer 5 minutes.',
      'Spoon filling into each pepper, packing firmly. Place in a baking dish with 1/4 cup water in the bottom.',
      'Cover with foil and bake 30 minutes. Remove foil, top with cheese if using, and bake uncovered 10 more minutes.',
      'Let cool 5 minutes before serving. Refrigerates well for up to 4 days.'
    ],
    'base',
    true
  ),
  (
    'Post-Workout Recovery Shake',
    'Fast-digesting protein + simple carbs to spike insulin and kickstart muscle protein synthesis within 30 minutes post-training.',
    'recovery',
    380,
    '3 min',
    ARRAY[
      '2 scoops whey protein isolate (chocolate or vanilla)',
      '1 cup whole milk or oat milk',
      '1 ripe banana',
      '1 tbsp honey or maple syrup',
      '1 tbsp peanut butter',
      '1/2 cup ice',
      'Pinch of sea salt'
    ],
    ARRAY[
      'Add all ingredients to a blender.',
      'Blend 30–45 seconds until smooth and creamy.',
      'Pour and consume within 30 minutes of finishing your workout.',
      'The simple carbs from banana and honey rapidly replenish glycogen while whey delivers amino acids to working muscles.'
    ],
    'base',
    true
  ),
  (
    'Greek Chicken Meal Prep',
    '5-day meal prep solution. Marinate and batch cook Sunday evening for perfectly portioned lunches all week.',
    'meal-plan',
    510,
    '35 min (+ 2hr marinate)',
    ARRAY[
      '1kg chicken thighs (skinless, boneless)',
      '1/2 cup Greek yogurt',
      '3 tbsp lemon juice',
      '4 cloves garlic, minced',
      '2 tbsp olive oil',
      '1 tbsp dried oregano',
      '1 tsp cumin',
      '1 tsp paprika',
      'Salt & pepper',
      '2 cups cooked rice or orzo',
      '1 cucumber, diced',
      '1 cup cherry tomatoes',
      '1/4 red onion, thinly sliced',
      '100g reduced-fat feta cheese'
    ],
    ARRAY[
      'Combine yogurt, lemon juice, garlic, olive oil, oregano, cumin, paprika, salt and pepper in a large bowl.',
      'Add chicken and coat thoroughly. Cover and refrigerate at least 2 hours or overnight.',
      'Preheat oven to 425°F. Lay chicken in a single layer on a baking sheet lined with foil.',
      'Bake 22–25 minutes until internal temp reaches 165°F and edges are slightly caramelized.',
      'Let cool 10 minutes, then slice or chop.',
      'Divide rice/orzo into 5 meal prep containers. Top with chicken, cucumber, tomatoes, red onion, and feta.',
      'Add a lemon wedge to each. Refrigerate up to 5 days. Eat cold or microwave 90 seconds.'
    ],
    'base',
    true
  ),
  (
    'Tuna Avocado Rice Cakes',
    'No-cook, high-protein snack or light meal. Ready in 5 minutes. Perfect between meals to hit your protein targets.',
    'pre-workout',
    280,
    '5 min',
    ARRAY[
      '1 can tuna in water (140g), drained',
      '1/2 ripe avocado',
      '1 tbsp Greek yogurt',
      '1 tsp lemon juice',
      '1/4 tsp garlic powder',
      '4 rice cakes (plain)',
      'Salt, pepper, red pepper flakes',
      'Optional: sliced cucumber, capers, or hot sauce'
    ],
    ARRAY[
      'Mash avocado in a bowl with lemon juice and garlic powder until smooth.',
      'Add drained tuna and Greek yogurt. Mix well until combined.',
      'Season with salt, pepper, and red pepper flakes to taste.',
      'Spread generously onto rice cakes.',
      'Top with cucumber slices or capers if desired. Eat immediately.'
    ],
    'base',
    true
  ),
  (
    'Elite Performance Pasta',
    'Pro-athlete carb loading meal. High-quality complex carbs to maximize glycogen stores before intense training or competition.',
    'meal-plan',
    720,
    '25 min',
    ARRAY[
      '200g whole wheat pasta (penne or rigatoni)',
      '300g lean ground beef (90% lean)',
      '1 can crushed tomatoes (28oz)',
      '1/2 onion, diced',
      '3 cloves garlic, minced',
      '1 tbsp olive oil',
      '1 tsp Italian seasoning',
      '1 tsp red pepper flakes',
      '30g parmesan, grated',
      'Fresh basil',
      'Salt & pepper'
    ],
    ARRAY[
      'Cook pasta according to package directions in salted water until al dente. Reserve 1/2 cup pasta water before draining.',
      'Heat olive oil in a large skillet over medium-high. Brown ground beef 5–6 minutes, breaking it apart. Drain excess fat.',
      'Add onion and garlic to the beef. Cook 3 minutes until softened.',
      'Pour in crushed tomatoes. Add Italian seasoning, red pepper flakes, salt and pepper. Simmer 10 minutes.',
      'Add drained pasta directly to the sauce. Toss to coat, adding pasta water as needed for consistency.',
      'Plate and finish with parmesan and fresh basil. Eat 2–3 hours before heavy training sessions.'
    ],
    'elite',
    true
  ),
  (
    'Anti-Inflammatory Turmeric Bowl',
    'Recovery-focused bowl built around anti-inflammatory superfoods. Great on rest days to reduce muscle soreness and inflammation.',
    'recovery',
    420,
    '20 min',
    ARRAY[
      '1 cup cooked brown rice or cauliflower rice',
      '200g baked or pan-seared salmon',
      '1 cup roasted sweet potato cubes',
      '1 cup steamed edamame',
      '1/2 avocado, sliced',
      '1 tbsp turmeric (for rice or dressing)',
      '2 tbsp tahini',
      '1 tbsp lemon juice',
      '1 tsp ginger, grated',
      '1 clove garlic, minced',
      '2 tbsp warm water (to thin dressing)',
      'Black pepper (enhances turmeric absorption)',
      'Sesame seeds and scallions for garnish'
    ],
    ARRAY[
      'Cook rice with 1/2 tsp turmeric and a pinch of black pepper mixed in for color and anti-inflammatory boost.',
      'Whisk together tahini, lemon juice, ginger, garlic, remaining turmeric, black pepper, and warm water until smooth dressing forms.',
      'Arrange rice as the bowl base. Add salmon, sweet potato, edamame, and avocado in sections.',
      'Drizzle generously with turmeric tahini dressing.',
      'Garnish with sesame seeds and sliced scallions. Best consumed on rest days or within 2 hours post-training.'
    ],
    'pro',
    true
  );
