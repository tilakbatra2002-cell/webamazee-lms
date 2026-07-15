const puppeteer = require('puppeteer');

/**
 * Scrapes Google Maps search results for a keyword + location.
 * Yields results incrementally via onResult callback so the caller can
 * persist to DB and broadcast progress in real time.
 *
 * NOTE: Google Maps' DOM structure changes periodically. Selectors below
 * are current as of writing but may need occasional maintenance. Scraping
 * Google Maps at scale is against Google's Terms of Service — keep volumes
 * modest and add delays between jobs.
 */
async function scrapeGoogleMaps({ keyword, location, maxLeads, onResult, onProgress, shouldStop }) {
  const browser = await puppeteer.launch({
  executablePath: puppeteer.executablePath(),
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process'
  ],
});

  const results = [];
  const seen = new Set();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
    );
    await page.setViewport({ width: 1366, height: 900 });
    page.setDefaultNavigationTimeout(Number(process.env.SCRAPER_NAV_TIMEOUT_MS) || 45000);

    const query = encodeURIComponent(`${keyword} in ${location}`);
    await page.goto(`https://www.google.com/maps/search/${query}`, {
      waitUntil: 'networkidle2',
    });

    // Wait for results feed panel
    const feedSelector = 'div[role="feed"]';
    await page.waitForSelector(feedSelector, { timeout: 20000 }).catch(() => {});

    let stagnantScrolls = 0;
    let lastCount = 0;

    while (results.length < maxLeads && stagnantScrolls < 6) {
      if (shouldStop && (await shouldStop())) break;

      // Scroll the feed to load more results
      await page.evaluate((sel) => {
        const feed = document.querySelector(sel);
        if (feed) feed.scrollBy(0, 1200);
      }, feedSelector);
      await new Promise((r) => setTimeout(r, 1500));

      const cards = await page.evaluate((sel) => {
        const feed = document.querySelector(sel);
        if (!feed) return [];
        const anchors = Array.from(feed.querySelectorAll('a[href*="/maps/place/"]'));
        return anchors.map((a) => a.href);
      }, feedSelector);

      const uniqueLinks = [...new Set(cards)];

      for (const link of uniqueLinks) {
        if (results.length >= maxLeads) break;
        if (seen.has(link)) continue;
        seen.add(link);

        if (shouldStop && (await shouldStop())) break;

        try {
          const detailPage = await browser.newPage();
          await detailPage.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
          await detailPage.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

          const data = await detailPage.evaluate(() => {
            const getText = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

            const name = getText('h1');

            // Rating + reviews often in a button/span combo near the top
            let rating = 0;
            let reviewCount = 0;
            const ratingEl = document.querySelector('span[aria-hidden="true"]');
            const bodyText = document.body.innerText;
            const ratingMatch = bodyText.match(/(\d\.\d)\s*(?:stars|\()/i) || bodyText.match(/(\d\.\d)/);
            if (ratingMatch) rating = parseFloat(ratingMatch[1]);
            const reviewMatch = bodyText.match(/([\d,]+)\s+reviews?/i);
            if (reviewMatch) reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''), 10);

            // Address, phone, website via data-item-id attributes
            const address =
              document.querySelector('button[data-item-id="address"]')?.textContent?.trim() || '';
            const phone =
              document.querySelector('button[data-item-id^="phone"]')?.textContent?.trim() || '';
            const website =
              document.querySelector('a[data-item-id="authority"]')?.href || '';
            const category =
              document.querySelector('button[jsaction*="category"]')?.textContent?.trim() || '';

            return { name, rating, reviewCount, address, phone, website, category };
          });

          // Extract coordinates from URL if present (format: @lat,lng,zoom)
          const coordMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          const coordinates = coordMatch
            ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
            : undefined;

          await detailPage.close();

          if (data.name) {
            const lead = {
              businessName: data.name,
              category: data.category || keyword,
              rating: data.rating || 0,
              reviewCount: data.reviewCount || 0,
              address: data.address || '',
              phone: data.phone || '',
              website: data.website || '',
              googleMapsUrl: link,
              location: coordinates,
            };
            results.push(lead);
            if (onResult) await onResult(lead);
          }
        } catch (innerErr) {
          // Skip this business on error, continue scraping others
          continue;
        }

        if (onProgress) {
          await onProgress({
            currentBusiness: results[results.length - 1]?.businessName || '',
            totalFound: results.length,
          });
        }
      }

      if (uniqueLinks.length === lastCount) {
        stagnantScrolls += 1;
      } else {
        stagnantScrolls = 0;
      }
      lastCount = uniqueLinks.length;
    }
  } finally {
    await browser.close();
  }

  return results;
}

module.exports = { scrapeGoogleMaps };
