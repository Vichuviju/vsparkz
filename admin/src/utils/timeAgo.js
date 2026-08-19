import moment from 'moment';

export const timeAgo = (dateInput) => {
  if (!dateInput) return "";

  const now = moment();

  const time = moment(dateInput, "YYYY-MM-DD HH:mm:ss");

  const diffSeconds = now.diff(time, "seconds");
  const diffMinutes = now.diff(time, "minutes");
  const diffHours = now.diff(time, "hours");

  if (diffSeconds < 60) return "Now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return time.format("DD MMM YYYY");
}
