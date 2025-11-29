const fetch = require('node-fetch');

// Discord epoch in milliseconds
const DISCORD_EPOCH = 1420070400000n;

/**
 * Convert Discord snowflake ID to creation date
 */
function snowflakeToDate(snowflake) {
  const id = BigInt(snowflake);
  const timestamp = (id >> 22n) + DISCORD_EPOCH;
  return new Date(Number(timestamp));
}

/**
 * Verify a Discord token and fetch user information
 * @param {string} token - Discord token to verify
 * @returns {Promise<Object>} - User info or error object
 */
async function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      error: 'Token must be a non-empty string',
    };
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'GET',
      headers: {
        Authorization: token,
        'User-Agent': 'Discord-Token-Verifier/1.0',
      },
    });

    if (response.status === 401) {
      return {
        valid: false,
        error: 'Token is invalid or expired',
        statusCode: 401,
      };
    }

    if (response.status === 429) {
      return {
        valid: false,
        error: 'Rate limited by Discord API. Try again in a few moments.',
        statusCode: 429,
      };
    }

    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    const user = await response.json();
    const createdAt = snowflakeToDate(user.id);

    return {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        tag: `${user.username}#${user.discriminator}`,
        email: user.email || 'Not provided',
        verified: user.verified,
        mfaEnabled: user.mfa_enabled,
        avatar: user.avatar,
        banner: user.banner,
        accentColor: user.accent_color,
        locale: user.locale,
        premiumType: user.premium_type || 0,
      },
      accountCreated: {
        iso: createdAt.toISOString(),
        readable: createdAt.toLocaleString(),
        timestamp: createdAt.getTime(),
      },
      statusCode: 200,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Network error: ${error.message}`,
    };
  }
}

module.exports = { verifyToken, snowflakeToDate };