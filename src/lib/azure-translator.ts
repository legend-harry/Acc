type TranslationRequest = {
  texts: string[];
  to: string;
  textType?: 'plain' | 'html';
};

type AzureTranslationItem = {
  translations?: Array<{ text: string }>;
};

const DEFAULT_ENDPOINT = 'https://api.cognitive.microsofttranslator.com';

export async function translateWithAzure({ texts, to, textType = 'plain' }: TranslationRequest) {
  const endpoint = (process.env.AZURE_TRANSLATOR_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/$/, '');
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;

  if (!key || !region) {
    return texts;
  }

  const query = new URLSearchParams({
    'api-version': '3.0',
    to,
  });

  if (textType === 'html') {
    query.set('textType', 'html');
  }

  const response = await fetch(`${endpoint}/translate?${query.toString()}`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(texts.map((text) => ({ Text: text }))),
  });

  if (!response.ok) {
    throw new Error(`Azure translation request failed with status ${response.status}`);
  }

  const data = (await response.json()) as AzureTranslationItem[];

  return data.map((entry, index) => entry.translations?.[0]?.text ?? texts[index]);
}
