const Avatar = ({ name = '', src = null, size = 'h-16 w-16', textSize = 'text-lg' }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return <img src={src} alt={name} className={`${size} rounded-full object-cover shrink-0`} />;
  }

  return (
    <div
      className={`${size} rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0`}
    >
      <span className={`${textSize} font-semibold text-primary`}>{initials || '?'}</span>
    </div>
  );
};

export default Avatar;
