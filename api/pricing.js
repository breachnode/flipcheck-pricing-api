
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { model } = req.query;
  if (!model) return res.status(400).json({ error: 'Model required' });

  const formattedModel = model.toLowerCase().replace(/ /g, '-');

  async function scrapeSwappa() {
    try {
      const url = `https://swappa.com/buy/${formattedModel}`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const price = $('.listing_price').first().text().replace(/\$/g, '');
      return parseFloat(price) || null;
    } catch {
      return null;
    }
  }

  async function scrapeSellCell() {
    try {
      const url = `https://www.sellcell.com/apple/${formattedModel}/`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const price = $('.price').first().text().replace(/\$/g, '');
      return parseFloat(price) || null;
    } catch {
      return null;
    }
  }

  async function scrapeGazelle() {
    try {
      const modelMap = {
        'iphone-13': 'iphone-13',
        'iphone-13-pro': 'iphone-13-pro',
        'iphone-12': 'iphone-12'
      };
      const mapped = modelMap[formattedModel] || 'iphone-13';
      const url = `https://www.gazelle.com/buy/used/${mapped}`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const price = $('.price-container span').first().text().replace(/\$/g, '');
      return parseFloat(price) || null;
    } catch {
      return null;
    }
  }

  const [swappa, sellcell, gazelle] = await Promise.all([
    scrapeSwappa(),
    scrapeSellCell(),
    scrapeGazelle()
  ]);

  const prices = [swappa, sellcell, gazelle].filter(Boolean);
  const average = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;

  res.json({ swappa, sellcell, gazelle, average });
}
