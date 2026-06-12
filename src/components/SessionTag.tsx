import { Pill } from './Pill';
import type { Session } from '@/data/types';

interface Props {
  session: Session;
  reduced?: boolean;
}

export function SessionTag({ session, reduced }: Props) {
  if (reduced) return <Pill variant="sage" label="REDUCED" />;
  if (session.type === 'gym') return <Pill variant="mid" label="GYM" />;
  if (session.type === 'mobility') return <Pill variant="sage" label="MOBILITY" />;
  if (session.type === 'run' && session.subtype === 'interval')
    return <Pill variant="ember" label="INTERVAL RUN" />;
  if (session.type === 'run' && session.subtype === 'long')
    return <Pill variant="sage" label="LONG RUN" />;
  return <Pill variant="sage" label="EASY RUN" />;
}
