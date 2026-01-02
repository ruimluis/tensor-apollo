
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

    if (!googleKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
    }

    const { action, payload } = await req.json();
    console.log(`Action: ${action}`, payload);

    const genAI = new GoogleGenerativeAI(googleKey);
    // Using gemini-2.5-flash as requested and verified in strategy-consultant. 
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    if (action === 'review') {
      // Support legacy (objectiveTitle/keyResults) and new (parentType/children) payloads
      const { 
        objectiveTitle, objectiveDescription, keyResults, 
        parentType, parentTitle, parentDescription, children 
      } = payload;

      const pType = parentType || 'OBJECTIVE';
      const pTitle = parentTitle || objectiveTitle;
      const pDesc = parentDescription || objectiveDescription;
      const childNodes = children || keyResults;
      
      const prompt = `
You are an expert consultant specializing in OKRs (Objectives and Key Results), Strategy, and Execution.

Your task is to evaluate the following **${pType}** and its **Child Nodes** based on established best practices.

**Context:**
- Parent Node Type: ${pType}
- Child Node Type: ${pType === 'GOAL' ? 'OBJECTIVE' : pType === 'OBJECTIVE' ? 'KEY_RESULT' : 'TASK'}

**Evaluation Criteria:**
${pType === 'GOAL' ? `
- **Goal Quality:** Is it a high-level, long-term strategic pillar? Is it inspiring?
- **Objective Alignment:** Do the Objectives clearly break down the Goal into achievable distinct outcomes?
` : pType === 'OBJECTIVE' ? `
- **Objective Quality:** Is it ambitious, aspirational, and qualitative? Does it clearly state an outcome, not an output?
- **Key Result Quality:** Are they specific, measurable, achievable, relevant, and time-bound (SMART)? Do they measure outcomes?
` : `
- **Key Result Quality:** Is the Key Result a clear measurable outcome?
- **Task Alignment:** Do the Tasks represent the necessary work to achieve the Key Result? Are they verified outputs?
`}

**${pType} to Evaluate:**
Title: ${pTitle}
Description: ${pDesc || "No description provided."}

**Children to Evaluate:**
${childNodes.map((c: any) => `- ${c.type || 'Node'} Title: ${c.title}\n  Description: ${c.description || "N/A"}`).join('\n')}

**Your Analysis:**
Based on your evaluation, provide a score from 1 to 10.
Then, provide a detailed summary of your analysis.
Then, provide detailed feedback, separating it into Strengths and Weaknesses.
Finally, provide a list of clear, actionable recommendations.

Ensure the output is a valid JSON object.
`;
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json"
        }
      });

      const response = result.response;
      const text = response.text();
      console.log("AI Response:", text);
      const jsonResponse = JSON.parse(text);

      return new Response(JSON.stringify({ data: jsonResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'risk-analysis') {
        const { objectiveTitle, objectiveStartDate, objectiveEndDate, teamMemberCount, keyResults, currentDate } = payload;

        const prompt = `
You are an expert project manager and OKR coach. Your task is to perform a detailed risk analysis for the following Objective and determine if it is 'On Track', 'At Risk', or 'Off Track'.

**Objective Data:**
- Objective: ${objectiveTitle}
- Timeframe: ${objectiveStartDate} to ${objectiveEndDate}
- Team Size: ${teamMemberCount} members

**Key Results and Tasks Data:**
${keyResults.map((kr: any) => `
- **Key Result: "${kr.title}"** (Progress: ${kr.progress}%)
  ${kr.tasks.map((t: any) => `
  - Task: "${t.title}" (Status: ${t.status}, Due: ${t.dueDate || 'N/A'}, Hours: ${t.hours || 'N/A'}, Assigned: ${t.assigned ? 'Yes' : 'No'})
  `).join('')}
`).join('')}

**Analysis Instructions:**

You MUST evaluate the following factors to determine the risk status:

1.  **Progress vs. Time:** Calculate the percentage of time elapsed for the objective. Compare this to the average progress of all Key Results.
    - If progress is significantly behind the time elapsed (e.g., 75% of time passed, but only 25% progress), the risk is higher.

2.  **Task-Level Health (Leading Indicators):**
    - **Overdue Tasks:** Count the number of tasks whose due date is in the past but are not 'Done'.
    - **Unassigned Upcoming Work:** Identify tasks that are due within the next two weeks but have no assignee.
    - A high number in either of these categories is a major red flag.

3.  **Resource Capacity (Reality Check):**
    - **Calculate Total Remaining Effort:** Sum the 'hours' for all tasks that are NOT 'Done'.
    - **Calculate Total Available Hours:**
      - Assume today's date is ${currentDate}.
      - Calculate the number of business days (Mon-Fri) between today and the '${objectiveEndDate}'.
      - Assume each team member provides 6 productive hours per business day.
      - Total Available Hours = (Business Days Remaining) * (${teamMemberCount}) * 6.
    - **Compare:** If Total Remaining Effort > Total Available Hours, the objective is at high risk, even if progress seems okay. You MUST mention this in your analysis.

4.  **Synthesize and Decide:**
    - **On Track:** Progress is aligned with or ahead of the timeline, task health is good, and resource capacity is sufficient.
    - **At Risk:** Progress is slightly lagging, or there are some concerning leading indicators (e.g., a few overdue tasks, unassigned work). The goal is salvageable with attention.
    - **Off Track:** Progress is severely behind, task health is poor (many overdue/unassigned tasks), or resource capacity is insufficient to complete the work. Requires immediate intervention.

**Output:**
Please provide a valid JSON object with the following fields:
{
  "status": "On Track" | "At Risk" | "Off Track",
  "analysisSummary": "A single, concise sentence summarizing the status.",
  "riskFactors": ["Specific, actionable risk factor 1", "Specific, actionable risk factor 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}
`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const response = result.response;
        const text = response.text();
        console.log("AI Response (Risk):", text);
        const jsonResponse = JSON.parse(text);

        return new Response(JSON.stringify({ data: jsonResponse }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }


    if (action === 'weekly-review') {
        const { objectiveTitle, keyResults, currentDate, periodStart, periodEnd } = payload;

        const dateContext = periodStart && periodEnd 
            ? `Period: ${periodStart} to ${periodEnd}` 
            : `Date: ${currentDate}`;

        const prompt = `
You are an expert executive assistant and project manager. Your task is to draft a concise, professional **Weekly Progress Report** for the following Objective.

**Context:**
- Report ${dateContext}
- Objective: ${objectiveTitle}

**Key Results & Activities:**
${keyResults.map((kr: any) => `
- **"${kr.title}"** (Progress: ${kr.progress}%)
  ${kr.tasks.map((t: any) => `
  - Task: "${t.title}" (Status: ${t.status})
  `).join('')}
`).join('')}

**Instructions:**
Synthesize this data into a clear weekly update.
1.  **Executive Summary:** A 2-3 sentence overview of the week.
2.  **Key Achievements:** Bullet points of completed tasks or significant progress made this week.
3.  **Blockers/Risks:** Identify stuck tasks or stalled progress.
4.  **Priorities for Next Week:** Suggest what should be focused on next based on incomplete tasks.

**Output:**
Provide a valid JSON object:
{
  "summary": "Executive summary text...",
  "achievements": ["Achievement 1", "Achievement 2"],
  "blockers": ["Blocker 1", "Blocker 2"],
  "priorities": ["Priority 1", "Priority 2"]
}
`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const response = result.response;
        const text = response.text();
        console.log("AI Response (Weekly Review):", text);
        const jsonResponse = JSON.parse(text);

        return new Response(JSON.stringify({ data: jsonResponse }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
