const axios = require('axios');
const EmailHistory = require('../models/EmailHistory');

exports.generateEmail = async (req, res) => {
    try {
        const { prompt } = req.body;
        const groqApiKey = process.env.GROQ_API_KEY;
        if(!prompt){
            return res.status(400).json({ message: 'Prompt is required. '});
        }
        if (prompt.trim().length === 0){
            return res.status(400).json({message: 'Prompt cannot be empty'});
        }
        if (prompt.length > 2000) {
            return res.status(400).json({message: 'Prompt cannot exceed 2000 characters' });
        }


        const systemPrompt = `You are an expert cold email copywriter. Generate a cold email based on the following prompt: ${prompt}. The response should be in JSON format with the following structure: { "subject": "Email Subject", "emailBody":"Email body content", "linkedInDM": "LinkedIn DM content", "followUpEmail": "Follow-up email content" }`;
        
        const fullPrompt = `${systemPrompt}\n\nUser REQUEST: "${prompt.trim()}"\n\nGenerate STRONG cold email even if prompt is short. Make smart assumptions. Return ONLY valid JSON:\n{"subject": "...", "emailBody": "...", "linkedInDM": "...", "followUpEmail": "..."}`;
        
        const aiResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions' ,
            {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { 
                    role: "user",
                    content: fullPrompt
                }
            ],
            max_tokens: 1024,
            temperature: 0.7
        },
        {
            headers: {
                'Authorization' : `Bearer ${groqApiKey}`,
                'Content-type': 'application/json'
            },
            timeout: 30000 // 30 seconds timeout
        });

        // Parse the Groq response
        if (!aiResponse.data.choices || !aiResponse.data.choices[0] || !aiResponse.data.choices[0].message){
            throw new Error('Invalid response from Groq API');
        }

        const generatedText = aiResponse.data.choices[0].message.content;

        //Extract JSON from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        let parsedResponse;

        try {
            parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(generatedText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Generated text:', generatedText);
            return res.status(500).json({
                message: 'Failed to parse AI response',
                error: 'The AI generated invalid JSON. Please try again.'
            });
        }

        const emailData = {
            subject: parsedResponse.subject || "New Opportunity",
            emailBody: parsedResponse.emailBody || "",
            linkedInDM: parsedResponse.linkedInDM || "", 
            followUpEmail: parsedResponse.followUpEmail || "" 
        };

        // Validate response data
        if (!emailData.subject || !emailData.emailBody){
            return res.status(500).json({
                message: 'AI generated incomplete email data. Please try again.'
            });
        }

        //Save to History

        const historyEntry = await EmailHistory.create({
            user: req.user._id,
            prompt: prompt.trim(),
            subject: emailData.subject,
            emailBody: emailData.emailBody,
            linkedInDM: emailData.linkedInDM,
            followUpEmail: emailData.followUpEmail
        });

        res.status(200).json(historyEntry);
    }
    catch(error){
        console.error("AI Generation Error:", error.response?.data || error.message);

        if (error.response?.status === 429){
            return res.status(429).json({
                message: 'Too many requests. Please wait a moment before trying again.',
                error: 'Rate limit exceed'
            });
        }

        res.status(500).json({
            message: 'Failed to generate email',
            error: error.response?.data?.error?.message || error.message
        });
    }
};


exports.getHistory = async (req, res) => {
    try {
        const history = await EmailHistory.find({ user: req.user._id }).sort({createdAt: -1});
        res.status(200).json(history);
    } catch(error) {
        res.status(500).json({message: 'Failed to fetch History', error: error.message});
    }
}
