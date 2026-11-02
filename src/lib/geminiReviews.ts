/**
 * Natural AI Google Review Generator
 * Generates 100 authentic, human-like 5-star Google Reviews tailored specifically
 * to the business name, category, and highlights.
 *
 * Supports direct Gemini API execution when VITE_GEMINI_API_KEY is configured,
 * and seamlessly provides a built-in high-quality natural language generation engine
 * to guarantee 100 unique reviews on any deployment without API quota failures.
 */

export interface ReviewGenerationOptions {
  businessName: string;
  category?: string;
  keywords?: string[];
}

// Industry templates and vocabulary banks for natural variation
const INDUSTRY_TRAITS: Record<string, { nouns: string[]; adjectives: string[]; experiences: string[] }> = {
  restaurant: {
    nouns: ["food", "service", "ambiance", "atmosphere", "staff", "dessert", "drinks", "dishes", "menu", "experience"],
    adjectives: ["delicious", "flavorful", "exceptional", "fresh", "welcoming", "cozy", "top-notch", "impeccable", "delightful", "perfection"],
    experiences: [
      "The flavors were balanced and clearly made with fresh ingredients.",
      "The staff made sure our glasses were never empty and checked in at just the right times.",
      "Hands down one of the best dining experiences I've had in a long time.",
      "The presentation was beautiful and the taste exceeded expectations.",
      "Will definitely be returning with friends next weekend."
    ]
  },
  salon: {
    nouns: ["stylist", "appointment", "haircut", "treatment", "service", "salon", "results", "technique", "consultation", "vibe"],
    adjectives: ["skilled", "attentive", "relaxing", "professional", "flawless", "friendly", "talented", "clean", "wonderful", "meticulous"],
    experiences: [
      "They really listened to what I wanted and gave great styling advice.",
      "Left feeling completely refreshed and received so many compliments afterwards.",
      "Super clean environment and the staff is genuinely welcoming.",
      "Consistently great results every time I visit.",
      "The attention to detail and care taken during the appointment was incredible."
    ]
  },
  dental: {
    nouns: ["team", "care", "doctor", "hygienist", "office", "visit", "cleanliness", "treatment", "staff", "bedside manner"],
    adjectives: ["gentle", "thorough", "knowledgeable", "comforting", "professional", "modern", "pain-free", "caring", "patient", "efficient"],
    experiences: [
      "Explained every step of the procedure thoroughly and put me completely at ease.",
      "The office is spotless and the front desk team is friendly and prompt.",
      "Zero discomfort and they truly care about patient comfort.",
      "I used to get anxious about visits, but the team here made it a breeze.",
      "Very professional, transparent about options, and took great care of me."
    ]
  },
  auto: {
    nouns: ["mechanic", "service", "repair", "turnaround", "communication", "pricing", "diagnostics", "shop", "work", "vehicle"],
    adjectives: ["honest", "reliable", "fast", "knowledgeable", "fair", "transparent", "trustworthy", "prompt", "accurate", "courteous"],
    experiences: [
      "They explained the issue clearly without trying to upsell unnecessary work.",
      "My vehicle was ready earlier than expected and running smoother than ever.",
      "Honest pricing and great communication from start to finish.",
      "It is hard to find a shop you can genuinely trust, but this place earned my loyalty.",
      "Transparent diagnostics and high quality repair work."
    ]
  },
  retail: {
    nouns: ["selection", "customer service", "store", "products", "staff", "inventory", "quality", "experience", "pricing", "displays"],
    adjectives: ["helpful", "wide variety", "organized", "friendly", "pleasant", "fair", "great quality", "welcoming", "delightful", "attentive"],
    experiences: [
      "Staff went above and beyond to help me find exactly what I was searching for.",
      "Great variety of items and very neatly organized store.",
      "Quick checkout and friendly greetings the moment you walk through the door.",
      "Fair prices and superior quality compared to other places.",
      "A pleasant shopping experience from start to finish."
    ]
  },
  general: {
    nouns: ["service", "team", "experience", "work", "communication", "quality", "staff", "results", "attention to detail", "professionalism"],
    adjectives: ["outstanding", "prompt", "courteous", "reliable", "accommodating", "seamless", "fantastic", "first-class", "impressive", "friendly"],
    experiences: [
      "From the first interaction to the finished result, everything was handled with care.",
      "Friendly, professional, and very prompt in responding to questions.",
      "They exceeded my expectations in every way possible.",
      "I will gladly recommend them to family and friends.",
      "Very dependable and took the time to ensure total customer satisfaction."
    ]
  }
};

/**
 * Natural review sentence structures with dynamic variation
 */
function buildAlgorithmicReviews(name: string, category: string): string[] {
  const normCat = (category || "").toLowerCase();
  let traits = INDUSTRY_TRAITS.general;
  if (normCat.includes("rest") || normCat.includes("cafe") || normCat.includes("food") || normCat.includes("bar") || normCat.includes("dining")) {
    traits = INDUSTRY_TRAITS.restaurant;
  } else if (normCat.includes("salon") || normCat.includes("hair") || normCat.includes("barber") || normCat.includes("spa") || normCat.includes("beauty")) {
    traits = INDUSTRY_TRAITS.salon;
  } else if (normCat.includes("dent") || normCat.includes("clinic") || normCat.includes("med") || normCat.includes("health") || normCat.includes("chiro")) {
    traits = INDUSTRY_TRAITS.dental;
  } else if (normCat.includes("auto") || normCat.includes("car") || normCat.includes("mechanic") || normCat.includes("tire") || normCat.includes("repair")) {
    traits = INDUSTRY_TRAITS.auto;
  } else if (normCat.includes("shop") || normCat.includes("store") || normCat.includes("retail") || normCat.includes("market")) {
    traits = INDUSTRY_TRAITS.retail;
  }

  const reviews = new Set<string>();

  const starters = [
    `Had a wonderful experience at ${name}.`,
    `Can't say enough good things about ${name}!`,
    `First time visiting ${name} today, and I am genuinely impressed.`,
    `Consistently five-star service at ${name}.`,
    `If you're looking for top quality, ${name} is the place to go.`,
    `Visiting ${name} was the best decision I made this week.`,
    `Outstanding customer care from the folks at ${name}.`,
    `I was referred to ${name} by a friend, and they did not disappoint.`,
    `Truly exceptional standard of service at ${name}.`,
    `Always a pleasure dealing with the team at ${name}.`
  ];

  const middlePunch = [
    `The staff was welcoming and the ${traits.nouns[0]} was ${traits.adjectives[0]}.`,
    `Everything from the ${traits.nouns[1]} to the ${traits.nouns[2]} was ${traits.adjectives[1]}.`,
    `Very impressed by their attention to detail and ${traits.adjectives[2]} ${traits.nouns[3]}.`,
    `Quick, ${traits.adjectives[3]}, and genuinely caring approach.`,
    `The ${traits.nouns[4]} exceeded all expectations — truly ${traits.adjectives[4]}.`,
    `Super clean, organized, and handled with ${traits.adjectives[5]} professionalism.`,
    `Friendly greetings right away and top-tier ${traits.nouns[5]}.`,
    `They took the time to answer all questions and made the entire process painless.`
  ];

  const closers = [
    `Highly recommended to anyone looking for great service!`,
    `Will definitely be a returning customer!`,
    `10/10, thank you so much!`,
    `Keep up the fantastic work!`,
    `Five stars all the way.`,
    `Would give 6 stars if Google allowed it!`,
    `Already looking forward to my next visit.`,
    `Do not hesitate to give them a try!`
  ];

  // 1. Generate 3-sentence narrative reviews
  for (const s of starters) {
    for (const m of middlePunch) {
      for (const c of closers) {
        if (reviews.size >= 100) break;
        reviews.add(`${s} ${m} ${c}`);
      }
      if (reviews.size >= 100) break;
    }
    if (reviews.size >= 100) break;
  }

  // 2. Generate punchy 1-2 sentence reviews if needed to reach 100
  let expIdx = 0;
  while (reviews.size < 100) {
    const exp = traits.experiences[expIdx % traits.experiences.length];
    const adj = traits.adjectives[(expIdx * 2) % traits.adjectives.length];
    const noun = traits.nouns[(expIdx * 3) % traits.nouns.length];
    const rev = `${name} delivered ${adj} ${noun}. ${exp} Five stars!`;
    reviews.add(rev);
    expIdx++;
  }

  return Array.from(reviews).slice(0, 100);
}

/**
 * Main export: Generates exactly 100 unique, human-like reviews
 */
export async function generate100Reviews(options: ReviewGenerationOptions): Promise<string[]> {
  const { businessName, category = "General Business", keywords = [] } = options;
  const apiKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `Generate exactly 100 diverse, highly realistic, natural-sounding 5-star Google review messages for a business named "${businessName}" (Category: ${category}, Highlights: ${keywords.join(", ") || "quality, friendly staff, prompt service"}).
Rules:
1. Every review must sound like a real person wrote it (varying lengths from 1 to 3 sentences).
2. Diverse phrasing, varied vocabulary, varied situations (first time, returning customer, family visit).
3. Return ONLY a valid JSON array of 100 strings. No markdown, no preface, no extra text. Format: ["review 1", "review 2", ...]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (response.ok) {
        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (Array.isArray(parsed) && parsed.length >= 80) {
            // Fill up to 100 if slightly short
            const results = parsed.map(s => String(s).trim()).filter(Boolean);
            if (results.length < 100) {
              const fallback = buildAlgorithmicReviews(businessName, category);
              for (const fb of fallback) {
                if (results.length >= 100) break;
                if (!results.includes(fb)) results.push(fb);
              }
            }
            return results.slice(0, 100);
          }
        }
      }
    } catch (err) {
      console.warn("[DumpaReview AI] Gemini API call skipped or failed, falling back to algorithmic engine:", err);
    }
  }

  // Fallback to high-quality procedural generation
  return buildAlgorithmicReviews(businessName, category);
}

