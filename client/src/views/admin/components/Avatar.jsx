const Avatar = ({ name, size = 'h-16 w-16', textSize = 'text-lg' }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`${size} rounded-full bg-primary/10 flex items-center justify-center shrink-0`}>
      <span className={`${textSize} font-semibold text-primary`}>{initials}</span>
    </div>
  );
};

export default Avatar;
