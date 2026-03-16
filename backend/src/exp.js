// aiDecisionTest.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: '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', baseURL: 'https://integrate.api.nvidia.com/v1'});

async function decisionAI(message, shortTermMemory = null, previousMessages = []) {
  // Build the system prompt
  let systemPrompt = `You are a decision AI. For each incoming message, provide three outputs:
                        1. "ignoreScore": float 0-1 indicating how much to ignore this message (higher means more likely to ignore).
                        2. "searchPastExperience": "yes" or "no" depending on whether the message should trigger a search in past experiences.
                        3. "interest": "yes" or "no" depending on whether the topic is potentially an interest or hobby .
                        4. "tellAllPast": "yes" or "no" if the user is directly asking about your past and previous incidents or experiences.
                        5. "tellAllInterest": "yes" or "no" if the user is directly asking about your interests or hobbies .
                        

                        If the message is out of context, increase ignoreScore.
                        Only reply with valid JSON. 
                        Do NOT add any text, explanations, apologies, examples, or markdown.
                        The JSON keys must exactly be: ignoreScore, searchPastExperience, interest.
                        Send your output in strict JSON format only, like:
                        {
                        "ignoreScore": 0.45,
                        "searchPastExperience": "yes",
                        "interest": "no",
                        "tellAllPast": "no",
                        "tellAllInterest": "no"
                        }
                        {
                        "ignoreScore": 0.85,
                        "searchPastExperience": "no",
                        "interest": "yes",
                        "tellAllPast": "no",
                        "tellAllInterest": "yes"
                        }
                        {
                        "ignoreScore": 0.1,
                        "searchPastExperience": "yes",
                        "interest": "yes",
                        "tellAllPast": "yes",
                        "tellAllInterest": "yes"
                        }`;

  if (shortTermMemory) {
    systemPrompt += `\nShort Term Memory of this convo:\n${JSON.stringify(shortTermMemory)}\n`;
  }

  if (previousMessages.length) {
    const history = previousMessages
      .map(m => `${m.sentBy}: ${m.message}`)
      .join("\n");
    systemPrompt += `\nPrevious Conversation:\n${history}\n`;
  }

  // Call the model
  const decision = await openai.chat.completions.create({
    model: "meta/llama3-8b-instruct",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Message: ${message}\n\nRespond in JSON only.` }
    ]
  });

  console.log(decision.choices[0].message.content);


  // Parse and return
  let result;
  try {
    result = decision.choices[0].message.content;
    if(result.startsWith('```json')){
        result = result.slice(7,-3)
        result = JSON.parse(result)
    }
    else{
        result = JSON.parse(result)
    }
    
  } catch (err) {
    throw new Error("Failed to parse AI output: " + decision.choices[0].message.content);
  }

  // Random ignore decision
  const randomNess = Math.random();
  const shouldIgnore = result.ignoreScore > randomNess;

  return { ...result, shouldIgnore };
}

// --- Test the function ---
(async () => {
  const testMessage = "Tell me about hobbies like what do u like ";
  const shortTermMemory = { lastTopic: "AI projects" };
  const previousMessages = [
    { sentBy: "User", message: "Hey, can you help me?" },
    { sentBy: "AI", message: "Sure, what do you want to do?" }
  ];

  const result = await decisionAI(testMessage, shortTermMemory, previousMessages);
  console.log(result.ignoreScore , result.searchPastExperience , result.interest , result.shouldIgnore);
})();