const BASE_URL = '/api';

function handleResponse(res) {
  if (!res.ok) {
    return res.json().then(data => {
      throw new Error(data.error || res.statusText);
    }).catch(err => {
      throw new Error(err.message || 'Request failed');
    });
  }
  return res.json();
}

export const auth = {
  whoami: () => fetch(`${BASE_URL}/auth/whoami`).then(handleResponse),
  parentLogin: (creds) => fetch(`${BASE_URL}/auth/parent/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  }).then(handleResponse),
  parentLogout: () => fetch(`${BASE_URL}/auth/parent/logout`, {
    method: 'POST',
  }).then(handleResponse),
  childLogin: (creds) => fetch(`${BASE_URL}/auth/child/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  }).then(handleResponse),
  childLogout: () => fetch(`${BASE_URL}/auth/child/logout`, {
    method: 'POST',
  }).then(handleResponse),
};

export const kids = {
  listAll: () => fetch(`${BASE_URL}/kids/all/list`).then(handleResponse),
  list: () => fetch(`${BASE_URL}/kids`).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/kids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  update: (kidId, data) => fetch(`${BASE_URL}/kids/${kidId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (kidId) => fetch(`${BASE_URL}/kids/${kidId}`, {
    method: 'DELETE',
  }).then(handleResponse),
};

export const chores = {
  list: () => fetch(`${BASE_URL}/chores`).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/chores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  update: (choreId, data) => fetch(`${BASE_URL}/chores/${choreId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  delete: (choreId) => fetch(`${BASE_URL}/chores/${choreId}`, {
    method: 'DELETE',
  }).then(handleResponse),
  myInstances: () => fetch(`${BASE_URL}/chores/my-instances`).then(handleResponse),
  openInstances: () => fetch(`${BASE_URL}/chores/open-instances`).then(handleResponse),
  completed: () => fetch(`${BASE_URL}/chores/completed`).then(handleResponse),
  submit: (instanceId, data) => fetch(`${BASE_URL}/chores/${instanceId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  claim: (instanceId) => fetch(`${BASE_URL}/chores/${instanceId}/claim`, {
    method: 'POST',
  }).then(handleResponse),
  join: (instanceId) => fetch(`${BASE_URL}/chores/${instanceId}/join`, {
    method: 'POST',
  }).then(handleResponse),
  pending: () => fetch(`${BASE_URL}/chores/pending`).then(handleResponse),
};

export const completions = {
  approve: (submissionId, data) => fetch(`${BASE_URL}/completions/${submissionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  reject: (submissionId, data) => fetch(`${BASE_URL}/completions/${submissionId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
};

export const shop = {
  listItems: () => fetch(`${BASE_URL}/shop/items`).then(handleResponse),
  list: () => fetch(`${BASE_URL}/shop/items`).then(handleResponse),
  createItem: (data) => fetch(`${BASE_URL}/shop/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  updateItem: (itemId, data) => fetch(`${BASE_URL}/shop/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
  deleteItem: (itemId) => fetch(`${BASE_URL}/shop/items/${itemId}`, {
    method: 'DELETE',
  }).then(handleResponse),
  redeem: (itemId) => fetch(`${BASE_URL}/shop/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId }),
  }).then(handleResponse),
  listRedemptions: () => fetch(`${BASE_URL}/shop/redemptions`).then(handleResponse),
  myRedemptions: () => fetch(`${BASE_URL}/shop/my-redemptions`).then(handleResponse),
  fulfill: (redemptionId) => fetch(`${BASE_URL}/shop/redemptions/${redemptionId}/fulfill`, {
    method: 'POST',
  }).then(handleResponse),
};

export const badges = {
  list: () => fetch(`${BASE_URL}/badges`).then(handleResponse),
  catalog: () => fetch(`${BASE_URL}/badges/catalog`).then(handleResponse),
  myBadges: () => fetch(`${BASE_URL}/badges/my-badges`).then(handleResponse),
  mine: () => fetch(`${BASE_URL}/badges/mine`).then(handleResponse),
};

export const notifications = {
  unread: () => fetch(`${BASE_URL}/notifications/unread`).then(handleResponse),
  markRead: (notifId) => fetch(`${BASE_URL}/notifications/${notifId}/read`, {
    method: 'POST',
  }).then(handleResponse),
};

export const settings = {
  get: () => fetch(`${BASE_URL}/settings`).then(handleResponse),
  update: (data) => fetch(`${BASE_URL}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse),
};

export const leaderboard = {
  get: () => fetch(`${BASE_URL}/leaderboard`).then(handleResponse),
};

export const ai = {
  narratives: (choreIds) =>
    fetch(`${BASE_URL}/ai/narratives?choreIds=${choreIds.join(',')}`).then(handleResponse),
  suggestChores: () =>
    fetch(`${BASE_URL}/ai/suggest-chores`, { method: 'POST' }).then(handleResponse),
};

export async function uploadProof(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/upload/proof`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}
