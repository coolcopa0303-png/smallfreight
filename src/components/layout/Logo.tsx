/** SMALL FREIGHT mark (from the existing logo.svg) — left half uses currentColor so it reads on navy or white. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 81 37.5" aria-hidden focusable="false">
      <path
        fill="#0B52E1"
        fillRule="evenodd"
        d="M38.13 37.5v-2.94h10.23l1.77 2.94zm15.51 0h11.87l-1.77-2.94H51.87zm15.38 0H81l-1.73-2.94H67.25zm8.52-5.88L61.99 5.15H49.58l15.9 26.47zM60.26 2.2 58.96 0H46.49l1.33 2.2zM42.98 0h-4.85v2.2h6.17zm19 31.62H50.1L38.13 11.68V5.15h7.94zm-23.85 0v-14.1l8.47 14.1z"
      />
      <path
        fill="currentColor"
        d="m.38 0 1.33 2.2h11.93L12.32 0zm15.45 0 1.33 2.2h17.56V0zM3.47 5.15l15.9 26.47h11.94L15.41 5.15zm15.45 0 3.42 5.68h6.87l5.5 9.13V5.15zM0 31.62h15.86l-2.93-4.88H6.01L0 16.74zm0 5.88h19.4l-1.77-2.94H0zm21.14-2.94 1.77 2.94h11.8v-.22l-1.63-2.72z"
      />
    </svg>
  )
}
