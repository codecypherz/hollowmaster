/**
 * Holds Tab inside `panel`: past its last stop — a button or a field — it goes
 * to the first, before the first to the last, and from anywhere that is not one
 * of them back in. Call it with every keydown; anything but Tab is left alone.
 *
 * The stops are read on each press, so a panel whose stops come and go needs
 * nothing said about it.
 */
export function trapTab(event: KeyboardEvent, panel: HTMLElement): void {
  if (event.key !== 'Tab') return;

  const stops = [...panel.querySelectorAll<HTMLElement>('button, input')];
  if (stops.length === 0) return;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && (active === first || !stops.includes(active!))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !stops.includes(active!))) {
    event.preventDefault();
    first.focus();
  }
}
