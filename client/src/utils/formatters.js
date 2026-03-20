export function formatCoins(n, label = 'coins') {
  return `${n.toLocaleString()} ${label}`;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function categoryLabel(cat) {
  const map = { physical: '🎮 Physical', privilege: '⭐ Privilege', experience: '🎉 Experience' };
  return map[cat] || cat;
}

export function categoryColor(cat) {
  const map = {
    physical: 'bg-blue-100 text-blue-800',
    privilege: 'bg-yellow-100 text-yellow-800',
    experience: 'bg-green-100 text-green-800'
  };
  return map[cat] || 'bg-gray-100 text-gray-800';
}

export function statusColor(status) {
  const map = {
    available: 'bg-green-100 text-green-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
    pending:   'bg-yellow-100 text-yellow-700',
    fulfilled: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}
