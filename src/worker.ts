// Cloudflare Worker - AI Proxy for Workers AI (ES Module format)

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Proxy /api/ai to Workers AI
    if (url.pathname === '/api/ai' || url.pathname.startsWith('/api/ai')) {
      const accountId = env.CF_ACCOUNT_ID || 'b7a628f29ce7b9e4d28128bf5b4442b6';
      const apiToken = env.CF_API_TOKEN || 'EmLAmGq9ejsEaa7VHjxH6aGJgjoe2woyKfMXCu93';
      
      const body = await request.text();
      let jsonBody;
      try {
        jsonBody = JSON.parse(body);
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }
      
      const model = jsonBody.model || '@cf/meta/llama-3.1-8b-instruct';
      
      const modelEndpoints: Record<string, string> = {
        '@cf/meta/llama-3.1-8b-instruct': '/ai/run/@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3-8b-instruct': '/ai/run/@cf/meta/llama-3-8b-instruct',
        '@cf/google/gemma-2-2b': '/ai/run/@cf/google/gemma-2-2b',
      };
      
      const endpoint = modelEndpoints[model] || '/ai/run/' + model;
      const workersAiUrl = 'https://api.cloudflare.com/client/v4/accounts/' + accountId + endpoint;
      
      const response = await fetch(workersAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiToken,
        },
        body: JSON.stringify({
          messages: jsonBody.messages,
          max_tokens: jsonBody.max_tokens || 1024,
        }),
      });
      
      const responseData = await response.json();
      
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Execute tool - MCP-like tools
    if (url.pathname === '/api/execute-tool') {
      const body = await request.text();
      let jsonBody;
      try {
        jsonBody = JSON.parse(body);
      } catch {
        return new Response('Invalid JSON', { status: 400 });
      }
      
      const { tool, args = {} } = jsonBody;
      
      let result;
      
      switch (tool) {
        case 'web_search': {
          const query = args.query || args.q || '';
          if (!query) {
            result = { error: 'query required' };
          } else {
            // Use Brave Search or DuckDuckGo Lite
            try {
              const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
              const searchRes = await fetch(searchUrl);
              const html = await searchRes.text();
              
              // Parse results from HTML
              const results: string[] = [];
              const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
              let match;
              let count = 0;
              while ((match = resultRegex.exec(html)) !== null && count < 5) {
                const title = match[2].replace(/<[^>]+>/g, '').trim();
                const link = match[1];
                if (title && link && !link.includes('youtube.com')) {
                  results.push(`- ${title}: ${link}`);
                  count++;
                }
              }
              
              if (results.length > 0) {
                result = { results: results.join('\n') };
              } else {
                // Fallback: try Wikipedia
                const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}`;
                const wikiRes = await fetch(wikiUrl);
                if (wikiRes.ok) {
                  result = { results: [`Wikipedia: ${wikiUrl}`] };
                } else {
                  result = { results: [] };
                }
              }
            } catch (e) {
              result = { error: 'Search failed', details: String(e) };
            }
          }
          break;
        }
        
        case 'fetch_url': {
          const fetchUrl = args.url;
          if (!fetchUrl) {
            result = { error: 'url required' };
          } else {
            try {
              const res = await fetch(fetchUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; SybekBot/1.0)',
                },
              });
              const text = await res.text();
              // Truncate to 10KB
              result = { 
                content: text.slice(0, 10000),
                status: res.status,
              };
            } catch (e) {
              result = { error: 'Fetch failed', details: String(e) };
            }
          }
          break;
        }
        
        case 'get_weather': {
          const city = args.city || args.q || 'New York';
          // Use wttr.in (no API key needed)
          try {
            const weatherUrl = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
            const weatherRes = await fetch(weatherUrl);
            const data = await weatherRes.json();
            const current = data.current_condition?.[0];
            if (current) {
              result = {
                city,
                temperature: current.temp_C,
                condition: current.weatherDesc?.[0]?.value,
                humidity: current.humidity,
                wind: current.windSpeed,
              };
            } else {
              result = { error: 'Weather not found' };
            }
          } catch (e) {
            result = { error: 'Weather API failed', details: String(e) };
          }
          break;
        }
        
        case 'get_current_time': {
          result = { 
            timestamp: Date.now(),
            datetime: new Date().toISOString(),
            timezone: 'UTC',
          };
          break;
        }
        
        case 'joke': {
          try {
            const jokeRes = await fetch('https://icanhazdadjoke.com/', {
              headers: { 'Accept': 'application/json' },
            });
            const data = await jokeRes.json();
            result = { joke: data.joke };
          } catch {
            result = { joke: 'Why do programmers prefer dark mode? Because light attracts bugs.' };
          }
          break;
        }
        
        case 'cat_fact': {
          try {
            const catRes = await fetch('https://catfact.ninja/fact');
            const data = await catRes.json();
            result = { fact: data.fact };
          } catch {
            result = { fact: 'Cats sleep for 70% of their lives.' };
          }
          break;
        }
        
        case 'dog_fact': {
          try {
            const dogRes = await fetch('https://dogapi.dog/api/v2/facts?limit=1');
            const data = await dogRes.json();
            result = { fact: data.data?.[0]?.attributes?.body || 'Dogs have wet noses.' };
          } catch {
            result = { fact: 'Dogs have wet noses to absorb scent chemicals.' };
          }
          break;
        }
        
        case 'quote': {
          try {
            const quoteRes = await fetch('https://api.quotable.io/random');
            const data = await quoteRes.json();
            result = { quote: data.content, author: data.author };
          } catch {
            result = { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' };
          }
          break;
        }
        
        case 'hackernews': {
          try {
            const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            const storyIds = await hnRes.json();
            const topIds = storyIds.slice(0, args.limit || 5);
            const stories = await Promise.all(
              topIds.map(async (id: number) => {
                const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                return storyRes.json();
              })
            );
            result = { 
              stories: stories.map((s: any) => `${s.title} - ${s.url || 'https://news.ycombinator.com/item?id=' + s.id}`),
            };
          } catch (e) {
            result = { error: 'HackerNews API failed', details: String(e) };
          }
          break;
        }
        
        case 'wikipedia': {
          const term = args.query || args.q || '';
          if (!term) {
            result = { error: 'query required' };
          } else {
            try {
              const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.replace(/ /g, '_'))}`;
              const wikiRes = await fetch(wikiUrl);
              if (wikiRes.ok) {
                const data = await wikiRes.json();
                result = {
                  title: data.title,
                  extract: data.extract,
                  url: data.content_urls?.desktop?.page,
                };
              } else {
                result = { error: 'Page not found' };
              }
            } catch (e) {
              result = { error: 'Wikipedia API failed', details: String(e) };
            }
          }
          break;
        }
        
        case 'reddit': {
          const subreddit = args.subreddit || 'popular';
          try {
            const redditRes = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=5`);
            const data = await redditRes.json();
            const posts = data.data?.children?.map((c: any) => ({
              title: c.data.title,
              score: c.data.score,
              url: c.data.url,
            })) || [];
            result = { posts };
          } catch (e) {
            result = { error: 'Reddit API failed', details: String(e) };
          }
          break;
        }
        
        case 'word_of_day': {
          try {
            const wordRes = await fetch('https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=demo');
            const data = await wordRes.json();
            result = {
              word: data.word,
              definition: data.definitions?.[0]?.definition,
              example: data.examples?.[0]?.text,
            };
          } catch {
            result = { word: 'serendipity', definition: 'The occurrence of events by chance in a happy way.' };
          }
          break;
        }
        
        case 'define_word': {
          const word = args.word || args.query || '';
          if (!word) {
            result = { error: 'word required' };
          } else {
            try {
              const defRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
              if (defRes.ok) {
                const data = await defRes.json();
                result = {
                  word: data[0]?.word,
                  phonetic: data[0]?.phonetic,
                  definition: data[0]?.meanings?.[0]?.definitions?.[0]?.definition,
                };
              } else {
                result = { error: 'Word not found' };
              }
            } catch (e) {
              result = { error: 'Dictionary API failed', details: String(e) };
            }
          }
          break;
        }
        
        case 'convert_currency': {
          const { from, to, amount } = args;
          // Simple static rates (for demo)
          const rates: Record<string, number> = { USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, MXN: 20 };
          if (!from || !to || !amount) {
            result = { error: 'from, to, and amount required' };
          } else if (rates[from] && rates[to]) {
            const usdAmount = amount / rates[from];
            const converted = usdAmount * rates[to];
            result = { from, to, amount, result: converted.toFixed(2) };
          } else {
            result = { error: 'Unsupported currency' };
          }
          break;
        }
        
        case 'get_ip': {
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const data = await ipRes.json();
            result = { ip: data.ip };
          } catch {
            result = { error: 'Could not get IP' };
          }
          break;
        }
        
        default:
          result = { error: `Unknown tool: ${tool}` };
      }
      
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Handle CORS preflight
    if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
