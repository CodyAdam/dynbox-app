import { type SVGProps } from "react";
const SvgComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="1em"
    height="1em"
    fill="currentcolor"
    strokeWidth="0"
    {...props}
  >
    <path d="M442.81 101.19 296.72 16.9a81.46 81.46 0 0 0-81.43 0l-146.1 84.29a81.482 81.482 0 0 0-40.76 70.57v168.47a81.47 81.47 0 0 0 40.76 70.57l146.1 84.29a81.46 81.46 0 0 0 81.43 0l146.1-84.29a81.482 81.482 0 0 0 40.76-70.57V171.76a81.47 81.47 0 0 0-40.76-70.57Zm-20.5 113.86c0 9.91-5.29 19.06-13.87 24.01l-138.59 79.95a27.69 27.69 0 0 1-27.7 0l-138.59-79.95a27.718 27.718 0 0 1-13.87-24.01v-38.98c0-9.91 5.29-19.06 13.87-24.01l138.59-79.95a27.69 27.69 0 0 1 27.7 0l138.59 79.95a27.718 27.718 0 0 1 13.87 24.01v38.98Z" />
  </svg>
);
export { SvgComponent as LogoMono };
