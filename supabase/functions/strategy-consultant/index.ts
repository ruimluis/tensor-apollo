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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !googleKey) {
      throw new Error("Missing Environment Variables");
    }

    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const { phase, context, userAnswers, selectedObjectives, selectedKRs } = await req.json();

    console.log(`Executing Phase: ${phase}`);

    let prompt = "";
    let systemInstruction = "";

    // --- PHASE 1: TRIAGE & DISCOVERY ---
    if (phase === 'discovery') {
       /*
        Logic: Analyze Goal + Context. REJECT if vague. PROCEED with specific questions if actionable.
       */
       systemInstruction = `
        You are a Senior Strategy Consultant at a top-tier firm. 
        Your job is to conduct an initial "Triage" of a client's stated goal.
        
        LOGIC:
        1. Metric-Only Goal (e.g. "Hit $10M"): PROCEED. Help them find the strategy.
        2. Strategic Goal (e.g. "Move upmarket"): PROCEED.
        3. Vague Goal WITH Context: PROCEED.
        4. Vague Goal WITHOUT Context (e.g. "Grow business"): REJECT.
        
        IF REJECT:
        - Return 'rejectionMessage' with helpful feedback. 'questions' = null.
        
        IF PROCEED:
        - 'rejectionMessage' = null.
        - 'analysis': One-paragraph summary of their intent.
        - 'questions': Generate 3 Consultant-Grade questions to uncover Trade-offs and Friction. 
          Constraint: Question 1 MUST ask about External Market/Industry Context if not provided.
          
          LOGIC FOR QUESTIONS:
          - IF Stage is "Idea" or "Pre-Revenue": DO NOT ask for historical data (CAC, Churn, Revenue). Ask about "Hypotheses", "Customer Validation", and "Biggest Unknowns".
          - IF Stage is "Growth" or "Scale": Ask about "Optimization", "Unit Economics", and "Scalability Bottlenecks".
       `;

       prompt = `
        Organization: ${context.companyDescription || "Not specified"}
        Product: ${context.productDescription || "Not specified"}
        Stated Goal: "${context.userGoal}"
        mission: ${context.mission || "Not specified"}
        Organization Stage: ${context.orgStage || "Not specified"}
        Additional User Context: "${context.additionalContext || "None"}"

        Perform Triage.
        Return JSON:
        {
          "analysis": "string or null",
          "questions": ["string", "string", "string"] or null,
          "rejectionMessage": "string or null"
        }
       `;
    }

    // --- PHASE 2: STRATEGIC ARCHITECTURE (BALANCED SCORECARD) ---
    else if (phase === 'architecture') {
        /*
         Logic: Synthesize answers -> Generate 5 Distinct Pillars.
        */
        systemInstruction = `
         You are a Chief Strategy Officer acting as an architect.
         Translate the client's goal and answers into a menu of high-impact Strategic Objectives.
         
         LOGIC:
         1. Analyze the "Strategic Theme" (e.g. Speed vs Quality, Enterprise vs PLG).
         2. Generate exactly 5 Distinct Strategic Objectives using the Balanced Scorecard approach:
            - Financial/Growth
            - Customer/Market
            - Product/Innovation
            - Operational Excellence
            - The "Wildcard" (Industry specific bet)
         
         Constraint: Titles must be Action-Oriented (e.g. "Accelerate Enterprise Penetration").
         
         LOGIC FOR OBJECTIVES:
         - IF Stage is "Idea" or "Pre-Revenue": Objectives should focus on "Validate", "Discover", "Launch", "mvp".
         - IF Stage is "Growth" or "Scale": Objectives should focus on "Optimize", "Scale", "Expand", "Reduce".
        `;

        prompt = `
         Context:
         Organization: ${context.companyDescription}
         Product: ${context.productDescription}
         Organization Stage: ${context.orgStage || "Unknown"}
         Initial Goal: "${context.userGoal}"
         
         Interview Transcript:
         Q1: ${context.questions[0]}
         A1: ${userAnswers[0]}
         Q2: ${context.questions[1]}
         A2: ${userAnswers[1]}
         Q3: ${context.questions[2]}
         A3: ${userAnswers[2]}

         Generate 5 Strategic Objectives.
         Return JSON:
         {
           "summary": "Synthesis of the strategic theme.",
           "objectives": [
             {
               "title": "Action-Oriented Title",
               "description": "Rationale linking to their constraints.",
               "recommendationLevel": "High" | "Medium" | "Low",
               "pillar": "Financial" | "Customer" | "Product" | "Operational" | "Wildcard"
             }
           ]
         }
        `;
    }

    // --- PHASE 3: CALIBRATION (METRIC ARCHITECT) ---
    else if (phase === 'calibration') {
        /*
         Logic: Select High-Leverage Metrics (Leading/Lagging) + Contextual Benchmarks.
        */
        systemInstruction = `
         You are a Data-Driven Strategy Consultant.
         Define how to measure success for the selected objectives.
         
         LOGIC:
         For each objective, identify 3 Metrics:
         1. Mix Lagging (Revenue) & Leading (Pipeline) indicators.
         2. Provide "Benchmark Context" (e.g. "Best-in-class churn is <5%").
         3. Explain acronyms (ARR, NPS).
         
         Constraint: Do NOT hallucinate targets. Ask for the User's Baseline.
        `;

        prompt = `
         Selected Objectives: ${JSON.stringify(selectedObjectives)}
         Organization Stage: ${context.orgStage || "Unknown"}
         
         Generate 3 Metrics per objective.
         IF "Idea" or "Pre-Revenue": Focus on Validation & Traction (Waitlists, Interviews).
         IF "Growth" or "Scale": Focus on Optimization (CAC, LTV, Churn).

         Return JSON:
         {
            "objectives": [
                {
                    "originalTitle": "Title",
                    "keyResults": [
                        {
                            "metricName": "Metric Name (e.g. Enterprise Pipeline Value)",
                            "benchmarkContext": "Contextual advice (e.g. 'Healthy pipeline coverage is 3x quota...')",
                            "unit": "$/%, etc",
                            "baselineQuestion": "Current Value"
                        }
                    ]
                }
            ]
         }
        `;
    }

    // --- PHASE 4: TARGET SETTING (EXECUTIONER) ---
    else if (phase === 'execution') {
        /*
         Logic: Apply Zero-to-One or Optimization Rules.
        */
        systemInstruction = `
         You are an OKR Expert finalizing the plan.
         Translate baselines into specific Targets.
         
         LOGIC:
         Rule A (New Initiatives): If Baseline is 0/None -> Target = Specific Milestone (e.g. "Launch V1").
         Rule B (Optimization): If Baseline > 0 -> Target = 20-30% Stretch.
         
         Generate Key Results and supporting Tasks.
        `;

        prompt = `
         Objectives with Baselines: ${JSON.stringify(selectedKRs)} 
         (Note: 'suggestedTarget' here contains the Baseline value provided by user)

         Generate Final KRs and Tasks.
         Return JSON:
         {
            "plan": [
                {
                     "krTitle": "Action Verb + Metric + from [Baseline] to [Target]",
                    "krDescription": "Brief explanation of why this KR matters (outcome focus)",
                    "tasks": [
                        {
                            "title": "Task Title",
                            "description": "Brief description",
                            "estimatedHours": 4
                        }
                    ]
                }
            ]
         }
        `;
    } 
    else {
        throw new Error("Invalid Phase");
    }

    // Execute Request
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { role: "system", parts: [{ text: systemInstruction }]} // Note: systemInstruction depend on model support, Gemini 1.5/2.0 supports it. If using older lib, might need to prepend.
    });
    
    const response = result.response;
    const text = response.text();

    // Clean JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Strategy Consultant Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
