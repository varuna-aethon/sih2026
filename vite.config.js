import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function varunaLlmProxyPlugin() {
  return {
    name: 'varuna-llm-proxy',
    configureServer(server) {
      server.middlewares.use('/api/varuna-llm', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { systemPrompt, userMessage, liveDataSnapshot, apiKey, provider = 'auto' } = JSON.parse(body || '{}');
              
              const activeKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
              
              if (!activeKey) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  error: 'NO_KEY', 
                  message: 'No LLM API key configured. Enter an OpenAI or Anthropic API key in the configuration panel.' 
                }));
                return;
              }

              const isAnthropic = (activeKey && activeKey.startsWith('sk-ant')) || 
                                  (!apiKey && process.env.ANTHROPIC_API_KEY) || 
                                  provider === 'anthropic';

              let replyText = '';

              if (isAnthropic) {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': activeKey,
                    'anthropic-version': '2023-06-01'
                  },
                  body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 600,
                    system: systemPrompt + '\n\nLIVE DATA SNAPSHOT:\n' + JSON.stringify(liveDataSnapshot, null, 2),
                    messages: [{ role: 'user', content: userMessage }]
                  })
                });

                if (!response.ok) {
                  const errJson = await response.json().catch(() => ({}));
                  throw new Error(errJson.error?.message || `Anthropic HTTP ${response.status}`);
                }

                const data = await response.json();
                replyText = data.content?.[0]?.text || '';
              } else {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeKey}`
                  },
                  body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                      {
                        role: 'system',
                        content: systemPrompt + '\n\nLIVE DATA SNAPSHOT:\n' + JSON.stringify(liveDataSnapshot, null, 2)
                      },
                      { role: 'user', content: userMessage }
                    ],
                    max_tokens: 600,
                    temperature: 0.1
                  })
                });

                if (!response.ok) {
                  const errJson = await response.json().catch(() => ({}));
                  throw new Error(errJson.error?.message || `OpenAI HTTP ${response.status}`);
                }

                const data = await response.json();
                replyText = data.choices?.[0]?.message?.content || '';
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                reply: replyText,
                provider: isAnthropic ? 'Anthropic Claude' : 'OpenAI GPT-4o-mini',
                grounded: true,
                timestamp: new Date().toISOString()
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'LLM_CALL_FAILED', message: err.message }));
            }
          });
        } else {
          res.writeHead(405);
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), varunaLlmProxyPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
