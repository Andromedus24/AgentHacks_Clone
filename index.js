// index.js
// research-tool: End-to-end research assistant using OpenRouter only
// - one-stop: search, summarize, chat, find gaps, devil's advocate, review
// - uses Semantic Scholar API and OpenRouter REST via axios
// - configure via .env (OPENROUTER_API_KEY, optional S2_API_KEY)

require('dotenv').config();
const axios = require('axios');

// Load and verify OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('⚠️  Missing OPENROUTER_API_KEY in .env');
  process.exit(1);
}

// Load Semantic Scholar API key (optional for higher rate limits)
const S2_API_KEY = process.env.S2_API_KEY || '';
if (!S2_API_KEY) {
  console.warn('ℹ️ No Semantic Scholar API key set; using public rate-limited endpoints.');
}
const S2_HEADERS = S2_API_KEY ? { 'x-api-key': S2_API_KEY } : {};

// OpenRouter chat endpoint
const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Helper: send a Chat request to OpenRouter
async function openRouterChat(messages, model = 'gpt-3.5-turbo', max_tokens = 200) {
  const payload = { model, messages, max_tokens };
  const headers = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type':  'application/json'
  };
  const resp = await axios.post(CHAT_URL, payload, { headers });
  return resp.data.choices[0].message.content.trim();
}

// Semantic Scholar API base URL
const S2_URL = 'https://api.semanticscholar.org/graph/v1';

// 1. Search papers by keyword
async function searchPapers(query, limit = 5) {
  try {
    const res = await axios.get(`${S2_URL}/paper/search`, {
      params: { query, limit, fields: 'title,abstract,url,authors' },
      headers: S2_HEADERS
    });
    return res.data.data;
  } catch (err) {
    if (err.response && err.response.status === 429) {
      console.warn('⚠️ Semantic Scholar rate limit hit; retrying after 5 seconds...');
      await new Promise(res => setTimeout(res, 5000));
      return searchPapers(query, limit);
    }
    throw err;
  }
}

// 2. Summarize an abstract
async function summarizeAbstract(abstract) {
  const prompt = `Summarize the following abstract in 3 sentences:\n${abstract}`;
  return openRouterChat([{ role: 'user', content: prompt }], 'gpt-3.5-turbo', 150);
}

// 3. Chat with a paper
async function chatWithPaper(abstract, question) {
  const messages = [
    { role: 'system', content: 'You are a research assistant.' },
    { role: 'user',   content: `Abstract: ${abstract}\nQuestion: ${question}` }
  ];
  return openRouterChat(messages, 'gpt-3.5-turbo', 200);
}

// 4. Discover gaps among abstracts
async function discoverGaps(abstracts) {
  const combined = abstracts.join('\n');
  const prompt = `Identify 3 open research gaps based on these abstracts:\n${combined}`;
  return openRouterChat([{ role: 'user', content: prompt }], 'gpt-3.5-turbo', 200);
}

// 5. Devil's advocate: opposing-viewpoint papers
async function devilAdvocate(topic, limit = 3) {
  const prompt = `List keywords for viewpoints opposing research on: ${topic}`;
  const kwText = await openRouterChat([{ role: 'user', content: prompt }], 'gpt-3.5-turbo', 50);
  const keywords = kwText.split(/,\s*/).slice(0, limit);

  const papers = [];
  for (const kw of keywords) {
    const found = await searchPapers(kw, 1);
    if (found.length) papers.push(found[0]);
  }
  return papers;
}

// 6. Get paper details by ID
async function getPaperDetails(paperId) {
  const res = await axios.get(`${S2_URL}/paper/${encodeURIComponent(paperId)}`, {
    params: {
      fields: 'title,abstract,authors,year,referenceCount,citationCount,fieldsOfStudy,url'
    },
    headers: S2_HEADERS
  });
  return res.data;
}

// 7. Fetch citations of a paper
async function getCitations(paperId, limit = 5) {
  const res = await axios.get(`${S2_URL}/paper/${encodeURIComponent(paperId)}/citations`, {
    params: { fields: 'citingPaper.title,citingPaper.authors,citingPaper.url', limit },
    headers: S2_HEADERS
  });
  return res.data.data.map(c => c.citingPaper);
}

// 8. Generate full literature review
async function generateReview(topic, limit = 5) {
  const papers = await searchPapers(topic, limit);
  let report = `# Literature Review on ${topic}\n\n`;

  for (const p of papers) {
    const summary = p.abstract ? await summarizeAbstract(p.abstract) : 'No abstract available.';
    const authors = p.authors.map(a => a.name).join(', ');

    report += `## ${p.title}\n`;
    report += `**Authors:** ${authors}\n`;
    report += `**URL:** ${p.url}\n\n`;
    report += `**Summary:** ${summary}\n\n`;
  }

  const abstracts = papers.map(p => p.abstract || '');
  const gaps = await discoverGaps(abstracts);
  report += `# Research Gaps\n${gaps}\n\n`;

  const opposing = await devilAdvocate(topic, 3);
  report += `# Opposing Viewpoints\n`;
  opposing.forEach(op => {
    report += `- **${op.title}**: ${op.url}\n`;
  });

  return report;
}

// Main CLI
async function main() {
  const [,, action, ...rest] = process.argv;
  switch (action) {
    case 'search':
      console.log(JSON.stringify(await searchPapers(rest.join(' ')), null, 2));
      break;
    case 'summarize':
      console.log(await summarizeAbstract(rest.join(' ')));
      break;
    case 'chat': {
      const [abstract, ...q] = rest;
      console.log(await chatWithPaper(abstract, q.join(' ')));
      break;
    }
    case 'gaps':
      console.log(await discoverGaps((await searchPapers(rest.join(' '))).map(p => p.abstract || '')));
      break;
    case 'devil':
      console.log(JSON.stringify(await devilAdvocate(rest.join(' ')), null, 2));
      break;
    case 'details':
      console.log(JSON.stringify(await getPaperDetails(rest[0]), null, 2));
      break;
    case 'citations':
      console.log(JSON.stringify(await getCitations(rest[0]), null, 2));
      break;
    case 'review':
      console.log(await generateReview(rest.join(' ')));
      break;
    default:
      console.log(`Usage:\n  node index.js search <keywords>\n  node index.js summarize <abstract>\n  node index.js chat <abstract> <question>\n  node index.js gaps <topic>\n  node index.js devil <topic>\n  node index.js details <paperId>\n  node index.js citations <paperId>\n  node index.js review <topic>`);
  }
}

main().catch(err => console.error(err));