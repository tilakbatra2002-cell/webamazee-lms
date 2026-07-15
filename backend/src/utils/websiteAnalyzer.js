const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Fetches raw HTML of a page with a timeout, following one redirect level.
 */
function fetchHtml(targetUrl, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch (e) {
      return reject(new Error('Invalid URL'));
    }

    const lib = parsed.protocol === 'http:' ? http : https;
    const start = Date.now();

    const req = lib.get(
      parsed.href,
      {
        timeout: timeoutMs,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 WebamazeeBot/1.0',
        },
      },
      (res) => {
        // Follow a single redirect
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          return fetchHtml(new URL(res.headers.location, parsed.href).href, timeoutMs)
            .then(resolve)
            .catch(reject);
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            html: data,
            protocol: parsed.protocol,
            loadTimeMs: Date.now() - start,
            statusCode: res.statusCode,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', (err) => reject(err));
  });
}

function extractMeta(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function detectTechnologies(html) {
  const techs = [];
  const checks = [
    [/wp-content|wp-includes/i, 'WordPress'],
    [/cdn\.shopify\.com/i, 'Shopify'],
    [/wixstatic\.com/i, 'Wix'],
    [/squarespace\.com/i, 'Squarespace'],
    [/react/i, 'React'],
    [/webflow/i, 'Webflow'],
    [/elementor/i, 'Elementor'],
    [/woocommerce/i, 'WooCommerce'],
  ];
  checks.forEach(([regex, name]) => {
    if (regex.test(html)) techs.push(name);
  });
  return techs;
}

async function analyzeWebsite(url) {
  const result = {
    analyzed: false,
    hasSSL: false,
    isMobileFriendly: false,
    hasContactForm: false,
    hasWhatsAppButton: false,
    socialLinks: {},
    metaTitle: '',
    metaDescription: '',
    loadTimeMs: 0,
    technologies: [],
    score: 0,
    analyzedAt: new Date(),
    error: '',
  };

  if (!url) {
    result.error = 'No website URL provided';
    return result;
  }

  try {
    const { html, protocol, loadTimeMs } = await fetchHtml(url);
    result.analyzed = true;
    result.hasSSL = protocol === 'https:';
    result.loadTimeMs = loadTimeMs;
    result.isMobileFriendly = /name=["']viewport["']/i.test(html);
    result.hasContactForm = /<form[\s\S]*?(contact|message|email)[\s\S]*?<\/form>/i.test(html) || /<form/i.test(html);
    result.hasWhatsAppButton = /wa\.me|whatsapp/i.test(html);
    result.metaTitle = extractMeta(html, /<title[^>]*>([^<]*)<\/title>/i);
    result.metaDescription = extractMeta(
      html,
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    result.technologies = detectTechnologies(html);

    const social = {};
    const socialPatterns = {
      facebook: /https?:\/\/(www\.)?facebook\.com\/[^"'\s)]+/i,
      instagram: /https?:\/\/(www\.)?instagram\.com\/[^"'\s)]+/i,
      linkedin: /https?:\/\/(www\.)?linkedin\.com\/[^"'\s)]+/i,
      twitter: /https?:\/\/(www\.)?(twitter|x)\.com\/[^"'\s)]+/i,
      youtube: /https?:\/\/(www\.)?youtube\.com\/[^"'\s)]+/i,
    };
    Object.entries(socialPatterns).forEach(([key, regex]) => {
      const m = html.match(regex);
      if (m) social[key] = m[0];
    });
    result.socialLinks = social;

    // Scoring (0-100)
    let score = 0;
    if (result.hasSSL) score += 15;
    if (result.isMobileFriendly) score += 20;
    if (result.hasContactForm) score += 15;
    if (result.hasWhatsAppButton) score += 10;
    if (Object.keys(social).length > 0) score += 10;
    if (result.metaTitle) score += 10;
    if (result.metaDescription) score += 10;
    if (result.loadTimeMs < 2000) score += 10;
    else if (result.loadTimeMs < 4000) score += 5;

    result.score = Math.min(score, 100);
  } catch (err) {
    result.error = err.message;
    result.score = 0;
  }

  return result;
}

function scoreToPriority(score, hasWebsite) {
  if (!hasWebsite) return 'High'; // no website = biggest opportunity
  if (score < 40) return 'High';
  if (score < 70) return 'Medium';
  return 'Low';
}

module.exports = { analyzeWebsite, scoreToPriority };
