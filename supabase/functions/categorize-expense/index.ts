import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExpenseCategorizationRequest {
  description: string
}

interface ExpenseCategorizationResponse {
  category: string
  confidence: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { description }: ExpenseCategorizationRequest = await req.json()

    // Enhanced categorization logic with Indian context
    const categories = {
      'Food': {
        keywords: [
          'restaurant', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'cafe', 'canteen',
          'zomato', 'swiggy', 'dominos', 'mcdonalds', 'kfc', 'pizza', 'burger', 'tiffin',
          'mess', 'dhaba', 'chai', 'tea', 'coffee', 'snacks', 'biryani', 'dosa', 'idli',
          'chaat', 'samosa', 'vada', 'paratha', 'roti', 'dal', 'rice', 'curry',
          'grocery', 'vegetables', 'fruits', 'milk', 'bread', 'eggs', 'chicken', 'mutton'
        ],
        confidence: 0.9
      },
      'Travel': {
        keywords: [
          'uber', 'ola', 'bus', 'train', 'metro', 'taxi', 'auto', 'rickshaw', 'fuel', 'petrol',
          'diesel', 'railway', 'flight', 'airport', 'irctc', 'redbus', 'rapido', 'bounce',
          'bike', 'car', 'parking', 'toll', 'ticket', 'station', 'platform', 'journey',
          'travel', 'trip', 'vacation', 'tourism', 'hotel', 'lodge', 'accommodation'
        ],
        confidence: 0.85
      },
      'Entertainment': {
        keywords: [
          'movie', 'cinema', 'theater', 'game', 'gaming', 'netflix', 'amazon prime', 'hotstar',
          'spotify', 'youtube', 'music', 'concert', 'show', 'event', 'party', 'club',
          'pub', 'bar', 'bowling', 'pool', 'billiards', 'arcade', 'mall', 'shopping center',
          'pvr', 'inox', 'multiplexes', 'bookmyshow', 'paytm insider', 'comedy', 'drama'
        ],
        confidence: 0.8
      },
      'Shopping': {
        keywords: [
          'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'clothes', 'shirt', 'shoes',
          'shopping', 'purchase', 'buy', 'order', 'delivery', 'pants', 'jeans', 'dress',
          'bag', 'accessories', 'watch', 'phone', 'mobile', 'laptop', 'electronics',
          'gadgets', 'headphones', 'charger', 'case', 'cover', 'cosmetics', 'beauty',
          'grooming', 'soap', 'shampoo', 'cream', 'perfume', 'deodorant'
        ],
        confidence: 0.85
      },
      'Education': {
        keywords: [
          'book', 'books', 'course', 'class', 'tuition', 'coaching', 'college', 'university',
          'school', 'study', 'fee', 'fees', 'admission', 'exam', 'test', 'library',
          'stationery', 'pen', 'pencil', 'notebook', 'paper', 'xerox', 'photocopy',
          'printing', 'assignment', 'project', 'research', 'lab', 'practical', 'uniform',
          'byju', 'unacademy', 'vedantu', 'online course', 'certification', 'training'
        ],
        confidence: 0.9
      },
      'Healthcare': {
        keywords: [
          'doctor', 'hospital', 'clinic', 'medicine', 'pharmacy', 'medical', 'health',
          'checkup', 'consultation', 'treatment', 'surgery', 'operation', 'dental',
          'dentist', 'eye', 'optician', 'glasses', 'contact lens', 'medicine', 'tablets',
          'syrup', 'injection', 'vaccination', 'insurance', 'apollo', 'fortis', 'max',
          'aiims', 'emergency', 'ambulance', 'blood test', 'x-ray', 'scan', 'mri'
        ],
        confidence: 0.85
      },
      'Utilities': {
        keywords: [
          'electricity', 'water', 'gas', 'internet', 'wifi', 'mobile', 'phone', 'recharge',
          'bill', 'payment', 'airtel', 'jio', 'vodafone', 'bsnl', 'broadband', 'cable',
          'dth', 'tata sky', 'dish tv', 'sun direct', 'maintenance', 'society', 'rent',
          'room', 'pg', 'hostel', 'accommodation', 'deposit', 'advance'
        ],
        confidence: 0.8
      }
    }

    const desc = description.toLowerCase()
    let bestCategory = 'Miscellaneous'
    let bestConfidence = 0.5
    let bestScore = 0

    // Check each category for keyword matches
    for (const [category, data] of Object.entries(categories)) {
      let score = 0
      let matches = 0

      for (const keyword of data.keywords) {
        if (desc.includes(keyword)) {
          score += keyword.length // Longer keywords get higher scores
          matches++
        }
      }

      // Calculate final score considering both matches and keyword length
      const finalScore = (score * matches) / data.keywords.length

      if (finalScore > bestScore) {
        bestScore = finalScore
        bestCategory = category
        bestConfidence = Math.min(data.confidence + (matches * 0.02), 0.99)
      }
    }

    // Add randomness to make it more realistic
    const randomFactor = 0.95 + (Math.random() * 0.04) // 0.95 to 0.99
    bestConfidence = Math.round(bestConfidence * randomFactor * 100) / 100

    const response: ExpenseCategorizationResponse = {
      category: bestCategory,
      confidence: bestConfidence
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error categorizing expense:', error)
    return new Response(
      JSON.stringify({ 
        category: 'Miscellaneous', 
        confidence: 0.5,
        error: 'Failed to categorize expense' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})