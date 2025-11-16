/**
 * Twitter/X Handler
 * Replicates special Twitter handling from Markdowner
 * Based on src/index.ts:162-181 and src/index.ts:218-240
 */

interface Tweet {
  text?: string;
  user?: {
    name?: string;
    screen_name?: string;
  };
  photos?: Array<{ url: string }>;
  created_at?: string;
  favorite_count?: number;
  conversation_count?: number;
}

/**
 * Fetch tweet data from Twitter's syndication API
 * Replicates getTweet() at src/index.ts:162-181
 */
export async function getTweet(tweetID: string): Promise<Tweet | null> {
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetID}&lang=en&features=tfw_timeline_list%3A%3Btfw_follower_count_sunset%3Atrue%3Btfw_tweet_edit_backend%3Aon%3Btfw_refsrc_session%3Aon%3Btfw_fosnr_soft_interventions_enabled%3Aon%3Btfw_show_birdwatch_pivots_enabled%3Aon%3Btfw_show_business_verified_badge%3Aon%3Btfw_duplicate_scribes_to_settings%3Aon%3Btfw_use_profile_image_shape_enabled%3Aon%3Btfw_show_blue_verified_badge%3Aon%3Btfw_legacy_timeline_sunset%3Atrue%3Btfw_show_gov_verified_badge%3Aon%3Btfw_show_business_affiliate_badge%3Aon%3Btfw_tweet_edit_frontend%3Aon&token=4c2mmul6mnh`;

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'TE': 'Trailers',
      },
    });

    console.log(`Twitter API response status: ${resp.status}`);

    if (!resp.ok) {
      return null;
    }

    const data = await resp.json() as Tweet;
    return data;

  } catch (error: any) {
    console.error(`Error fetching tweet ${tweetID}:`, error.message);
    return null;
  }
}

/**
 * Convert tweet data to markdown format
 * Replicates logic from src/index.ts:230-236
 */
export function formatTweetMarkdown(tweet: Tweet): string {
  const username = tweet.user?.name ?? tweet.user?.screen_name ?? 'Unknown';
  const text = tweet.text ?? '';
  const images = tweet.photos ? tweet.photos.map((photo) => photo.url).join(', ') : 'none';
  const time = tweet.created_at ?? 'Unknown';
  const likes = tweet.favorite_count ?? 0;
  const replies = tweet.conversation_count ?? 0;

  return `Tweet from @${username}

${text}

Images: ${images}
Time: ${time}, Likes: ${likes}, Retweets: ${replies}

raw: ${JSON.stringify(tweet)}`;
}

/**
 * Check if URL is a Twitter/X URL
 */
export function isTwitterUrl(url: string): boolean {
  return url.startsWith('https://x.com') || url.startsWith('https://twitter.com');
}

/**
 * Extract tweet ID from Twitter/X URL
 */
export function extractTweetId(url: string): string | null {
  const parts = url.split('/');
  const tweetId = parts.pop();
  return tweetId || null;
}
