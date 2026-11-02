import React from 'react';

/**
 * 20 Prototype SVG Icon Paths extracted directly from Safe Tech Billing prototype.
 * Stroke: 1.8, viewBox: 0 0 24 24, fill: none, stroke: currentColor.
 */
export const ICON_PATHS: Record<string, React.ReactNode> = {
  dash: <path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z" />,
  quote: (
    <>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  inv: (
    <>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  rec: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9.5v5M17 9.5v5" />
    </>
  ),
  cust: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </>
  ),
  rep: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </>
  ),
  set: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
  log: (
    <>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  bp: (
    <>
      <path d="M3 7l9-4 9 4-9 4z" />
      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  send: (
    <>
      <path d="M22 2 11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  cash: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h.01M18 12h.01" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </>
  ),
  down: (
    <>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  alert: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
};

export type IconName = keyof typeof ICON_PATHS;

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name?: IconName;
  size?: number | string;
  className?: string;
  strokeWidth?: number | string;
}

/**
 * Central SVG Icon Component matching prototype's 1.8 stroke & 24x24 viewBox.
 */
export const Icon: React.FC<IconProps> = ({
  name = 'info',
  size = 18,
  className = '',
  strokeWidth = 1.8,
  ...props
}) => {
  const content = ICON_PATHS[name] || ICON_PATHS.info;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {content}
    </svg>
  );
};

// Named icon convenience wrappers
export const IconDashboard: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="dash" {...p} />;
export const IconQuotation: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="quote" {...p} />;
export const IconInvoice: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="inv" {...p} />;
export const IconReceipt: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="rec" {...p} />;
export const IconCustomer: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="cust" {...p} />;
export const IconReport: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="rep" {...p} />;
export const IconSettings: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="set" {...p} />;
export const IconAudit: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="log" {...p} />;
export const IconBlueprint: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="bp" {...p} />;

export const IconPlus: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="plus" {...p} />;
export const IconX: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="x" {...p} />;
export const IconEye: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="eye" {...p} />;
export const IconLock: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="lock" {...p} />;
export const IconSend: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="send" {...p} />;
export const IconCopy: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="copy" {...p} />;
export const IconCash: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="cash" {...p} />;
export const IconArrow: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="arrow" {...p} />;
export const IconInfo: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="info" {...p} />;
export const IconDownload: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="down" {...p} />;
export const IconTrash: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="trash" {...p} />;
export const IconCheck: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="check" {...p} />;
export const IconSearch: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="search" {...p} />;
export const IconAlertTriangle: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="alert" {...p} />;
export const IconFileText: React.FC<Omit<IconProps, 'name'>> = (p) => <Icon name="inv" {...p} />;
