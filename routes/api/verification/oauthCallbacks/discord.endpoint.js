import { errors as openidErrors } from 'openid-client'
import { discord } from '../../../../lib/oauthClients.js'
import { encrypt } from '../../../../lib/simpleCrypto.js'
import { configSync } from '../../../../lib/preferencesReader.js'

export function get (req, res) {
  discord.callback(`${configSync().baseURL}/api/verification/oauthCallbacks/discord`, discord.callbackParams(req.url)).then(
    (tokens) => {
      res.cookie('oauthTokens.discord',
        encrypt(JSON.stringify(tokens)).toString('base64url'),
        {
          sameSite: 'lax',
          path: '/',
          maxAge: 3600000
        }
      )
      return res.redirect(302, '/verification/confirm')
    },
    (reason) => {
      if (reason instanceof openidErrors.OPError) {
        switch (reason.error) {
          case 'invalid_grant':
            return res.status(400).render('error', {
              code: '400',
              description: 'Bad Request',
              explanation: 'You probably refreshed this page. Please start verification again. In tech-speak, the OAuth authorization code in the URL is invalid.'
            })
          default:
            return res.status(502).render('error', {
              code: '502',
              description: 'Bad Gateway',
              explanation: 'Something bad happened when communicating with Discord, and we\'re not quite sure how to explain it to you.'
            })
        }
      } else {
        return res.status(500).render('error', {
          code: '500',
          description: 'Internal Server Error',
          explanation: 'Something bad happened, and we\'re not quite sure how to explain it to you.'
        })
      }
    })
}
