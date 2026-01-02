import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const googleKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')

    if (!googleKey) throw new Error("Missing Gemini API Key");

    const { orgDesc, productDesc } = await req.json();

    const genAI = new GoogleGenerativeAI(googleKey)
    // Using the 2.5 flash model we confirmed works
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
      You are an expert Strategic Consultant for high-growth tech companies.
      
      Your inputs are:
      1. Organization Description: "${orgDesc}"
      2. Product/Services Description: "${productDesc}"

      Your task:
      Write a "Strategic Context" statement that serves as the Mission & Vision for this company.
      
      CRITICAL RULES:
      - Do NOT write a generic, fluffy marketing slogan.
      - Do NOT write "Our mission is to..." unless it is followed by concrete, actionable system boundaries.
      - The goal is to provide a "System Instruction" for future AI Agents to understand what this company values.
      - Focus on: The core problem being solved, the unique mechanism of action, and the ultimate changed world state (Vision).
      - Style: Concise, professional, factual, and inspiring but grounded.
      - Length: 1 short paragraph (3-4 sentences max).

      Output only the text of the statement.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return new Response(
      JSON.stringify({ data: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
