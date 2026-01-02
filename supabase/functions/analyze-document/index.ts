import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log("----------------------------------------");
  console.log("Function Invoked: analyze-document");

  try {
    // 1. Env Check
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase Environment Variables");
    }
    if (!googleKey) {
        throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    }

    console.log("Environment Variables Checked: OK");

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 2. Parse Body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        throw new Error("Failed to parse request body as JSON");
    }

    const { documentId } = body;
    if (!documentId) throw new Error('Missing documentId in request body');

    console.log(`Processing Document ID: ${documentId}`);

    // 3. Fetch Document Metadata
    const { data: doc, error: docError } = await supabaseClient
      .from('organization_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError) {
        console.error("Supabase DB Error:", docError);
        throw new Error(`Failed to fetch document metadata: ${docError.message}`);
    }
    if (!doc) throw new Error('Document not found in DB');

    console.log(`Document Metadata Found: ${doc.name} (${doc.file_path})`);

    // 4. Download File
    console.log("Attempting to download file from storage...");
    const { data: fileData, error: fileError } = await supabaseClient
      .storage
      .from('documents')
      .download(doc.file_path)

    if (fileError) {
        console.error("Storage Download Error:", fileError);
        throw new Error(`Failed to download file from storage: ${fileError.message}`);
    }
    if (!fileData) throw new Error('File data is null');

    console.log("File downloaded successfully. Extracting text...");

    // 5. Extract Text
    let textContent = await fileData.text()
    // Sanitize: Postgres cannot store null bytes (0x00) in text fields
    textContent = textContent.replace(/\x00/g, '');
    
    const safeText = textContent.slice(0, 500000); 
    console.log(`Text extracted (sanitized). Length: ${safeText.length} chars.`);

    // DEBUG: Check Available Models
    console.log("------------------------------------------------");
    console.log("DEBUG: Fetching available models for this Key...");
    try {
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`);
        if (!listResp.ok) {
            console.error(`List Models Failed: ${listResp.status} ${listResp.statusText}`);
            const errText = await listResp.text();
            console.error("List Models Error Body:", errText);
        } else {
            const listData = await listResp.json();
            const modelNames = (listData.models || []).map((m: any) => m.name);
            console.log("AVAILABLE MODELS:", JSON.stringify(modelNames, null, 2));
        }
    } catch (e) {
        console.error("Exception checking models:", e);
    }
    console.log("------------------------------------------------");

    // 6. Call Gemini
    const genAI = new GoogleGenerativeAI(googleKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
      You are an expert business strategy assistant.
      Analyze the following document text and provide:
      1. A professional, concise title (max 60 chars).
      2. A comprehensive summary (max 4-5 sentences, highlighting key strategic points).
      
      Return your response in valid JSON format:
      {
        "title": "Your Generated Title",
        "summary": "Your Generated Summary"
      }

      Document Text:
      ${safeText}
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const aiText = response.text()
    
    console.log("Gemini Response Received. Raw:", aiText.substring(0, 100) + "...");

    // Clean up JSON
    const jsonStr = aiText.replace(/```json/g, '').replace(/```/g, '').trim()
    let aiData;
    try {
        aiData = JSON.parse(jsonStr);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Raw Text was:", aiText);
        throw new Error("Failed to parse AI response as JSON");
    }

    // 7. Update DB
    console.log("Updating Database...");
    const { error: updateError } = await supabaseClient
      .from('organization_documents')
      .update({
        title: aiData.title,
        summary: aiData.summary,
        text_content: safeText.slice(0, 2000) + (safeText.length > 2000 ? '... (truncated)' : '') 
      })
      .eq('id', documentId)

    if (updateError) {
        console.error("DB Update Error:", updateError);
        throw new Error(`Failed to update document with results: ${updateError.message}`);
    }

    console.log("Analysis Complete and Saved.");

    return new Response(
      JSON.stringify({ success: true, data: aiData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("CRITICAL FUNCTION ERROR:", error.message);
    console.error(error); // Log full stack if object
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
