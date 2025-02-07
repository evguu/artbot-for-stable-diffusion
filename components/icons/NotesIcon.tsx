// Modified via: https://tabler-icons.io/

const NotesIcon = ({
  className,
  fill = 'none',
  size = 24,
  stroke = 'currentColor'
}: {
  className?: string
  fill?: string
  size?: number
  stroke?: string
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth="1"
      stroke={stroke}
      fill={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <rect x="5" y="3" width="14" height="18" rx="2"></rect>
      <line x1="9" y1="7" x2="15" y2="7"></line>
      <line x1="9" y1="11" x2="15" y2="11"></line>
      <line x1="9" y1="15" x2="13" y2="15"></line>
    </svg>
  )
}

export default NotesIcon
