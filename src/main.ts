const clientId = '1b2f52fa234d4f769e0645b3613ce580'
const params = new URLSearchParams(window.location.search);
const code = params.get("code")

if (!code) {
  redirectToAuthCodeFlow(clientId)
} else {
  const accessToken = await getAccessToken(clientId, code)
  const profile = await fetchProfile(accessToken)
  populateUI(profile)
}

export async function redirectToAuthCodeFlow(clientId: string) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem("verifier", verifier);
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:5173/callback");
  params.append("scope", "user-read-private user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);
  const authorizeUrl = 'https://accounts.spotify.com/authorize'
  document.location = `${authorizeUrl}?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(
    String.fromCharCode.apply(null, [...new Uint8Array(digest)])
  ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<string> {
  const verifier = localStorage.getItem('verifier')
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', 'http://localhost:5173/callback')
  params.append('code_verifier', verifier!)
  
  const url = 'https://accounts.spotify.com/api/token'
  const result = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params,
  })
  const {access_token} = await result.json()

  return access_token
}

async function fetchProfile(token: string): Promise<any> {
  const result = await fetch('https://api.spotify.com/v1/me', {
    method: 'GET',
    headers: {Authorization: `Bearer ${token}`},
  })
  return await result.json()
}

function query(selector: string) {
  return document.querySelector(selector) as HTMLElement
}

function populateUI(profile: any) {
  query('#displayName').innerText = profile.display_name
  if (profile.images[0]) {
    const profileImage = new Image(200, 200)
    profileImage.src = profile.images[0].url
    query('#avatar').appendChild(profileImage)
  }
  query('#id').innerText = profile.id
  query('#email').innerText = profile.email
  query('#uri').innerText = profile.uri
  query('#uri').setAttribute('href', profile.external_urls.spotify)
  query('#url').innerText = profile.href
  query('#url').setAttribute('href', profile.href)
  query('#imgUrl').innerText = profile.images[0]?.url ?? '(sem imagem de perfil)'

}

