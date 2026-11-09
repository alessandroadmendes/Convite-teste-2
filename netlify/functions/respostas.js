const crypto = require('node:crypto');

function sameSecret(received, expected) {
  const a = Buffer.from(String(received || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

exports.handler = async function (event) {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  if (!['GET','DELETE'].includes(event.httpMethod)) return {statusCode:405,headers,body:JSON.stringify({erro:'Método não permitido.'})};
  const password = process.env.ADMIN_PASSWORD;
  const token = process.env.NETLIFY_API_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  if (!password || !token || !siteId) return {statusCode:503,headers,body:JSON.stringify({erro:'A área de gestão ainda não está configurada no Netlify.'})};
  if (!sameSecret(event.headers['x-admin-password'], password)) return {statusCode:401,headers,body:JSON.stringify({erro:'Palavra-passe incorreta.'})};
  const apiHeaders = {Authorization:`Bearer ${token}`};

  try {
    const formsResponse = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/forms`, {headers:apiHeaders});
    if (!formsResponse.ok) throw new Error(`Netlify Forms respondeu ${formsResponse.status}`);
    const form = (await formsResponse.json()).find(item => item.name === 'wedding-rsvp');
    if (!form) return {statusCode:200,headers,body:JSON.stringify(event.httpMethod==='GET'?{submissions:[]}:{deleted:0})};

    const submissions = [];
    for (let page=1; page<=20; page++) {
      const response = await fetch(`https://api.netlify.com/api/v1/forms/${encodeURIComponent(form.id)}/submissions?per_page=100&page=${page}`, {headers:apiHeaders});
      if (!response.ok) throw new Error(`Netlify Forms respondeu ${response.status}`);
      const batch = await response.json();
      submissions.push(...batch);
      if (batch.length < 100) break;
    }

    if (event.httpMethod === 'GET') {
      return {statusCode:200,headers,body:JSON.stringify({submissions:submissions.map(item=>({id:item.id,created_at:item.created_at,data:item.data||{}}))})};
    }

    let request = {};
    try { request = JSON.parse(event.body || '{}'); } catch (_) { return {statusCode:400,headers,body:JSON.stringify({erro:'Pedido inválido.'})}; }
    const allowed = new Set(submissions.map(item=>item.id));
    const ids = request.all === true ? [...allowed] : (allowed.has(request.id) ? [request.id] : []);
    if (!ids.length && request.all !== true) return {statusCode:404,headers,body:JSON.stringify({erro:'Resposta não encontrada.'})};
    let deleted = 0;
    for (let i=0; i<ids.length; i+=10) {
      const results = await Promise.all(ids.slice(i,i+10).map(id=>fetch(`https://api.netlify.com/api/v1/submissions/${encodeURIComponent(id)}`, {method:'DELETE',headers:apiHeaders})));
      for (const response of results) { if (response.ok) deleted++; else throw new Error(`Não foi possível eliminar uma resposta (${response.status})`); }
    }
    return {statusCode:200,headers,body:JSON.stringify({deleted})};
  } catch (error) {
    return {statusCode:502,headers,body:JSON.stringify({erro:'Não foi possível comunicar com o Netlify Forms.',detalhe:error.message})};
  }
};
