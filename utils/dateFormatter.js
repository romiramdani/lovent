const formatDate = (dateStr, fallback = "-") => {
    if(!dateStr) return fallback;

    const date = new Date(dateStr);
    if(isNaN(date)) return fallback;

    return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Jakarta',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

module.exports = {formatDate};