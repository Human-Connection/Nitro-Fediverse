const crypto = require('crypto')
const request = require('request')
const debug = require('debug')('ea:signing')
//const CODES = require('../CodesEnum')
/*const jsig = require('jsonld-signatures')
const { RsaSignature2018 } = jsig.suites
const { PublicKeyProofPurpose } = jsig.purposes
import { RSAKeyPair } from 'crypto-ld'
import ActivityPub from '../ActivityPub'*/

module.exports = {
    signAndSend(activity, fromName, domain, targetDomain, url) {
        debug('inside signAndSend')
        // get the private key
        const d = new Date()
        /*ActivityPub.db.get('select "pubkey", "privkey" from "accounts" where "name" = $name', {$name: `${fromName}@${domain}`}, async (err, result) => {
            if (result === undefined) {
                return CODES.NOT_FOUND
            } else {
                debug('before sign!')
                // specify the public key object
                const publicKeyPem = result.pubkey
                const publicKey = {
                    '@context': jsig.SECURITY_CONTEXT_URL,
                    type: 'RsaVerificationKey2018',
                    id: `https://${domain}/users/${fromName}/keys/1`,
                    controller: `https://${domain}/users/${fromName}`,
                    publicKeyPem
                }
                const privateKeyPem = result.privkey
                const key = new RSAKeyPair({ ...publicKey, privateKeyPem })
                /!*const signedActivity = await jsig.sign(JSON.parse(activity), {
                    suite: new RsaSignature2018({ key }),
                    purpose: new PublicKeyProofPurpose()
                })*!/
                debug(`url = ${url}`)
                request({
                    url: url,
                    headers: {
                        'Host': targetDomain,
                        'Date': d.toUTCString(),
                        'Signature': httpSigner(result.privkey, targetDomain, domain, fromName),
                        'Content-Type': 'application/activity+json'
                    },
                    method: 'POST',
                    body: typeof activity === 'object' ? JSON.stringify(activity) : activity
                }, (error, response) => {
                    if (error) {
                        debug(`Error = ${JSON.stringify(error, null, 2)}`)
                        return CODES.SERVER_ERROR
                    } else {
                        debug('Response:', JSON.stringify(response.headers, null, 2))
                        return CODES.OK
                    }
                })
            }
        })*/
    },
    httpSigner

}

function httpSigner(privKey, targetDomain, domain, name) {
    const signer = crypto.createSign('sha256')
    const d = new Date()
    const stringToSign = `(request-target): post /inbox\nhost: ${targetDomain}\ndate: ${d.toUTCString()}`
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privKey)
    const signature_b64 = signature.toString('base64')
    return `keyId="https://${domain}/users/${name}/keys/1",headers="(request-target) host date",signature="${signature_b64}"`
}

// specify the public key owner object
/*const testPublicKeyOwner = {
    "@context": jsig.SECURITY_CONTEXT_URL,
    '@id': 'https://example.com/i/alice',
    publicKey: [testPublicKey]
}*/
